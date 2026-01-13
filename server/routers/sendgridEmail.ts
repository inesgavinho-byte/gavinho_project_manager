import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  sendReminderEmail,
  sendTestEmail,
  getUserEmailPreferences,
  updateUserEmailPreferences,
  type EmailReminder
} from '../services/sendgridEmailService';

export const sendgridEmailRouter = router({
  /**
   * Enviar email de lembrete de evento
   */
  sendReminder: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        eventType: z.enum(['delivery', 'adjudication', 'payment']),
        eventDate: z.date(),
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        projectName: z.string(),
        description: z.string(),
        reminderType: z.enum(['1day', '1hour'])
      })
    )
    .mutation(async ({ input }) => {
      const reminder: EmailReminder = {
        projectId: input.projectId,
        eventType: input.eventType,
        eventDate: input.eventDate,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        projectName: input.projectName,
        description: input.description,
        reminderType: input.reminderType
      };

      const result = await sendReminderEmail(reminder);
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    }),

  /**
   * Enviar email de teste
   */
  sendTest: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const result = await sendTestEmail(input.email);
      return {
        success: result.success,
        error: result.error
      };
    }),

  /**
   * Obter preferências de email do usuário
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await getUserEmailPreferences(ctx.user.id);
    return preferences;
  }),

  /**
   * Atualizar preferências de email
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        deliveryReminders: z.boolean().optional(),
        adjudicationReminders: z.boolean().optional(),
        paymentReminders: z.boolean().optional(),
        reminderTiming: z.array(z.enum(['1day', '1hour'])).optional(),
        emailFrequency: z.enum(['immediate', 'daily', 'weekly']).optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = await updateUserEmailPreferences(ctx.user.id, input);
      return { success };
    }),

  /**
   * Obter status de configuração do SendGrid
   */
  getStatus: protectedProcedure.query(async () => {
    const apiKeyConfigured = !!process.env.SENDGRID_API_KEY;
    const fromEmailConfigured = !!process.env.SENDGRID_FROM_EMAIL;
    const replyEmailConfigured = !!process.env.SENDGRID_REPLY_EMAIL;

    return {
      configured: apiKeyConfigured && fromEmailConfigured,
      apiKeyConfigured,
      fromEmailConfigured,
      replyEmailConfigured,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@gavinho.com',
      replyEmail: process.env.SENDGRID_REPLY_EMAIL || 'support@gavinho.com'
    };
  }),

  /**
   * Enviar lembretes em massa para um projeto
   */
  sendBulkReminders: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        reminders: z.array(
          z.object({
            eventType: z.enum(['delivery', 'adjudication', 'payment']),
            eventDate: z.date(),
            recipientEmail: z.string().email(),
            recipientName: z.string(),
            projectName: z.string(),
            description: z.string(),
            reminderType: z.enum(['1day', '1hour'])
          })
        )
      })
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.reminders.map(reminder =>
          sendReminderEmail({
            projectId: input.projectId,
            eventType: reminder.eventType,
            eventDate: reminder.eventDate,
            recipientEmail: reminder.recipientEmail,
            recipientName: reminder.recipientName,
            projectName: reminder.projectName,
            description: reminder.description,
            reminderType: reminder.reminderType
          })
        )
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        total: results.length,
        successful,
        failed,
        results
      };
    })
});
