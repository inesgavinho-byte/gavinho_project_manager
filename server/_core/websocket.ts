import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { sdk } from "./sdk";
import type { User } from "../../drizzle/schema";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  user?: User;
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      noServer: true,
      path: "/ws/notifications"
    });

    // Handle upgrade requests
    server.on("upgrade", (request: IncomingMessage, socket: any, head: Buffer) => {
      if (request.url === "/ws/notifications") {
        this.handleUpgrade(request, socket, head);
      }
    });

    this.wss.on("connection", this.handleConnection.bind(this));
  }

  private async handleUpgrade(request: IncomingMessage, socket: any, head: Buffer) {
    try {
      // Extract token from query string or cookie
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      const token = url.searchParams.get("token") || this.extractTokenFromCookie(request);

      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Verify token using SDK
      // Create a mock request object with the session cookie
      const mockReq = {
        headers: { cookie: `session=${token}` }
      } as any;
      
      const user = await sdk.authenticateRequest(mockReq);
      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Complete the upgrade
      this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        const authWs = ws as AuthenticatedWebSocket;
        authWs.userId = user.id;
        authWs.user = user;
        this.wss.emit("connection", authWs, request);
      });
    } catch (error) {
      console.error("[WebSocket] Upgrade error:", error);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    }
  }

  private extractTokenFromCookie(request: IncomingMessage): string | null {
    const cookies = request.headers.cookie;
    if (!cookies) return null;

    const match = cookies.match(/session=([^;]+)/);
    return match ? match[1] : null;
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    const userId = ws.userId;
    if (!userId) {
      ws.close(1008, "Unauthorized");
      return;
    }

    console.log(`[WebSocket] User ${userId} connected`);

    // Add client to the map
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    // Handle messages
    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error("[WebSocket] Message parse error:", error);
      }
    });

    // Handle close
    ws.on("close", () => {
      console.log(`[WebSocket] User ${userId} disconnected`);
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(userId);
        }
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: "connected",
      message: "WebSocket connection established",
      timestamp: new Date().toISOString()
    }));
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: any) {
    // Handle ping/pong for keep-alive
    if (message.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
    }
  }

  /**
   * Send notification to specific user(s)
   */
  public sendNotification(userIds: number | number[], notification: any) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];

    ids.forEach(userId => {
      const userClients = this.clients.get(userId);
      if (userClients) {
        const message = JSON.stringify({
          type: "notification",
          data: notification,
          timestamp: new Date().toISOString()
        });

        userClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    });
  }

  /**
   * Broadcast notification to all connected users
   */
  public broadcast(notification: any) {
    const message = JSON.stringify({
      type: "notification",
      data: notification,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((userClients) => {
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }

  /**
   * Get number of connected clients
   */
  public getConnectedCount(): number {
    return this.clients.size;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: number): boolean {
    return this.clients.has(userId) && this.clients.get(userId)!.size > 0;
  }
}

// Singleton instance
let wsServer: NotificationWebSocketServer | null = null;

export function initializeWebSocket(server: any): NotificationWebSocketServer {
  if (!wsServer) {
    wsServer = new NotificationWebSocketServer(server);
    console.log("[WebSocket] Notification WebSocket server initialized");
  }
  return wsServer;
}

export function getWebSocketServer(): NotificationWebSocketServer | null {
  return wsServer;
}
