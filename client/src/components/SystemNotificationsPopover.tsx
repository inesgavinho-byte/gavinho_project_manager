import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Bell, CheckCheck, Settings, Trash2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import { NotificationBadge, NotificationPriorityIcon } from "./NotificationBadge";
import { cn } from "@/lib/utils";

export function SystemNotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
    isWebSocketConnected,
  } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead({ id: notification.id });
    }
    
    // Navigate to link if provided
    if (notification.link) {
      setOpen(false);
      setLocation(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
      toast.success("Todas as notificações foram marcadas como lidas");
    }
  };

  const handleDelete = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    deleteNotification({ id: notificationId });
    toast.success("Notificação removida");
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    // Sort by priority first (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by unread status
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;

    // Finally by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 bg-white" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notificações do Sistema</h3>
            {isWebSocketConnected ? (
              <Wifi className="h-4 w-4 text-green-500" title="Conectado em tempo real" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" title="Desconectado" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpen(false);
                setLocation("/notification-settings");
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[500px] overflow-y-auto bg-white">
          {sortedNotifications.length === 0 ? (
            <div className="p-8 text-center bg-white">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Nenhuma notificação</p>
              <p className="text-sm text-muted-foreground mt-1">
                Você será notificado sobre eventos importantes
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent/50 cursor-pointer transition-colors group",
                    !notification.isRead && "bg-accent/20"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <NotificationPriorityIcon 
                      priority={notification.priority} 
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={cn(
                          "font-medium text-sm",
                          !notification.isRead && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => handleDelete(e, notification.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <NotificationBadge 
                          type={notification.type}
                          priority={notification.priority}
                          showIcon={false}
                          className="text-xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {sortedNotifications.length > 0 && (
          <div className="border-t p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                setLocation("/notifications");
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
