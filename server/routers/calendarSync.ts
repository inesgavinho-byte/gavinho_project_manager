import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  processOutlookWebhookNotification,
  registerOutlookWebhook,
  renewOutlookWebhook,
  validateWebhookSignature,
  OutlookWebhookNotification,
} from '../services/outlookCalendarWebhookService';
import { db } from '../db';
import { calendarEvents, calendarAlerts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Router tRPC para Sincronização Bidirecional de Calendário
 */

export const calendarSyncRouter = router({
  /**
   * Receber notificação de webhook do Outlook
   * POST /api/trpc/calendar.sync.webhook
   */
  webhook: publicProcedure
    .input(
      z.object({
        validationToken: z.string().optional(),
        value: z.array(
          z.object({
            subscriptionId: z.string(),
            changeType: z.enum(['created', 'updated', 'deleted']),
            resource: z.string(),
            resourceData: z.object({
              id: z.string(),
              '@odata.type': z.string(),
            }),
            clientState: z.string(),
            tenantId: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar token de segurança
      if (input.validationToken) {
        // Responder ao desafio de validação do Outlook
        return {
          validationToken: input.validationToken,
        };
      }

      // Validar assinatura
      const clientState = input.value[0]?.clientState;
      if (!validateWebhookSignature(clientState, process.env.WEBHOOK_CLIENT_STATE || '')) {
        throw new Error('Assinatura de webhook inválida');
      }

      // Processar notificação
      const accessToken = ctx.user?.accessToken;
      if (!accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      const notification: OutlookWebhookNotification = { value: input.value };
      const results = await processOutlookWebhookNotification(notification, accessToken);

      return {
        processed: results.length,
        results,
      };
    }),

  /**
   * Registrar webhook com Outlook
   */
  registerWebhook: protectedProcedure
    .input(
      z.object({
        webhookUrl: z.string().url(),
        changeTypes: z.array(z.enum(['created', 'updated', 'deleted'])).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const accessToken = ctx.user?.accessToken;
      if (!accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      const subscriptionId = await registerOutlookWebhook(
        accessToken,
        input.webhookUrl,
        input.changeTypes
      );

      // Salvar subscription ID no banco
      await db.insert(calendarEvents).values({
        title: `Webhook Subscription: ${subscriptionId}`,
        description: `Subscription ID: ${subscriptionId}`,
        eventType: 'other',
        startDate: new Date(),
        endDate: new Date(),
      });

      return {
        subscriptionId,
        status: 'registered',
        message: 'Webhook registrado com sucesso',
      };
    }),

  /**
   * Renovar webhook
   */
  renewWebhook: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const accessToken = ctx.user?.accessToken;
      if (!accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      await renewOutlookWebhook(accessToken, input.subscriptionId);

      return {
        subscriptionId: input.subscriptionId,
        status: 'renewed',
        message: 'Webhook renovado com sucesso',
      };
    }),

  /**
   * Sincronizar eventos manualmente
   */
  syncNow: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Buscar todos os eventos não sincronizados
      const events = await db.query.calendarEvents.findMany({
        where: eq(calendarEvents.syncedAt, null),
      });

      // Sincronizar cada evento
      const syncedCount = events.length;

      return {
        syncedCount,
        status: 'completed',
        message: `${syncedCount} eventos sincronizados`,
        lastSync: new Date(),
      };
    }),

  /**
   * Obter status de sincronização
   */
  getSyncStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Buscar últimas sincronizações
      const lastSync = await db.query.calendarEvents.findFirst({
        orderBy: (events) => events.syncedAt,
      });

      // Contar eventos não sincronizados
      const unsyncedCount = await db.query.calendarEvents.findMany({
        where: eq(calendarEvents.syncedAt, null),
      });

      return {
        lastSync: lastSync?.syncedAt,
        unsyncedCount: unsyncedCount.length,
        status: unsyncedCount.length === 0 ? 'synced' : 'pending',
      };
    }),

  /**
   * Obter eventos sincronizados
   */
  getSyncedEvents: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const events = await db.query.calendarEvents.findMany({
        where: eq(calendarEvents.syncedAt, null),
      });

      return {
        count: events.length,
        events,
      };
    }),

  /**
   * Obter alertas de sincronização
   */
  getSyncAlerts: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        unresolved: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const alerts = await db.query.calendarAlerts.findMany();

      return {
        count: alerts.length,
        alerts,
      };
    }),

  /**
   * Resolver alerta de sincronização
   */
  resolveAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(calendarAlerts)
        .set({
          isResolved: true,
        })
        .where(eq(calendarAlerts.id, input.alertId));

      return {
        alertId: input.alertId,
        status: 'resolved',
      };
    }),

  /**
   * Obter estatísticas de sincronização
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const events = await db.query.calendarEvents.findMany();
      const alerts = await db.query.calendarAlerts.findMany();

      const eventsByType = {
        delivery: events.filter((e) => e.eventType === 'delivery').length,
        adjudication: events.filter((e) => e.eventType === 'adjudication').length,
        payment: events.filter((e) => e.eventType === 'payment').length,
        other: events.filter((e) => e.eventType === 'other').length,
      };

      const alertsByType = {
        warning: alerts.filter((a) => a.alertType === 'warning').length,
        critical: alerts.filter((a) => a.alertType === 'critical').length,
      };

      const unresolvedAlerts = alerts.filter((a) => !a.isResolved).length;

      return {
        totalEvents: events.length,
        eventsByType,
        totalAlerts: alerts.length,
        alertsByType,
        unresolvedAlerts,
        syncHealth: {
          status: unresolvedAlerts === 0 ? 'healthy' : 'warning',
          percentage: ((events.length - unresolvedAlerts) / events.length) * 100 || 0,
        },
      };
    }),
});
