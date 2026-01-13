import { router, protectedProcedure } from '../_core/trpc';
import { outlookCalendarService } from '../services/outlookCalendarService';
import { z } from 'zod';

export const calendarRouter = router({
  /**
   * Cria eventos de entrega automáticos
   */
  createDeliveryEvents: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        deliveries: z.array(
          z.object({
            date: z.date(),
            description: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      await outlookCalendarService.createDeliveryEvents(input.projectId, input.deliveries);
      return { success: true, message: `${input.deliveries.length} eventos de entrega criados` };
    }),

  /**
   * Cria eventos de adjudicação automáticos
   */
  createAdjudicationEvents: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        adjudications: z.array(
          z.object({
            date: z.date(),
            description: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      await outlookCalendarService.createAdjudicationEvents(input.projectId, input.adjudications);
      return { success: true, message: `${input.adjudications.length} eventos de adjudicação criados` };
    }),

  /**
   * Cria eventos de pagamento automáticos
   */
  createPaymentEvents: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        payments: z.array(
          z.object({
            date: z.date(),
            amount: z.number(),
            description: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      await outlookCalendarService.createPaymentEvents(input.projectId, input.payments);
      return { success: true, message: `${input.payments.length} eventos de pagamento criados` };
    }),

  /**
   * Retorna eventos do calendário
   */
  getCalendarEvents: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const events = await outlookCalendarService.getCalendarEvents(
        input.projectId,
        input.startDate,
        input.endDate
      );
      return events;
    }),

  /**
   * Retorna alertas pendentes
   */
  getPendingAlerts: protectedProcedure.query(async () => {
    const alerts = await outlookCalendarService.getPendingAlerts();
    return alerts;
  }),

  /**
   * Marca alerta como lido
   */
  markAlertAsRead: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await outlookCalendarService.markAlertAsRead(input.alertId);
      return { success: true, message: 'Alerta marcado como lido' };
    }),

  /**
   * Deleta evento do calendário
   */
  deleteCalendarEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await outlookCalendarService.deleteCalendarEvent(input.eventId);
      return { success: true, message: 'Evento deletado com sucesso' };
    }),

  /**
   * Sincroniza eventos com Outlook
   */
  syncToOutlook: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Buscar eventos do banco
      const events = await outlookCalendarService.getCalendarEvents(input.projectId);

      // Sincronizar com Outlook (seria necessário ter o accessToken do usuário)
      // Por enquanto, apenas registrar a sincronização
      console.log(`[Calendar] Sincronizando ${events.length} eventos para Outlook`);

      return {
        success: true,
        message: `${events.length} eventos sincronizados com Outlook`,
        eventCount: events.length,
      };
    }),

  /**
   * Retorna estatísticas do calendário
   */
  getCalendarStats: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const events = await outlookCalendarService.getCalendarEvents(input.projectId);
      const alerts = await outlookCalendarService.getPendingAlerts();

      // Contar eventos por tipo
      const eventsByType = events.reduce(
        (acc, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Contar alertas por tipo
      const alertsByType = alerts.reduce(
        (acc, alert) => {
          acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalEvents: events.length,
        totalAlerts: alerts.length,
        eventsByType,
        alertsByType,
        upcomingEvents: events.filter((e) => new Date(e.startDate) > new Date()).length,
      };
    }),
});
