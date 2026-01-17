import React, { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MQTNotification {
  id: string;
  type: "mqt_task_generated" | "mqt_discrepancy_alert" | "mqt_bulk_tasks_generated" | "mqt_processing_status";
  severity?: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  itemCode?: string;
  variance?: number;
  variancePercentage?: number;
  taskId?: number;
  timestamp: string;
  read: boolean;
}

interface MQTNotificationPanelProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MQTNotificationPanel({
  projectId,
  isOpen,
  onClose,
}: MQTNotificationPanelProps) {
  const [notifications, setNotifications] = useState<MQTNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Conectar ao WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("[MQT Notifications] WebSocket connected");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "notification" && message.data) {
            const notification = message.data;

            // Filtrar apenas notificações MQT
            if (notification.type?.startsWith("mqt_")) {
              const newNotif: MQTNotification = {
                id: `${notification.type}-${Date.now()}-${Math.random()}`,
                type: notification.type,
                severity: notification.severity,
                title: buildTitle(notification),
                message: buildMessage(notification),
                itemCode: notification.itemCode,
                variance: notification.variance,
                variancePercentage: notification.variancePercentage,
                taskId: notification.taskId,
                timestamp: notification.timestamp || new Date().toISOString(),
                read: false,
              };

              setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
              setUnreadCount((prev) => prev + 1);

              // Mostrar notificação do navegador se permitido
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(newNotif.title, {
                  body: newNotif.message,
                  icon: "/favicon.ico",
                  tag: `mqt-${notification.type}`,
                });
              }
            }
          }
        } catch (error) {
          console.error("[MQT Notifications] Message parse error:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("[MQT Notifications] WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        console.log("[MQT Notifications] WebSocket disconnected");
      };
    } catch (error) {
      console.error("[MQT Notifications] Connection error:", error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen]);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClear = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      case "low":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <Card className="h-full border-0 rounded-0 flex flex-col">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <CardTitle>Notificações MQT</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Alertas automáticos de tarefas geradas
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          {notifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sem notificações</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="space-y-2 p-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        notification.read
                          ? "bg-gray-50 border-gray-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 flex-shrink-0 ${getSeverityColor(
                            notification.severity
                          )}`}
                        >
                          {getSeverityIcon(notification.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm text-gray-900">
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClear(notification.id)}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.itemCode && (
                            <div className="mt-2 text-xs space-y-1">
                              <p className="text-gray-700">
                                <span className="font-semibold">Item:</span>{" "}
                                {notification.itemCode}
                              </p>
                              {notification.variancePercentage !== undefined && (
                                <p className="text-gray-700">
                                  <span className="font-semibold">Variância:</span>{" "}
                                  {notification.variancePercentage > 0 ? "+" : ""}
                                  {notification.variancePercentage.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleString(
                              "pt-PT"
                            )}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="mt-2 h-6 text-xs"
                        >
                          Marcar como lido
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-4 space-y-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="w-full"
                  >
                    Marcar tudo como lido
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full"
                >
                  Limpar tudo
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildTitle(notification: any): string {
  switch (notification.type) {
    case "mqt_task_generated":
      return `🚨 Tarefa Gerada: ${notification.itemCode || "MQT"}`;
    case "mqt_discrepancy_alert":
      return `⚠️ Alerta de Discrepância: ${notification.itemCode}`;
    case "mqt_bulk_tasks_generated":
      return `📋 ${notification.count || "Múltiplas"} Tarefas Geradas`;
    case "mqt_processing_status":
      return `⏳ Processamento ${notification.status === "completed" ? "Concluído" : "em Progresso"}`;
    default:
      return "Notificação MQT";
  }
}

function buildMessage(notification: any): string {
  switch (notification.type) {
    case "mqt_task_generated":
      return `Nova tarefa criada automaticamente. Severidade: ${notification.severity}`;
    case "mqt_discrepancy_alert":
      return `Variância detectada: ${notification.variancePercentage?.toFixed(1)}%`;
    case "mqt_bulk_tasks_generated":
      return `${notification.count} tarefas foram geradas automaticamente`;
    case "mqt_processing_status":
      return notification.status === "completed"
        ? `Processamento concluído. ${notification.details?.tasksGenerated || 0} tarefas geradas`
        : "Processando alertas MQT...";
    default:
      return "Nova notificação MQT";
  }
}
