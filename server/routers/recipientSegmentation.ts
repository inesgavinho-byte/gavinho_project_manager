import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  calculateSegmentMetrics,
  compareSegments,
  getHighEngagementRecipients,
  getInactiveRecipients,
} from '../recipientSegmentationService';

export const recipientSegmentationRouter = router({
  /**
   * Obter métricas de um segmento específico
   */
  getSegmentMetrics: protectedProcedure
    .input(
      z.object({
        segmentId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = await calculateSegmentMetrics(
          input.segmentId,
          input.startDate,
          input.endDate
        );

        if (!metrics) {
          return {
            success: false,
            error: 'Segmento não encontrado',
            data: null,
          };
        }

        return {
          success: true,
          data: metrics,
        };
      } catch (error) {
        console.error('Erro ao obter métricas do segmento:', error);
        return {
          success: false,
          error: 'Erro ao obter métricas do segmento',
          data: null,
        };
      }
    }),

  /**
   * Comparar métricas entre dois segmentos
   */
  compareSegments: protectedProcedure
    .input(
      z.object({
        segmentId1: z.string(),
        segmentId2: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const comparison = await compareSegments(
          input.segmentId1,
          input.segmentId2,
          input.startDate,
          input.endDate
        );

        return {
          success: true,
          data: comparison,
        };
      } catch (error) {
        console.error('Erro ao comparar segmentos:', error);
        return {
          success: false,
          error: 'Erro ao comparar segmentos',
          data: null,
        };
      }
    }),

  /**
   * Obter destinatários com alto engajamento em um segmento
   */
  getHighEngagementRecipients: protectedProcedure
    .input(
      z.object({
        segmentId: z.string(),
        threshold: z.number().min(0).max(100).optional().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const recipients = await getHighEngagementRecipients(input.segmentId, input.threshold);

        return {
          success: true,
          data: recipients,
          count: recipients.length,
        };
      } catch (error) {
        console.error('Erro ao obter destinatários com alto engajamento:', error);
        return {
          success: false,
          error: 'Erro ao obter destinatários com alto engajamento',
          data: [],
          count: 0,
        };
      }
    }),

  /**
   * Obter destinatários inativos em um segmento
   */
  getInactiveRecipients: protectedProcedure
    .input(
      z.object({
        segmentId: z.string(),
        daysInactive: z.number().min(1).optional().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const recipients = await getInactiveRecipients(input.segmentId, input.daysInactive);

        return {
          success: true,
          data: recipients,
          count: recipients.length,
        };
      } catch (error) {
        console.error('Erro ao obter destinatários inativos:', error);
        return {
          success: false,
          error: 'Erro ao obter destinatários inativos',
          data: [],
          count: 0,
        };
      }
    }),

  /**
   * Obter resumo de segmentação com todos os segmentos
   */
  getSegmentationSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // TODO: Implementar busca de todos os segmentos
        // Por enquanto, retornar estrutura vazia
        return {
          success: true,
          data: {
            totalSegments: 0,
            segments: [],
            topPerformingSegment: null,
            lowestPerformingSegment: null,
          },
        };
      } catch (error) {
        console.error('Erro ao obter resumo de segmentação:', error);
        return {
          success: false,
          error: 'Erro ao obter resumo de segmentação',
          data: null,
        };
      }
    }),
});
