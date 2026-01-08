import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook para gerenciar notificações com auto-refresh
 * Faz polling a cada 30 segundos para atualizar o contador de notificações não lidas
 */
export function useNotifications() {
  const utils = trpc.useUtils();

  // Query para obter contador de notificações não lidas
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchOnWindowFocus: true, // Atualiza quando a janela recebe foco
  });

  // Query para obter lista de notificações
  const { data: notifications = [] } = trpc.notifications.list.useQuery(
    { unreadOnly: false },
    {
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
    }
  );

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
  };
}
