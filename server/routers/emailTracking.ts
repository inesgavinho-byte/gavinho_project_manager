import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getEmailEvents,
  getEmailMetrics,
  getReportMetrics,
  getEventsByType,
} from "../emailTrackingService";

export const emailTrackingRouter = router({
  // Obter eventos de rastreamento de um email
  getEmailEvents: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      limit: z.number().int().default(100),
    }))
    .query(async ({ input }) => {
      try {
        const events = await getEmailEvents(input.messageId, input.limit);
        return {
          success: true,
          data: events,
          count: events.length,
        };
      } catch (error) {
        console.error('Error getting email events:', error);
        return {
          success: false,
          data: [],
          count: 0,
          error: 'Failed to retrieve email events',
        };
      }
    }),

  // Obter métricas agregadas de um email
  getEmailMetrics: protectedProcedure
    .input(z.object({
      messageId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const metrics = await getEmailMetrics(input.messageId);
        return {
          success: true,
          data: metrics,
        };
      } catch (error) {
        console.error('Error getting email metrics:', error);
        return {
          success: false,
          data: null,
          error: 'Failed to retrieve email metrics',
        };
      }
    }),

  // Obter métricas agregadas de um relatório de email
  getReportMetrics: protectedProcedure
    .input(z.object({
      reportId: z.number().int(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const metrics = await getReportMetrics(
          input.reportId,
          input.startDate,
          input.endDate
        );
        return {
          success: true,
          data: metrics,
        };
      } catch (error) {
        console.error('Error getting report metrics:', error);
        return {
          success: false,
          data: null,
          error: 'Failed to retrieve report metrics',
        };
      }
    }),

  // Obter eventos por tipo
  getEventsByType: protectedProcedure
    .input(z.object({
      eventType: z.enum(['open', 'click', 'bounce', 'dropped', 'delivered', 'deferred', 'unsubscribe', 'spamreport']),
      limit: z.number().int().default(100),
    }))
    .query(async ({ input }) => {
      try {
        const events = await getEventsByType(input.eventType, input.limit);
        return {
          success: true,
          data: events,
          count: events.length,
        };
      } catch (error) {
        console.error('Error getting events by type:', error);
        return {
          success: false,
          data: [],
          count: 0,
          error: 'Failed to retrieve events',
        };
      }
    }),

  // Obter resumo de eventos (para dashboard)
  getSummary: protectedProcedure
    .query(async () => {
      try {
        const opens = await getEventsByType('open', 1);
        const clicks = await getEventsByType('click', 1);
        const bounces = await getEventsByType('bounce', 1);
        const delivered = await getEventsByType('delivered', 1);

        return {
          success: true,
          data: {
            totalOpens: opens.length,
            totalClicks: clicks.length,
            totalBounces: bounces.length,
            totalDelivered: delivered.length,
          },
        };
      } catch (error) {
        console.error('Error getting summary:', error);
        return {
          success: false,
          data: null,
          error: 'Failed to retrieve summary',
        };
      }
    }),
});
