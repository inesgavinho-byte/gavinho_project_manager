import { router, protectedProcedure } from '../_core/trpc';
import { emailMLService } from '../services/emailMLService';
import { z } from 'zod';

export const emailMLRouter = router({
  /**
   * Registra feedback de correção do usuário
   */
  recordFeedback: protectedProcedure
    .input(
      z.object({
        emailId: z.number(),
        correctCategory: z.enum(['order', 'adjudication', 'purchase', 'delivery', 'invoice', 'communication', 'other']),
        userConfidence: z.number().min(0).max(1).optional().default(1),
      })
    )
    .mutation(async ({ input }) => {
      return await emailMLService.recordFeedback(input.emailId, input.correctCategory, input.userConfidence);
    }),

  /**
   * Treina o modelo com histórico de correções
   */
  trainModel: protectedProcedure.mutation(async () => {
    return await emailMLService.trainModel();
  }),

  /**
   * Retorna métricas do modelo atual
   */
  getModelMetrics: protectedProcedure.query(async () => {
    return await emailMLService.getModelMetrics();
  }),

  /**
   * Retorna histórico de correções
   */
  getCorrectionHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await emailMLService.getCorrectionHistory(input.projectId);
    }),

  /**
   * Retorna estatísticas de acurácia por categoria
   */
  getAccuracyStats: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const metrics = await emailMLService.getModelMetrics();

      if (!metrics) {
        return {
          status: 'no_model',
          message: 'Nenhum modelo treinado ainda',
        };
      }

      return {
        status: 'ready',
        overallAccuracy: metrics.accuracy,
        byCategory: Object.entries(metrics.f1Score).map(([category, f1]) => ({
          category,
          f1Score: f1,
          precision: metrics.precision[category],
          recall: metrics.recall[category],
        })),
        totalSamples: metrics.totalSamples,
        lastTraining: metrics.trainingDate,
      };
    }),

  /**
   * Retorna sugestões de melhoria do modelo
   */
  getImprovementSuggestions: protectedProcedure.query(async () => {
    const metrics = await emailMLService.getModelMetrics();
    const corrections = await emailMLService.getCorrectionHistory();

    if (!metrics) {
      return {
        suggestions: [
          {
            priority: 'high',
            message: 'Nenhum modelo treinado. Registre pelo menos 50 correções para treinar um modelo.',
            action: 'record_feedback',
          },
        ],
      };
    }

    const suggestions = [];

    // Sugerir retraining se houver muitas correções recentes
    const recentCorrections = corrections.filter(
      (c) => new Date(c.feedbackDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    if (recentCorrections > 10) {
      suggestions.push({
        priority: 'high',
        message: `${recentCorrections} correções registradas nos últimos 7 dias. Retraining recomendado.`,
        action: 'train_model',
      });
    }

    // Sugerir melhorias para categorias com baixa acurácia
    for (const [category, f1] of Object.entries(metrics.f1Score)) {
      if (f1 < 0.7) {
        suggestions.push({
          priority: 'medium',
          message: `Categoria "${category}" com F1-Score baixo (${(f1 * 100).toFixed(0)}%). Registre mais exemplos desta categoria.`,
          action: 'record_feedback',
          category,
        });
      }
    }

    // Sugerir retraining se acurácia caiu
    if (metrics.accuracy < 0.85) {
      suggestions.push({
        priority: 'medium',
        message: `Acurácia do modelo em ${(metrics.accuracy * 100).toFixed(0)}%. Retraining pode melhorar a performance.`,
        action: 'train_model',
      });
    }

    return { suggestions };
  }),
});
