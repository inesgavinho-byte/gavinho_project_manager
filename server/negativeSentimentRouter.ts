import { router, protectedProcedure } from './trpc';
import { z } from 'zod';
import {
  detectNegativeSentimentAlerts,
  createNegativeSentimentAlert,
  resolveNegativeSentimentAlert,
  getActiveSentimentAlerts,
  monitorAllContactsSentiment,
  analyzeContactSentimentTrend,
} from './negativeSentimentAlertService';

export const negativeSentimentRouter = router({
  /**
   * Analisa sentimento de um contato específico
   */
  analyzeContactSentiment: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        days: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      return await analyzeContactSentimentTrend(input.contactId, input.days);
    }),

  /**
   * Detecta se um contato tem sentimento consistentemente negativo
   */
  detectNegativeSentiment: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        negativeThreshold: z.number().default(40), // 0-100
        persistenceDays: z.number().default(7),
        minEmailsRequired: z.number().default(3),
      })
    )
    .query(async ({ input }) => {
      return await detectNegativeSentimentAlerts({
        contactId: input.contactId,
        negativeThreshold: input.negativeThreshold,
        persistenceDays: input.persistenceDays,
        minEmailsRequired: input.minEmailsRequired,
        enabled: true,
      });
    }),

  /**
   * Cria alerta de sentimento negativo
   */
  createAlert: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        negativeThreshold: z.number().default(40),
        persistenceDays: z.number().default(7),
        minEmailsRequired: z.number().default(3),
      })
    )
    .mutation(async ({ input }) => {
      const alert = await detectNegativeSentimentAlerts({
        contactId: input.contactId,
        negativeThreshold: input.negativeThreshold,
        persistenceDays: input.persistenceDays,
        minEmailsRequired: input.minEmailsRequired,
        enabled: true,
      });

      if (alert) {
        await createNegativeSentimentAlert(alert);
        return { success: true, alert };
      }

      return { success: false, alert: null };
    }),

  /**
   * Obtém todos os alertas ativos
   */
  getActiveAlerts: protectedProcedure.query(async () => {
    return await getActiveSentimentAlerts();
  }),

  /**
   * Marca alerta como resolvido
   */
  resolveAlert: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        resolution: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await resolveNegativeSentimentAlert(input.contactId, input.resolution);
      return { success: true };
    }),

  /**
   * Monitora todos os contatos e cria alertas conforme necessário
   */
  monitorAllContacts: protectedProcedure
    .input(
      z.object({
        negativeThreshold: z.number().default(40),
        persistenceDays: z.number().default(7),
        minEmailsRequired: z.number().default(3),
      })
    )
    .mutation(async ({ input }) => {
      const alerts = await monitorAllContactsSentiment(
        input.negativeThreshold,
        input.persistenceDays,
        input.minEmailsRequired
      );

      return {
        success: true,
        alertsCreated: alerts.length,
        alerts,
      };
    }),
});
