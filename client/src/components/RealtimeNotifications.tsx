import React, { useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCircle, Info, X } from 'lucide-react';
import { useNotificationWebSocket, Notification } from '../hooks/useNotificationWebSocket';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface RealtimeNotificationsProps {
  projectId?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

/**
 * Componente de Notificações em Tempo Real
 * Exibe alertas críticos do calendário via WebSocket
 */
export function RealtimeNotifications({
  projectId,
  position = 'top-right',
  maxNotifications = 5,
  autoClose = true,
  autoCloseDuration = 5000,
}: RealtimeNotificationsProps) {
  const [displayedNotifications, setDisplayedNotifications] = useState<
    (Notification & { id: string })[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  const { isConnected, notifications, clearNotifications, removeNotification } =
    useNotificationWebSocket({
      projectId,
      onAlert: (alert) => {
        handleNewNotification(alert);
      },
      onNotification: (notification) => {
        handleNewNotification(notification);
      },
    });

  /**
   * Processar nova notificação
   */
  const handleNewNotification = (notification: Notification) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notifWithId = { ...notification, id };

    setDisplayedNotifications((prev) => {
      const updated = [notifWithId, ...prev];
      return updated.slice(0, maxNotifications);
    });

    setUnreadCount((prev) => prev + 1);

    // Auto-close
    if (autoClose && notification.severity !== 'critical') {
      setTimeout(() => {
        removeNotificationById(id);
      }, autoCloseDuration);
    }
  };

  /**
   * Remover notificação por ID
   */
  const removeNotificationById = (id: string) => {
    setDisplayedNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /**
   * Obter ícone baseado na severidade
   */
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  /**
   * Obter cor de fundo baseada na severidade
   */
  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  /**
   * Posição CSS
   */
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <>
      {/* Notificações flutuantes */}
      <div className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-md`}>
        {displayedNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 border ${getBgColor(notification.severity)} animate-in slide-in-from-top-2 duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIcon(notification.severity)}</div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900">
                  {notification.data?.title || 'Alerta do Calendário'}
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  {notification.data?.message || notification.data?.description}
                </p>
                {notification.data?.eventName && (
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Evento: {notification.data.eventName}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeNotificationById(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Badge com contador de notificações não lidas */}
      {unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPanel(!showPanel)}
            className="relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          </Button>
        </div>
      )}

      {/* Painel de notificações */}
      {showPanel && (
        <div className="fixed top-16 right-4 z-50 w-96 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma notificação
              </p>
            ) : (
              notifications.map((notification, index) => (
                <Card
                  key={index}
                  className={`p-3 border ${getBgColor(notification.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">
                        {notification.data?.title || 'Alerta'}
                      </p>
                      <p className="text-xs text-gray-700 mt-1">
                        {notification.data?.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearNotifications();
                  setUnreadCount(0);
                }}
                className="w-full"
              >
                Limpar Tudo
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
