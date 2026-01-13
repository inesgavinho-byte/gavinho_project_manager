import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { EmailHistoryService } from '../services/emailHistoryService';

export const emailHistoryRouter = router({
  /**
   * Obter histórico de emails com filtros
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        eventType: z.enum(['delivery', 'adjudication', 'payment']).optional(),
        status: z.enum(['sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        recipientEmail: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return await EmailHistoryService.getEmailHistory(input);
    }),

  /**
   * Obter estatísticas gerais de emails
   */
  getStatistics: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ input }) => {
      return await EmailHistoryService.getEmailStatistics(input.projectId);
    }),

  /**
   * Obter estatísticas por tipo de evento
   */
  getStatisticsByEventType: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ input }) => {
      return await EmailHistoryService.getStatisticsByEventType(input.projectId);
    }),

  /**
   * Obter estatísticas por data (últimos N dias)
   */
  getStatisticsByDate: protectedProcedure
    .input(z.object({ projectId: z.string().optional(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await EmailHistoryService.getStatisticsByDate(input.projectId, input.days);
    }),

  /**
   * Obter razões de bounce
   */
  getBounceReasons: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ input }) => {
      return await EmailHistoryService.getBounceReasons(input.projectId);
    }),

  /**
   * Exportar histórico de emails (CSV)
   */
  exportHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        eventType: z.enum(['delivery', 'adjudication', 'payment']).optional(),
        status: z.enum(['sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const history = await EmailHistoryService.getEmailHistory({
        ...input,
        limit: 10000,
      });

      // Converter para CSV
      const headers = [
        'ID',
        'Projeto',
        'Tipo de Evento',
        'Email',
        'Nome',
        'Assunto',
        'Status',
        'Enviado em',
        'Entregue em',
        'Aberto em',
        'Clicado em',
        'Motivo de Bounce',
      ];

      const rows = history.map((email) => [
        email.id,
        email.projectId,
        email.eventType,
        email.recipientEmail,
        email.recipientName,
        email.subject,
        email.status,
        email.sentAt?.toISOString() || '',
        email.deliveredAt?.toISOString() || '',
        email.openedAt?.toISOString() || '',
        email.clickedAt?.toISOString() || '',
        email.bounceReason || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return {
        csv,
        filename: `email-history-${new Date().toISOString().split('T')[0]}.csv`,
      };
    }),
});
