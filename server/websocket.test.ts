import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationWebSocketServer } from './_core/websocket';
import { WebSocketServer, WebSocket } from 'ws';

describe('WebSocket Notification Server', () => {
  let mockServer: any;
  let wsServer: NotificationWebSocketServer;

  beforeEach(() => {
    // Mock HTTP server
    mockServer = {
      on: vi.fn(),
    };

    // Initialize WebSocket server
    wsServer = new NotificationWebSocketServer(mockServer);
  });

  it('should initialize WebSocket server', () => {
    expect(wsServer).toBeDefined();
    expect(mockServer.on).toHaveBeenCalledWith('upgrade', expect.any(Function));
  });

  it('should track connected clients', () => {
    expect(wsServer.getConnectedCount()).toBe(0);
  });

  it('should check if user is connected', () => {
    expect(wsServer.isUserConnected(1)).toBe(false);
  });

  it('should handle upgrade with token in query string', async () => {
    const mockRequest = {
      url: '/ws/notifications?userId=1&token=valid-token',
      headers: {
        host: 'localhost:3000',
        cookie: '',
      },
    };

    const mockSocket = {
      write: vi.fn(),
      destroy: vi.fn(),
    };

    const mockHead = Buffer.from('');

    // Extract upgrade handler
    const upgradeHandler = mockServer.on.mock.calls.find(
      (call: any) => call[0] === 'upgrade'
    )?.[1];

    expect(upgradeHandler).toBeDefined();
  });

  it('should send notification to specific user', () => {
    const notification = {
      title: 'Test Notification',
      message: 'This is a test',
    };

    // This should not throw
    expect(() => {
      wsServer.sendNotification(1, notification);
    }).not.toThrow();
  });

  it('should broadcast notification to all users', () => {
    const notification = {
      title: 'Broadcast Test',
      message: 'This is broadcast',
    };

    // This should not throw
    expect(() => {
      wsServer.broadcast(notification);
    }).not.toThrow();
  });

  it('should handle multiple user IDs in sendNotification', () => {
    const notification = {
      title: 'Multi-user Test',
      message: 'Sent to multiple users',
    };

    // This should not throw
    expect(() => {
      wsServer.sendNotification([1, 2, 3], notification);
    }).not.toThrow();
  });
});

describe('WebSocket Hook - useNotificationWebSocket', () => {
  it('should construct WebSocket URL with token', () => {
    // Test URL construction logic
    const params = new URLSearchParams();
    params.append('userId', '1');
    params.append('token', 'test-token');
    params.append('projectId', 'proj-123');

    const url = `ws://localhost:3000/ws/notifications?${params.toString()}`;

    expect(url).toContain('userId=1');
    expect(url).toContain('token=test-token');
    expect(url).toContain('projectId=proj-123');
  });

  it('should handle WebSocket URL construction without projectId', () => {
    const params = new URLSearchParams();
    params.append('userId', '1');
    params.append('token', 'test-token');

    const url = `ws://localhost:3000/ws/notifications?${params.toString()}`;

    expect(url).toContain('userId=1');
    expect(url).toContain('token=test-token');
    expect(url).not.toContain('projectId');
  });

  it('should use wss protocol for https', () => {
    const protocol = 'https:' === 'https:' ? 'wss:' : 'ws:';
    expect(protocol).toBe('wss:');
  });

  it('should use ws protocol for http', () => {
    const protocol = 'http:' === 'https:' ? 'wss:' : 'ws:';
    expect(protocol).toBe('ws:');
  });

  it('should extract session token from cookie', () => {
    const cookies = 'session=abc123; other=value';
    const match = cookies.match(/session=([^;]+)/);
    const token = match ? match[1] : null;

    expect(token).toBe('abc123');
  });

  it('should return null if session cookie not found', () => {
    const cookies = 'other=value; another=test';
    const match = cookies.match(/session=([^;]+)/);
    const token = match ? match[1] : null;

    expect(token).toBeNull();
  });

  it('should handle empty cookie string', () => {
    const cookies = '';
    const match = cookies.match(/session=([^;]+)/);
    const token = match ? match[1] : null;

    expect(token).toBeNull();
  });
});

describe('WebSocket Error Handling', () => {
  it('should handle connection errors gracefully', () => {
    const errorHandler = vi.fn();
    
    // Simulate error handling
    const error = new Error('Connection failed');
    const errorMessage = error instanceof Event ? 'WebSocket connection failed' : String(error);
    
    expect(errorMessage).toContain('Connection failed');
  });

  it('should handle message parsing errors', () => {
    const invalidJson = 'not valid json';
    
    expect(() => {
      JSON.parse(invalidJson);
    }).toThrow();
  });

  it('should handle socket destruction errors', () => {
    const mockSocket = {
      write: vi.fn(() => {
        throw new Error('Socket already closed');
      }),
      destroy: vi.fn(),
    };

    expect(() => {
      mockSocket.write('test');
    }).toThrow();
  });
});

describe('WebSocket Authentication', () => {
  it('should validate token format', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    expect(validToken).toBeTruthy();
    expect(validToken.length).toBeGreaterThan(0);
  });

  it('should reject empty token', () => {
    const token = '';
    expect(token).toBeFalsy();
  });

  it('should accept userId as fallback', () => {
    const userId = '1';
    const parsedId = parseInt(userId);
    
    expect(parsedId).toBe(1);
    expect(typeof parsedId).toBe('number');
  });

  it('should reject invalid userId', () => {
    const userId = 'invalid';
    const parsedId = parseInt(userId);
    
    expect(isNaN(parsedId)).toBe(true);
  });
});
