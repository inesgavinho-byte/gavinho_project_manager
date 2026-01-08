import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Bell, Check, CheckCheck, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: unreadCount = 0, refetch: refetchCount } = trpc.library.getUnreadNotificationCount.useQuery();
  const { data: notifications = [], refetch: refetchNotifications } = trpc.library.getUserNotifications.useQuery(
    { unreadOnly: false },
    { enabled: open }
  );

  const markAsReadMutation = trpc.library.markNotificationAsRead.useMutation({
    onSuccess: () => {
      refetchCount();
      refetchNotifications();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const markAllAsReadMutation = trpc.library.markAllNotificationsAsRead.useMutation({
    onSuccess: () => {
      toast.success("Todas as notificações foram marcadas como lidas");
      refetchCount();
      refetchNotifications();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleNotificationClick = (notificationId: number, materialId: number, read: boolean) => {
    if (!read) {
      markAsReadMutation.mutate({ notificationId });
    }
    setOpen(false);
    setLocation("/biblioteca");
    // Note: In a real implementation, you might want to scroll to the material or open its comments
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

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
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold text-[#5F5C59]">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-[#C3BAAF] mb-3" />
              <p className="text-[#5F5C59]">Nenhuma notificação</p>
              <p className="text-sm text-muted-foreground mt-1">
                Você será notificado quando alguém comentar em materiais favoritos
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-0 rounded-none cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-[#C9A882]/5" : ""
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.materialId,
                      notification.read
                    )
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {notification.commentAuthorAvatar ? (
                          <img
                            src={notification.commentAuthorAvatar}
                            alt={notification.commentAuthor}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#C9A882] flex items-center justify-center text-white font-semibold">
                            {notification.commentAuthor.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm text-[#5F5C59]">
                            <span className="font-semibold">{notification.commentAuthor}</span>
                            {" comentou em "}
                            <span className="font-semibold">{notification.materialName}</span>
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-[#C9A882] flex-shrink-0 mt-1" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <MessageSquare className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.commentContent}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
