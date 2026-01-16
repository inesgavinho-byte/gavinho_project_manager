import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  calculateTrendMetrics,
  detectAnomalies,
  generateOptimizationRecommendations,
  compareTrendPeriods,
} from '../trendAnalysisService';

export const trendAnalysisRouter = router({
  /**
   * Calcula métricas de tendências para um período específico
   */
  getTrendMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        actionType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await calculateTrendMetrics(
        input.startDate,
        input.endDate,
        input.actionType
      );
    }),

  /**
   * Detecta anomalias em ações
   */
  detectAnomalies: protectedProcedure
    .input(
      z.object({
        timeWindowDays: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      return await detectAnomalies(input.timeWindowDays);
    }),

  /**
   * Gera recomendações de otimização
   */
  getOptimizationRecommendations: protectedProcedure
    .input(
      z.object({
        timeWindowDays: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      return await generateOptimizationRecommendations(input.timeWindowDays);
    }),

  /**
   * Compara tendências entre dois períodos
   */
  comparePeriods: protectedProcedure
    .input(
      z.object({
        startDate1: z.date(),
        endDate1: z.date(),
        startDate2: z.date(),
        endDate2: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await compareTrendPeriods(
        input.startDate1,
        input.endDate1,
        input.startDate2,
        input.endDate2
      );
    }),

  /**
   * Obtém análise completa de tendências
   */
  getCompleteTrendAnalysis: protectedProcedure
    .input(
      z.object({
        timeWindowDays: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.timeWindowDays);

      const [metrics, anomalies, recommendations] = await Promise.all([
        calculateTrendMetrics(startDate, endDate),
        detectAnomalies(input.timeWindowDays),
        generateOptimizationRecommendations(input.timeWindowDays),
      ]);

      return {
        metrics,
        anomalies,
        recommendations,
        analysisDate: new Date(),
      };
    }),
});
