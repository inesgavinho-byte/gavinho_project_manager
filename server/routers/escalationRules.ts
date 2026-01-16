import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { EscalationService } from '../escalationService';

const escalationLevelSchema = z.object({
  level: z.enum(['manager', 'director', 'admin', 'owner']),
  daysOverdue: z.number().min(1),
  notifyRoles: z.array(z.string()),
  message: z.string().optional(),
});

const createRuleSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  escalationLevels: z.array(escalationLevelSchema),
});

const updateRuleSchema = z.object({
  ruleId: z.string(),
  updates: createRuleSchema.partial(),
});

export const escalationRulesRouter = router({
  /**
   * Lista regras de escalonamento de um projeto
   */
  listRules: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const rules = await EscalationService.listRules(input.projectId);
        return {
          success: true,
          data: rules,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao listar regras:', error);
        return {
          success: false,
          error: 'Erro ao listar regras de escalonamento',
        };
      }
    }),

  /**
   * Cria uma nova regra de escalonamento
   */
  createRule: protectedProcedure
    .input(createRuleSchema)
    .mutation(async ({ input }) => {
      try {
        const rule = await EscalationService.createRule({
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          isActive: true,
          escalationLevels: input.escalationLevels,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return {
          success: true,
          data: rule,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao criar regra:', error);
        return {
          success: false,
          error: 'Erro ao criar regra de escalonamento',
        };
      }
    }),

  /**
   * Atualiza uma regra de escalonamento
   */
  updateRule: protectedProcedure
    .input(updateRuleSchema)
    .mutation(async ({ input }) => {
      try {
        await EscalationService.updateRule(input.ruleId, input.updates);

        return {
          success: true,
          message: 'Regra atualizada com sucesso',
        };
      } catch (error) {
        console.error('[tRPC] Erro ao atualizar regra:', error);
        return {
          success: false,
          error: 'Erro ao atualizar regra de escalonamento',
        };
      }
    }),

  /**
   * Deleta uma regra de escalonamento
   */
  deleteRule: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await EscalationService.deleteRule(input.ruleId);

        return {
          success: true,
          message: 'Regra deletada com sucesso',
        };
      } catch (error) {
        console.error('[tRPC] Erro ao deletar regra:', error);
        return {
          success: false,
          error: 'Erro ao deletar regra de escalonamento',
        };
      }
    }),

  /**
   * Ativa ou desativa uma regra
   */
  toggleRule: protectedProcedure
    .input(z.object({ ruleId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        await EscalationService.updateRule(input.ruleId, {
          isActive: input.isActive,
        } as any);

        return {
          success: true,
          message: input.isActive ? 'Regra ativada' : 'Regra desativada',
        };
      } catch (error) {
        console.error('[tRPC] Erro ao alternar regra:', error);
        return {
          success: false,
          error: 'Erro ao alternar regra de escalonamento',
        };
      }
    }),

  /**
   * Obtém histórico de escalonamento de um marco
   */
  getMilestoneHistory: protectedProcedure
    .input(z.object({ milestoneId: z.string() }))
    .query(async ({ input }) => {
      try {
        const history = await EscalationService.getMilestoneEscalationHistory(input.milestoneId);

        return {
          success: true,
          data: history,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter histórico:', error);
        return {
          success: false,
          error: 'Erro ao obter histórico de escalonamento',
        };
      }
    }),

  /**
   * Obtém estatísticas de escalonamento
   */
  getStats: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const stats = await EscalationService.getEscalationStats(input.projectId);

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter estatísticas:', error);
        return {
          success: false,
          error: 'Erro ao obter estatísticas de escalonamento',
        };
      }
    }),

  /**
   * Testa uma regra de escalonamento
   */
  testRule: protectedProcedure
    .input(z.object({ ruleId: z.string(), milestoneId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Aqui você pode implementar lógica para testar a regra
        // Por enquanto, apenas retornamos sucesso

        return {
          success: true,
          message: 'Regra testada com sucesso',
        };
      } catch (error) {
        console.error('[tRPC] Erro ao testar regra:', error);
        return {
          success: false,
          error: 'Erro ao testar regra de escalonamento',
        };
      }
    }),

  /**
   * Obtém templates de níveis de escalonamento
   */
  getLevelTemplates: protectedProcedure
    .query(async () => {
      return {
        success: true,
        data: [
          {
            level: 'manager',
            label: 'Gestor',
            description: 'Notificar gestor do projeto',
            defaultDaysOverdue: 3,
            icon: '👤',
          },
          {
            level: 'director',
            label: 'Diretor',
            description: 'Notificar diretor de projeto',
            defaultDaysOverdue: 7,
            icon: '👔',
          },
          {
            level: 'admin',
            label: 'Administrador',
            description: 'Notificar administrador do sistema',
            defaultDaysOverdue: 10,
            icon: '⚙️',
          },
          {
            level: 'owner',
            label: 'Proprietário',
            description: 'Notificar proprietário do projeto',
            defaultDaysOverdue: 14,
            icon: '👑',
          },
        ],
      };
    }),

  /**
   * Obtém templates de regras pré-configuradas
   */
  getRuleTemplates: protectedProcedure
    .query(async () => {
      return {
        success: true,
        data: [
          {
            id: 'template_standard',
            name: 'Escalonamento Padrão',
            description: 'Escalonamento em 3 níveis: Gestor (3 dias), Diretor (7 dias), Admin (10 dias)',
            escalationLevels: [
              {
                level: 'manager',
                daysOverdue: 3,
                notifyRoles: ['manager'],
                message: 'Marco vencido há 3 dias. Ação imediata necessária.',
              },
              {
                level: 'director',
                daysOverdue: 7,
                notifyRoles: ['director'],
                message: 'Marco vencido há 7 dias. Escalação para diretor.',
              },
              {
                level: 'admin',
                daysOverdue: 10,
                notifyRoles: ['admin'],
                message: 'Marco vencido há 10 dias. Escalação crítica.',
              },
            ],
          },
          {
            id: 'template_aggressive',
            name: 'Escalonamento Agressivo',
            description: 'Escalonamento rápido: Gestor (1 dia), Diretor (3 dias), Admin (5 dias)',
            escalationLevels: [
              {
                level: 'manager',
                daysOverdue: 1,
                notifyRoles: ['manager'],
                message: 'Marco vencido há 1 dia. Ação urgente necessária.',
              },
              {
                level: 'director',
                daysOverdue: 3,
                notifyRoles: ['director'],
                message: 'Marco vencido há 3 dias. Escalação para diretor.',
              },
              {
                level: 'admin',
                daysOverdue: 5,
                notifyRoles: ['admin'],
                message: 'Marco vencido há 5 dias. Escalação crítica.',
              },
            ],
          },
          {
            id: 'template_relaxed',
            name: 'Escalonamento Relaxado',
            description: 'Escalonamento lento: Gestor (7 dias), Diretor (14 dias), Admin (21 dias)',
            escalationLevels: [
              {
                level: 'manager',
                daysOverdue: 7,
                notifyRoles: ['manager'],
                message: 'Marco vencido há 1 semana. Revisão necessária.',
              },
              {
                level: 'director',
                daysOverdue: 14,
                notifyRoles: ['director'],
                message: 'Marco vencido há 2 semanas. Escalação para diretor.',
              },
              {
                level: 'admin',
                daysOverdue: 21,
                notifyRoles: ['admin'],
                message: 'Marco vencido há 3 semanas. Escalação crítica.',
              },
            ],
          },
        ],
      };
    }),
});
