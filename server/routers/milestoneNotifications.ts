import { router, protectedProcedure } from '@/server/_core/trpc';
import { z } from 'zod';
import {
  checkUpcomingMilestones,
  createMilestoneNotifications,
  getUserNotifications,
  dismissNotification,
  dismissAllNotifications,
  getNotificationStats,
} from '@/server/milestoneNotificationService';

export const milestoneNotificationsRouter = router({
  /**
   * Obtém notificações não lidas do usuário
   */
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    try {
      const notifications = await getUserNotifications(ctx.user.id);
      return {
        success: true,
        data: notifications,
      };
    } catch (error) {
      console.error('[MilestoneNotifications] Erro ao obter notificações:', error);
      return {
        success: false,
        data: [],
        error: 'Erro ao obter notificações',
      };
    }
  }),

  /**
   * Obtém estatísticas de notificações
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await getNotificationStats(ctx.user.id);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('[MilestoneNotifications] Erro ao obter estatísticas:', error);
      return {
        success: false,
        data: { total: 0, overdue: 0, urgent: 0, warning: 0 },
        error: 'Erro ao obter estatísticas',
      };
    }
  }),

  /**
   * Marca uma notificação como lida
   */
  dismiss: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await dismissNotification(input.notificationId);
        return {
          success: true,
          message: 'Notificação descartada com sucesso',
        };
      } catch (error) {
        console.error('[MilestoneNotifications] Erro ao descartar notificação:', error);
        return {
          success: false,
          error: 'Erro ao descartar notificação',
        };
      }
    }),

  /**
   * Marca todas as notificações como lidas
   */
  dismissAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await dismissAllNotifications(ctx.user.id);
      return {
        success: true,
        message: 'Todas as notificações foram descartadas',
      };
    } catch (error) {
      console.error('[MilestoneNotifications] Erro ao descartar todas as notificações:', error);
      return {
        success: false,
        error: 'Erro ao descartar notificações',
      };
    }
  }),

  /**
   * Verifica marcos próximos do vencimento
   */
  checkUpcoming: protectedProcedure
    .input(z.object({ warningDays: z.number().default(7) }))
    .query(async ({ input }) => {
      try {
        const alerts = await checkUpcomingMilestones(input.warningDays);
        return {
          success: true,
          data: alerts,
        };
      } catch (error) {
        console.error('[MilestoneNotifications] Erro ao verificar marcos:', error);
        return {
          success: false,
          data: [],
          error: 'Erro ao verificar marcos',
        };
      }
    }),

  /**
   * Cria notificações para marcos próximos do vencimento
   */
  createNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await createMilestoneNotifications(ctx.user.id);
      return {
        success: true,
        message: 'Notificações criadas com sucesso',
      };
    } catch (error) {
      console.error('[MilestoneNotifications] Erro ao criar notificações:', error);
      return {
        success: false,
        error: 'Erro ao criar notificações',
      };
    }
  }),
});
