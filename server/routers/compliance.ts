import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { ComplianceService } from '../complianceService';

export const complianceRouter = router({
  /**
   * Obtém conformidade de um projeto específico
   */
  getProjectCompliance: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const metrics = await ComplianceService.getProjectCompliance(input.projectId);
        return {
          success: true,
          data: metrics,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter conformidade do projeto:', error);
        return {
          success: false,
          error: 'Erro ao obter conformidade do projeto',
        };
      }
    }),

  /**
   * Obtém conformidade de todos os projetos
   */
  getAllProjectsCompliance: protectedProcedure
    .query(async () => {
      try {
        const metrics = await ComplianceService.getAllProjectsCompliance();
        return {
          success: true,
          data: metrics,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter conformidade de todos os projetos:', error);
        return {
          success: false,
          error: 'Erro ao obter conformidade de todos os projetos',
        };
      }
    }),

  /**
   * Obtém tendências de conformidade para um período
   */
  getComplianceTrends: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        periodDays: z.number().optional().default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        const trends = await ComplianceService.getComplianceTrends(
          input.projectId,
          input.startDate,
          input.endDate,
          input.periodDays
        );
        return {
          success: true,
          data: trends,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter tendências de conformidade:', error);
        return {
          success: false,
          error: 'Erro ao obter tendências de conformidade',
        };
      }
    }),

  /**
   * Obtém estatísticas gerais de conformidade
   */
  getComplianceStats: protectedProcedure
    .query(async () => {
      try {
        const stats = await ComplianceService.getComplianceStats();
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter estatísticas de conformidade:', error);
        return {
          success: false,
          error: 'Erro ao obter estatísticas de conformidade',
        };
      }
    }),

  /**
   * Obtém projetos em risco (conformidade baixa)
   */
  getProjectsAtRisk: protectedProcedure
    .input(z.object({ threshold: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      try {
        const projects = await ComplianceService.getProjectsAtRisk(input.threshold);
        return {
          success: true,
          data: projects,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter projetos em risco:', error);
        return {
          success: false,
          error: 'Erro ao obter projetos em risco',
        };
      }
    }),

  /**
   * Obtém distribuição de marcos por status
   */
  getMilestoneDistribution: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        const distribution = await ComplianceService.getMilestoneDistribution(input.projectId);
        return {
          success: true,
          data: distribution,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter distribuição de marcos:', error);
        return {
          success: false,
          error: 'Erro ao obter distribuição de marcos',
        };
      }
    }),

  /**
   * Exporta dados de conformidade em CSV
   */
  exportComplianceCSV: protectedProcedure
    .query(async () => {
      try {
        const csv = await ComplianceService.exportComplianceCSV();
        return {
          success: true,
          data: csv,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao exportar CSV:', error);
        return {
          success: false,
          error: 'Erro ao exportar dados de conformidade',
        };
      }
    }),
});
