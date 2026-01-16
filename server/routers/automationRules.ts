import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { AutomationService, AutomationRule, AutomationAction } from '../automationService';
import { TRPCError } from '@trpc/server';

// Schemas de validação
const automationActionSchema = z.object({
  type: z.enum(['notify_team', 'update_project_status', 'create_alert', 'send_email', 'update_milestone_status']),
  config: z.record(z.any()),
});

const automationRuleSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  trigger: z.enum(['milestone_overdue', 'milestone_due_soon', 'milestone_completed']),
  triggerConfig: z.object({
    daysBeforeDue: z.number().optional(),
  }).optional(),
  actions: z.array(automationActionSchema).min(1, 'Pelo menos uma ação é obrigatória'),
  isActive: z.boolean().default(true),
});

export const automationRulesRouter = router({
  /**
   * Lista regras de automação de um projeto
   */
  listRules: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      try {
        const rules = await AutomationService.listRules(input.projectId);
        return {
          success: true,
          data: rules,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar regras de automação',
        });
      }
    }),

  /**
   * Cria uma nova regra de automação
   */
  createRule: protectedProcedure
    .input(automationRuleSchema)
    .mutation(async ({ input }) => {
      try {
        const rule = await AutomationService.createRule({
          id: '',
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AutomationRule);

        return {
          success: true,
          data: rule,
          message: 'Regra de automação criada com sucesso',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar regra de automação',
        });
      }
    }),

  /**
   * Atualiza uma regra de automação
   */
  updateRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      updates: automationRuleSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      try {
        await AutomationService.updateRule(input.ruleId, input.updates as Partial<AutomationRule>);

        return {
          success: true,
          message: 'Regra de automação atualizada com sucesso',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar regra de automação',
        });
      }
    }),

  /**
   * Deleta uma regra de automação
   */
  deleteRule: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await AutomationService.deleteRule(input.ruleId);

        return {
          success: true,
          message: 'Regra de automação deletada com sucesso',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar regra de automação',
        });
      }
    }),

  /**
   * Ativa/desativa uma regra de automação
   */
  toggleRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      try {
        await AutomationService.updateRule(input.ruleId, { isActive: input.isActive } as any);

        return {
          success: true,
          message: `Regra de automação ${input.isActive ? 'ativada' : 'desativada'} com sucesso`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao alternar regra de automação',
        });
      }
    }),

  /**
   * Obtém logs de execução de uma regra
   */
  getRuleLogs: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      try {
        const logs = await AutomationService.getRuleLogs(input.ruleId, input.limit);

        return {
          success: true,
          data: logs,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao obter logs de automação',
        });
      }
    }),

  /**
   * Testa uma regra de automação
   */
  testRule: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      milestoneId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Executar regra para um marco específico
        await AutomationService.executeMilestoneRules(input.milestoneId);

        return {
          success: true,
          message: 'Regra de automação testada com sucesso',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao testar regra de automação',
        });
      }
    }),

  /**
   * Obtém templates de ações pré-configuradas
   */
  getActionTemplates: protectedProcedure
    .query(async () => {
      return {
        success: true,
        data: [
          {
            type: 'notify_team',
            label: 'Notificar Equipa',
            description: 'Envia notificação para todos os membros da equipa',
            config: {
              action: 'Revisar',
            },
          },
          {
            type: 'update_project_status',
            label: 'Atualizar Status do Projeto',
            description: 'Altera o status do projeto',
            config: {
              status: 'at_risk',
            },
          },
          {
            type: 'update_milestone_status',
            label: 'Atualizar Status do Marco',
            description: 'Altera o status do marco',
            config: {
              status: 'at_risk',
            },
          },
          {
            type: 'create_alert',
            label: 'Criar Alerta',
            description: 'Cria um alerta no sistema',
            config: {
              message: 'Marco requer atenção',
            },
          },
          {
            type: 'send_email',
            label: 'Enviar Email',
            description: 'Envia email para destinatários específicos',
            config: {
              recipients: [],
              subject: 'Alerta de Marco',
              body: '',
            },
          },
        ],
      };
    }),

  /**
   * Obtém templates de triggers pré-configurados
   */
  getTriggerTemplates: protectedProcedure
    .query(async () => {
      return {
        success: true,
        data: [
          {
            type: 'milestone_overdue',
            label: 'Marco Atrasado',
            description: 'Dispara quando um marco ultrapassa a data de vencimento',
            config: {},
          },
          {
            type: 'milestone_due_soon',
            label: 'Marco Próximo do Vencimento',
            description: 'Dispara quando um marco está próximo do vencimento',
            config: {
              daysBeforeDue: 3,
            },
          },
          {
            type: 'milestone_completed',
            label: 'Marco Concluído',
            description: 'Dispara quando um marco é marcado como concluído',
            config: {},
          },
        ],
      };
    }),
});
