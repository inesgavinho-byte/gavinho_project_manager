import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { AuditService } from '../auditService';

export const auditRouter = router({
  /**
   * Obtém logs de auditoria com filtros
   */
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        actionType: z.string().optional(),
        status: z.enum(['pending', 'executing', 'success', 'failed']).optional(),
        projectId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const logs = await AuditService.getAuditLogs({
          actionType: input.actionType,
          status: input.status,
          projectId: input.projectId,
          startDate: input.startDate,
          endDate: input.endDate,
          limit: input.limit,
          offset: input.offset,
        });

        return {
          success: true,
          data: logs,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter logs de auditoria:', error);
        return {
          success: false,
          error: 'Erro ao obter logs de auditoria',
        };
      }
    }),

  /**
   * Obtém estatísticas de auditoria
   */
  getAuditStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const stats = await AuditService.getAuditStats({
          projectId: input.projectId,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter estatísticas:', error);
        return {
          success: false,
          error: 'Erro ao obter estatísticas',
        };
      }
    }),

  /**
   * Obtém auditoria por ID
   */
  getAuditById: protectedProcedure
    .input(z.object({ auditId: z.string() }))
    .query(async ({ input }) => {
      try {
        const audit = await AuditService.getAuditById(input.auditId);

        if (!audit) {
          return {
            success: false,
            error: 'Auditoria não encontrada',
          };
        }

        return {
          success: true,
          data: audit,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter auditoria:', error);
        return {
          success: false,
          error: 'Erro ao obter auditoria',
        };
      }
    }),

  /**
   * Obtém auditorias por projeto
   */
  getProjectAudits: protectedProcedure
    .input(z.object({ projectId: z.string(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      try {
        const audits = await AuditService.getProjectAudits(input.projectId, input.limit);

        return {
          success: true,
          data: audits,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter auditorias do projeto:', error);
        return {
          success: false,
          error: 'Erro ao obter auditorias do projeto',
        };
      }
    }),

  /**
   * Obtém auditorias por marco
   */
  getMilestoneAudits: protectedProcedure
    .input(z.object({ milestoneId: z.string(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      try {
        const audits = await AuditService.getMilestoneAudits(input.milestoneId, input.limit);

        return {
          success: true,
          data: audits,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter auditorias do marco:', error);
        return {
          success: false,
          error: 'Erro ao obter auditorias do marco',
        };
      }
    }),

  /**
   * Exporta auditorias em CSV
   */
  exportToCSV: protectedProcedure
    .input(
      z.object({
        actionType: z.string().optional(),
        status: z.enum(['pending', 'executing', 'success', 'failed']).optional(),
        projectId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const csv = await AuditService.exportToCSV({
          actionType: input.actionType,
          status: input.status,
          projectId: input.projectId,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        return {
          success: true,
          data: csv,
          filename: `audit-export-${new Date().toISOString().split('T')[0]}.csv`,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao exportar auditoria:', error);
        return {
          success: false,
          error: 'Erro ao exportar auditoria',
        };
      }
    }),

  /**
   * Obtém ações por hora
   */
  getActionsByHour: protectedProcedure
    .input(z.object({ hours: z.number().optional().default(24) }))
    .query(async ({ input }) => {
      try {
        const data = await AuditService.getActionsByHour(input.hours);

        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter ações por hora:', error);
        return {
          success: false,
          error: 'Erro ao obter ações por hora',
        };
      }
    }),

  /**
   * Obtém taxa de sucesso por tipo de ação
   */
  getSuccessRateByActionType: protectedProcedure.query(async () => {
    try {
      const data = await AuditService.getSuccessRateByActionType();

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[tRPC] Erro ao obter taxa de sucesso:', error);
      return {
        success: false,
        error: 'Erro ao obter taxa de sucesso',
      };
    }
  }),

  /**
   * Limpa auditorias antigas
   */
  cleanOldAudits: protectedProcedure
    .input(z.object({ daysOld: z.number().optional().default(90) }))
    .mutation(async ({ input }) => {
      try {
        const removedCount = await AuditService.cleanOldAudits(input.daysOld);

        return {
          success: true,
          data: {
            removedCount,
            message: `${removedCount} auditorias antigas removidas`,
          },
        };
      } catch (error) {
        console.error('[tRPC] Erro ao limpar auditorias antigas:', error);
        return {
          success: false,
          error: 'Erro ao limpar auditorias antigas',
        };
      }
    }),
});
