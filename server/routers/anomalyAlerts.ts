import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  detectAndCreateAnomalyAlerts,
  notifyManagersAboutAnomalies,
  generateAIRecommendations,
  escalateAlert,
} from '../anomalyAlertService';

export const anomalyAlertsRouter = router({
  /**
   * Detecta anomalias e cria alertas
   */
  detectAnomalies: protectedProcedure
    .input(
      z.object({
        anomalies: z.array(
          z.object({
            actionType: z.string(),
            severity: z.enum(['high', 'medium', 'low']),
            type: z.string().optional(),
            expectedDuration: z.number(),
            actualDuration: z.number(),
            deviation: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const alerts = await detectAndCreateAnomalyAlerts(input.anomalies);
      
      // Notificar gestores sobre alertas críticos
      const criticalAlerts = alerts.filter((a) => a.severity === 'high');
      if (criticalAlerts.length > 0) {
        await notifyManagersAboutAnomalies(criticalAlerts);
      }

      return {
        alerts,
        notified: criticalAlerts.length > 0,
      };
    }),

  /**
   * Obtém alertas recentes
   */
  getRecentAlerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        severity: z.enum(['high', 'medium', 'low']).optional(),
      })
    )
    .query(async ({ input }) => {
      // Aqui seria integrado com banco de dados
      // Para agora, retorna estrutura de exemplo
      return {
        alerts: [],
        total: 0,
      };
    }),

  /**
   * Gera recomendações de ação para alertas
   */
  generateRecommendations: protectedProcedure
    .input(
      z.object({
        alerts: z.array(
          z.object({
            id: z.string(),
            actionType: z.string(),
            severity: z.enum(['high', 'medium', 'low']),
            description: z.string(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const recommendations = await generateAIRecommendations(input.alerts as any);
      return { recommendations };
    }),

  /**
   * Escalona um alerta para nível superior
   */
  escalateAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        escalationLevel: z.enum(['manager', 'director', 'admin']),
      })
    )
    .mutation(async ({ input }) => {
      // Aqui seria integrado com banco de dados para recuperar o alerta
      // Por agora, simula a escalação
      return {
        success: true,
        message: `Alerta escalado para ${input.escalationLevel}`,
      };
    }),

  /**
   * Marca um alerta como resolvido
   */
  resolveAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.string(),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: 'Alerta marcado como resolvido',
      };
    }),

  /**
   * Obtém estatísticas de alertas
   */
  getAlertStatistics: protectedProcedure
    .input(
      z.object({
        timeWindowDays: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      return {
        totalAlerts: 0,
        criticalAlerts: 0,
        mediumAlerts: 0,
        lowAlerts: 0,
        resolvedAlerts: 0,
        averageResolutionTime: 0,
        topAnomalyTypes: [],
      };
    }),

  /**
   * Obtém histórico de alertas
   */
  getAlertHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        severity: z.enum(['high', 'medium', 'low']).optional(),
        resolved: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return {
        alerts: [],
        total: 0,
        hasMore: false,
      };
    }),

  /**
   * Configura regras de alerta
   */
  configureAlertRules: protectedProcedure
    .input(
      z.object({
        anomalyType: z.string(),
        deviationThreshold: z.number(),
        escalationLevels: z.array(
          z.object({
            level: z.enum(['manager', 'director', 'admin']),
            hoursToEscalate: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: 'Regras de alerta configuradas',
      };
    }),
});
