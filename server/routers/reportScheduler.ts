import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { scheduledEmailReports, emailReportLogs } from "../../drizzle/schema";

export const reportSchedulerRouter = router({
  // Criar novo agendamento de relatório
  createSchedule: protectedProcedure
    .input(z.object({
      projectId: z.number().int(),
      name: z.string(),
      description: z.string().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      recipients: z.array(z.string().email()),
      includeMetrics: z.boolean().default(true),
      includeTrends: z.boolean().default(true),
      includeAlerts: z.boolean().default(true),
      includeInsights: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { createScheduledReport } = await import('../emailReportService');
        const { scheduleReport, frequencyToCronExpression } = await import('../reportSchedulerService');
        
        const reportId = await createScheduledReport(input, ctx.user.id);
        
        const cronExpression = frequencyToCronExpression(
          input.frequency,
          input.time,
          input.dayOfWeek,
          input.dayOfMonth
        );
        
        scheduleReport(reportId, cronExpression);
        
        return { success: true, reportId };
      } catch (error) {
        console.error('Error creating schedule:', error);
        throw error;
      }
    }),

  // Listar agendamentos de um projeto
  listSchedules: protectedProcedure
    .input(z.object({ projectId: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) return [];
        
        const reports = await dbInstance
          .select()
          .from(scheduledEmailReports)
          .where(eq(scheduledEmailReports.projectId, input.projectId));
        
        return reports.map(r => ({
          ...r,
          recipients: JSON.parse(r.recipients || '[]'),
        }));
      } catch (error) {
        console.error('Error listing schedules:', error);
        return [];
      }
    }),

  // Obter detalhes de um agendamento
  getSchedule: protectedProcedure
    .input(z.object({ reportId: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        const report = await dbInstance
          .select()
          .from(scheduledEmailReports)
          .where(eq(scheduledEmailReports.id, input.reportId))
          .limit(1);
        
        if (!report || report.length === 0) throw new Error('Agendamento não encontrado');
        
        return {
          ...report[0],
          recipients: JSON.parse(report[0].recipients || '[]'),
        };
      } catch (error) {
        console.error('Error getting schedule:', error);
        throw error;
      }
    }),

  // Atualizar agendamento
  updateSchedule: protectedProcedure
    .input(z.object({
      reportId: z.number().int(),
      name: z.string().optional(),
      description: z.string().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
      time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      recipients: z.array(z.string().email()).optional(),
      includeMetrics: z.boolean().optional(),
      includeTrends: z.boolean().optional(),
      includeAlerts: z.boolean().optional(),
      includeInsights: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { reportId, ...updates } = input;
        const { scheduleReport, frequencyToCronExpression, unscheduleReport } = await import('../reportSchedulerService');
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        if (updates.frequency || updates.time || updates.dayOfWeek || updates.dayOfMonth) {
          const report = await dbInstance
            .select()
            .from(scheduledEmailReports)
            .where(eq(scheduledEmailReports.id, reportId))
            .limit(1);
          
          if (report && report.length > 0) {
            const frequency = updates.frequency || report[0].frequency;
            const time = updates.time || report[0].time;
            const dayOfWeek = updates.dayOfWeek ?? report[0].dayOfWeek;
            const dayOfMonth = updates.dayOfMonth ?? report[0].dayOfMonth;
            
            unscheduleReport(reportId);
            
            const cronExpression = frequencyToCronExpression(
              frequency,
              time,
              dayOfWeek,
              dayOfMonth
            );
            
            scheduleReport(reportId, cronExpression);
          }
        }
        
        const updateData = {
          ...updates,
          recipients: updates.recipients ? JSON.stringify(updates.recipients) : undefined,
        };
        
        await dbInstance
          .update(scheduledEmailReports)
          .set(updateData)
          .where(eq(scheduledEmailReports.id, reportId));
        
        return { success: true };
      } catch (error) {
        console.error('Error updating schedule:', error);
        throw error;
      }
    }),

  // Deletar agendamento
  deleteSchedule: protectedProcedure
    .input(z.object({ reportId: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        const { unscheduleReport } = await import('../reportSchedulerService');
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        unscheduleReport(input.reportId);
        
        await dbInstance
          .delete(scheduledEmailReports)
          .where(eq(scheduledEmailReports.id, input.reportId));
        
        return { success: true };
      } catch (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }
    }),

  // Ativar/desativar agendamento
  toggleSchedule: protectedProcedure
    .input(z.object({ reportId: z.number().int(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        const { scheduleReport, unscheduleReport, frequencyToCronExpression } = await import('../reportSchedulerService');
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        if (input.isActive) {
          const report = await dbInstance
            .select()
            .from(scheduledEmailReports)
            .where(eq(scheduledEmailReports.id, input.reportId))
            .limit(1);
          
          if (report && report.length > 0) {
            const cronExpression = frequencyToCronExpression(
              report[0].frequency,
              report[0].time,
              report[0].dayOfWeek,
              report[0].dayOfMonth
            );
            
            scheduleReport(input.reportId, cronExpression);
          }
        } else {
          unscheduleReport(input.reportId);
        }
        
        await dbInstance
          .update(scheduledEmailReports)
          .set({ isActive: input.isActive ? 1 : 0 })
          .where(eq(scheduledEmailReports.id, input.reportId));
        
        return { success: true };
      } catch (error) {
        console.error('Error toggling schedule:', error);
        throw error;
      }
    }),

  // Obter histórico de envios
  getScheduleHistory: protectedProcedure
    .input(z.object({ reportId: z.number().int(), limit: z.number().int().default(10) }))
    .query(async ({ input }) => {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) return [];
        
        const logs = await dbInstance
          .select()
          .from(emailReportLogs)
          .where(eq(emailReportLogs.reportId, input.reportId))
          .orderBy(desc(emailReportLogs.sentAt))
          .limit(input.limit);
        
        return logs.map(log => ({
          ...log,
          recipients: JSON.parse(log.recipients || '[]'),
          reportData: JSON.parse(log.reportData || '{}'),
        }));
      } catch (error) {
        console.error('Error getting schedule history:', error);
        return [];
      }
    }),

  // Obter status de todos os agendamentos
  getStatus: protectedProcedure.query(async () => {
    try {
      const { getScheduledReportsStatus } = await import('../reportSchedulerService');
      return getScheduledReportsStatus();
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      return [];
    }
  }),
});
