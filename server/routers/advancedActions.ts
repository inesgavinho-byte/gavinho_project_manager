import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { AdvancedActionsService, type ActionType } from '../advancedActionsService';

export const advancedActionsRouter = router({
  /**
   * Executa uma ação avançada
   */
  executeAction: protectedProcedure
    .input(
      z.object({
        actionType: z.enum(['pause_project', 'create_support_ticket', 'schedule_review_meeting', 'send_email', 'update_project_status', 'notify_stakeholders']),
        actionConfig: z.record(z.any()),
        context: z.object({
          projectId: z.string(),
          milestoneId: z.string(),
          projectName: z.string(),
          milestoneName: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await AdvancedActionsService.executeAction(
          input.actionType as ActionType,
          input.actionConfig,
          input.context
        );
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao executar ação:', error);
        return {
          success: false,
          error: 'Erro ao executar ação',
        };
      }
    }),

  /**
   * Executa múltiplas ações em sequência
   */
  executeMultipleActions: protectedProcedure
    .input(
      z.object({
        actions: z.array(
          z.object({
            type: z.enum(['pause_project', 'create_support_ticket', 'schedule_review_meeting', 'send_email', 'update_project_status', 'notify_stakeholders']),
            config: z.record(z.any()),
          })
        ),
        context: z.object({
          projectId: z.string(),
          milestoneId: z.string(),
          projectName: z.string(),
          milestoneName: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const results = await AdvancedActionsService.executeMultipleActions(
          input.actions.map((a) => ({
            type: a.type as ActionType,
            config: a.config,
          })),
          input.context
        );
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao executar múltiplas ações:', error);
        return {
          success: false,
          error: 'Erro ao executar múltiplas ações',
        };
      }
    }),

  /**
   * Obtém ações disponíveis
   */
  getAvailableActions: protectedProcedure
    .query(async () => {
      try {
        const availableActions = [
          {
            type: 'pause_project',
            label: 'Pausar Projeto',
            description: 'Pausa o projeto automaticamente',
            configFields: [
              {
                name: 'reason',
                label: 'Motivo',
                type: 'text',
                required: false,
              },
            ],
          },
          {
            type: 'create_support_ticket',
            label: 'Gerar Ticket de Suporte',
            description: 'Cria um ticket de suporte automaticamente',
            configFields: [
              {
                name: 'title',
                label: 'Título do Ticket',
                type: 'text',
                required: false,
              },
              {
                name: 'description',
                label: 'Descrição',
                type: 'textarea',
                required: false,
              },
              {
                name: 'priority',
                label: 'Prioridade',
                type: 'select',
                options: ['low', 'medium', 'high', 'critical'],
                required: false,
              },
              {
                name: 'assignee',
                label: 'Atribuir a',
                type: 'text',
                required: false,
              },
            ],
          },
          {
            type: 'schedule_review_meeting',
            label: 'Agendar Reunião de Revisão',
            description: 'Agenda uma reunião de revisão automaticamente',
            configFields: [
              {
                name: 'title',
                label: 'Título da Reunião',
                type: 'text',
                required: false,
              },
              {
                name: 'description',
                label: 'Descrição',
                type: 'textarea',
                required: false,
              },
              {
                name: 'hoursFromNow',
                label: 'Horas a partir de agora',
                type: 'number',
                required: false,
                defaultValue: 24,
              },
              {
                name: 'durationMinutes',
                label: 'Duração (minutos)',
                type: 'number',
                required: false,
                defaultValue: 60,
              },
              {
                name: 'attendees',
                label: 'Participantes (emails)',
                type: 'textarea',
                required: false,
              },
            ],
          },
          {
            type: 'send_email',
            label: 'Enviar Email Customizado',
            description: 'Envia um email customizado automaticamente',
            configFields: [
              {
                name: 'recipients',
                label: 'Destinatários (emails)',
                type: 'textarea',
                required: true,
              },
              {
                name: 'subject',
                label: 'Assunto',
                type: 'text',
                required: true,
              },
              {
                name: 'body',
                label: 'Corpo do Email',
                type: 'textarea',
                required: true,
              },
            ],
          },
          {
            type: 'update_project_status',
            label: 'Atualizar Status do Projeto',
            description: 'Atualiza o status do projeto automaticamente',
            configFields: [
              {
                name: 'newStatus',
                label: 'Novo Status',
                type: 'select',
                options: ['active', 'paused', 'at_risk', 'completed', 'cancelled'],
                required: true,
              },
            ],
          },
          {
            type: 'notify_stakeholders',
            label: 'Notificar Stakeholders',
            description: 'Notifica stakeholders automaticamente',
            configFields: [
              {
                name: 'stakeholders',
                label: 'Stakeholders',
                type: 'textarea',
                required: true,
              },
              {
                name: 'title',
                label: 'Título da Notificação',
                type: 'text',
                required: false,
              },
              {
                name: 'message',
                label: 'Mensagem',
                type: 'textarea',
                required: false,
              },
            ],
          },
        ];

        return {
          success: true,
          data: availableActions,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao obter ações disponíveis:', error);
        return {
          success: false,
          error: 'Erro ao obter ações disponíveis',
        };
      }
    }),

  /**
   * Valida configuração de ação
   */
  validateActionConfig: protectedProcedure
    .input(
      z.object({
        actionType: z.enum(['pause_project', 'create_support_ticket', 'schedule_review_meeting', 'send_email', 'update_project_status', 'notify_stakeholders']),
        config: z.record(z.any()),
      })
    )
    .query(async ({ input }) => {
      try {
        const errors: string[] = [];

        // Validações específicas por tipo de ação
        if (input.actionType === 'send_email') {
          if (!input.config.recipients || input.config.recipients.length === 0) {
            errors.push('Destinatários são obrigatórios');
          }
          if (!input.config.subject) {
            errors.push('Assunto é obrigatório');
          }
          if (!input.config.body) {
            errors.push('Corpo do email é obrigatório');
          }
        }

        if (input.actionType === 'update_project_status') {
          if (!input.config.newStatus) {
            errors.push('Novo status é obrigatório');
          }
        }

        return {
          success: errors.length === 0,
          errors,
        };
      } catch (error) {
        console.error('[tRPC] Erro ao validar configuração:', error);
        return {
          success: false,
          errors: ['Erro ao validar configuração'],
        };
      }
    }),
});
