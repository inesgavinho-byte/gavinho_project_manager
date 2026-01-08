import { useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "./useWebSocket";

/**
 * Hook para gerenciar notificações com auto-refresh
 * Faz polling a cada 30 segundos para atualizar o contador de notificações não lidas
 */
export function useNotifications() {
  const utils = trpc.useUtils();

  // Query para obter contador de notificações não lidas (sem polling)
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchOnWindowFocus: true, // Atualiza quando a janela recebe foco
  });

  // Query para obter lista de notificações (sem polling)
  const { data: notifications = [] } = trpc.notifications.list.useQuery(
    { unreadOnly: false },
    {
      refetchOnWindowFocus: true,
    }
  );

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === "notification") {
      // Invalidate queries to refresh data
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    }
  }, [utils]);

  // Connect to WebSocket
  const { isConnected } = useWebSocket({
    url: window.location.origin + "/ws/notifications",
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log("[Notifications] WebSocket connected"),
    onDisconnect: () => console.log("[Notifications] WebSocket disconnected"),
  });

  // Mutation para marcar notificação como lida
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      // Atualiza o contador e a lista após marcar como lida
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  // Mutation para marcar todas como lidas
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  // Mutation para deletar notificação
  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  return {
    unreadCount,
    notifications,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    isLoading: markAsRead.isPending || markAllAsRead.isPending || deleteNotification.isPending,
    isWebSocketConnected: isConnected,
  };
}
