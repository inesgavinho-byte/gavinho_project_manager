import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../_core/hooks/useAuth';

export interface Notification {
  type: 'alert' | 'notification';
  severity: 'critical' | 'warning' | 'info';
  data: any;
  timestamp: string;
}

interface UseNotificationWebSocketOptions {
  projectId?: string;
  onAlert?: (alert: Notification) => void;
  onNotification?: (notification: Notification) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

/**
 * Hook React para WebSocket com notificações em tempo real
 */
export function useNotificationWebSocket(options: UseNotificationWebSocketOptions = {}) {
  const {
    projectId,
    onAlert,
    onNotification,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Extrair token de sessão dos cookies
   */
  const getSessionToken = useCallback((): string | null => {
    const cookies = document.cookie.split('; ');
    const sessionCookie = cookies.find(row => row.startsWith('session='));
    return sessionCookie ? sessionCookie.split('=')[1] : null;
  }, []);

  /**
   * Conectar ao servidor WebSocket
   */
  const connect = useCallback(() => {
    if (!user?.id) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = getSessionToken();
      
      // Construir URL com token na query string
      const params = new URLSearchParams();
      params.append('userId', String(user.id));
      if (token) {
        params.append('token', token);
      }
      if (projectId) {
        params.append('projectId', projectId);
      }
      
      const url = `${protocol}//${window.location.host}/ws/notifications?${params.toString()}`;

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Conectado ao servidor de notificações');
        setIsConnected(true);

        // Limpar timeout de reconexão
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: Notification = JSON.parse(event.data);

          if (message.type === 'alert') {
            setNotifications((prev) => [...prev, message]);
            onAlert?.(message);
          } else if (message.type === 'notification') {
            setNotifications((prev) => [...prev, message]);
            onNotification?.(message);
          }
        } catch (error) {
          console.error('[WebSocket] Erro ao processar mensagem:', error);
        }
      };

      ws.onerror = (error) => {
        const errorMessage = error instanceof Event ? 'WebSocket connection failed' : String(error);
        console.error('[WebSocket] Erro:', errorMessage, error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Desconectado do servidor');
        setIsConnected(false);

        // Tentar reconectar
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Erro ao conectar:', error);
      setIsConnected(false);
    }
  }, [user?.id, projectId, autoReconnect, reconnectDelay, onAlert, onNotification, getSessionToken, user]);

  /**
   * Desconectar do servidor WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Enviar mensagem ping
   */
  const ping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  /**
   * Limpar notificações
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Remover notificação específica
   */
  const removeNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Efeito de conexão/desconexão
   */
  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, connect, disconnect]);

  return {
    isConnected,
    notifications,
    ping,
    clearNotifications,
    removeNotification,
    disconnect,
    reconnect: connect,
  };
}
