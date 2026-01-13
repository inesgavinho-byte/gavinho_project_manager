import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: stats } = trpc.approvalNotifications.getStats.useQuery();
  const { data: unreadNotifications = [], refetch } = trpc.approvalNotifications.getUnread.useQuery();

  const markAsReadMutation = trpc.approvalNotifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsReadMutation = trpc.approvalNotifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteNotificationMutation = trpc.approvalNotifications.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "supplier_evaluated":
        return "⭐";
      case "project_status_changed":
        return "📋";
      case "project_completed":
        return "✅";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "supplier_evaluated":
        return "bg-yellow-50 border-yellow-200";
      case "project_status_changed":
        return "bg-blue-50 border-blue-200";
      case "project_completed":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {stats && stats.unread > 0 && (
          <Badge
            className="absolute -top-2 -right-2 bg-red-600 text-white h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {stats.unread > 9 ? "9+" : stats.unread}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 shadow-lg z-50 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {stats && stats.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="w-full mt-2"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar tudo como lido
              </Button>
            )}
          </CardHeader>

          <CardContent className="max-h-96 overflow-y-auto space-y-2 bg-white">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`gavinho-notification-card space-y-2`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(notification.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotificationMutation.mutate({ notificationId: notification.id })}
                      className="h-6 w-6 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate({ notificationId: notification.id })}
                      className="flex-1 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Marcar como lido
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Nenhuma notificação não lida
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
