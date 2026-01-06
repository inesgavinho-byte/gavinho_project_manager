import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as hrDb from "./hrDb";
import * as db from "./db";
import { notifyAdminsNewAbsenceRequest, notifyEmployeeAbsenceApproved, notifyEmployeeAbsenceRejected } from "./emailService";
import { generateAbsencesReportPDF, generateTimesheetsReportPDF } from "./pdfService";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas administradores podem aceder a esta funcionalidade",
    });
  }
  return next({ ctx });
});

export const hrRouter = router({
  // ========== HOLIDAYS ==========
  holidays: router({
    list: adminProcedure
      .input(z.object({ year: z.number().optional() }))
      .query(async ({ input }) => {
        return await hrDb.getAllHolidays(input.year);
      }),
    
    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          date: z.string(),
          year: z.number(),
          type: z.enum(["national", "regional", "company"]),
          isRecurring: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        await hrDb.createHoliday(input);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await hrDb.deleteHoliday(input.id);
        return { success: true };
      }),
  }),

  // ========== ABSENCES ==========
  absences: router({
    list: adminProcedure.query(async () => {
      return await hrDb.getAllAbsences();
    }),
    
    pending: adminProcedure.query(async () => {
      return await hrDb.getPendingAbsences();
    }),
    
    myAbsences: protectedProcedure.query(async ({ ctx }) => {
      return await hrDb.getUserAbsences(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(
        z.object({
          type: z.enum(["vacation", "sick", "personal", "other"]),
          startDate: z.string(),
          endDate: z.string(),
          days: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await hrDb.createAbsence({
          userId: ctx.user.id,
          ...input,
        });
        
        // Enviar notificação por email para administradores
        await notifyAdminsNewAbsenceRequest({
          employeeName: ctx.user.name,
          employeeEmail: ctx.user.email,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason || "Sem motivo especificado",
          daysCount: input.days,
        });
        
        return { success: true };
      }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Buscar dados da ausência antes de aprovar
        const absence = await hrDb.getAbsenceById(input.id);
        if (!absence) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ausência não encontrada" });
        }
        
        await hrDb.approveAbsence(input.id, ctx.user.id);
        
        // Enviar notificação por email ao colaborador
        await notifyEmployeeAbsenceApproved({
          employeeName: absence.user.name,
          employeeEmail: absence.user.email,
          type: absence.type,
          startDate: absence.startDate,
          endDate: absence.endDate,
          status: "approved",
          approverName: ctx.user.name,
        });
        
        return { success: true };
      }),
    
    reject: adminProcedure
      .input(
        z.object({
          id: z.number(),
          rejectionReason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Buscar dados da ausência antes de rejeitar
        const absence = await hrDb.getAbsenceById(input.id);
        if (!absence) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ausência não encontrada" });
        }
        
        await hrDb.rejectAbsence(input.id, ctx.user.id, input.rejectionReason);
        
        // Enviar notificação por email ao colaborador
        await notifyEmployeeAbsenceRejected({
          employeeName: absence.user.name,
          employeeEmail: absence.user.email,
          type: absence.type,
          startDate: absence.startDate,
          endDate: absence.endDate,
          status: "rejected",
          approverName: ctx.user.name,
          comments: input.rejectionReason,
        });
        
        return { success: true };
      }),
  }),

  // ========== TEAM ==========
  team: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    vacationDays: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          year: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await hrDb.getUserVacationDays(input.userId, input.year);
      }),
  }),

  // ========== METRICS ==========
  metrics: router({
    absences: adminProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return await hrDb.getAbsenceMetrics(input.year);
      }),
  }),

  // ========== TIMESHEETS ==========
  timesheets: router({
    listMy: protectedProcedure
      .query(async ({ ctx }) => {
        return await hrDb.getUserTimesheets(ctx.user.id);
      }),
    
    listPending: adminProcedure
      .query(async () => {
        return await hrDb.getPendingTimesheets();
      }),
    
    stats: protectedProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = input.userId || ctx.user.id;
        return await hrDb.getTimesheetStats(userId, input.startDate, input.endDate);
      }),
    
    byProject: protectedProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = input.userId || ctx.user.id;
        return await hrDb.getTimesheetsByProject(userId, input.startDate, input.endDate);
      }),
    
    byMonth: protectedProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          months: z.number().default(6),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = input.userId || ctx.user.id;
        return await hrDb.getTimesheetsByMonth(userId, input.months);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          date: z.string(),
          projectId: z.number(),
          hours: z.number().min(0.5).max(24),
          description: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await hrDb.createTimesheet({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await hrDb.approveTimesheet(input.id, ctx.user.id);
        return { success: true };
      }),
    
    reject: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await hrDb.rejectTimesheet(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
  
  // ========== REPORTS ==========
  reports: router({
    absencesPDF: adminProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          companyType: z.enum(["arquitetura", "build"]).default("arquitetura"),
        })
      )
      .mutation(async ({ input }) => {
        const absences = await hrDb.getAllAbsences();
        
        // Filter by date range if provided
        let filteredAbsences = absences;
        if (input.startDate || input.endDate) {
          filteredAbsences = absences.filter(a => {
            const startDate = new Date(a.startDate);
            if (input.startDate && startDate < new Date(input.startDate)) return false;
            if (input.endDate && startDate > new Date(input.endDate)) return false;
            return true;
          });
        }
        
        const pdfBuffer = await generateAbsencesReportPDF({
          absences: filteredAbsences.map(a => ({
            userName: a.userName || "N/A",
            type: a.type,
            startDate: a.startDate,
            endDate: a.endDate,
            days: a.days,
            status: a.status,
          })),
          startDate: input.startDate,
          endDate: input.endDate,
          companyType: input.companyType,
        });
        
        return {
          pdf: pdfBuffer.toString("base64"),
          filename: `relatorio_ausencias_${new Date().toISOString().split('T')[0]}.pdf`,
        };
      }),
    
    timesheetsPDF: adminProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          companyType: z.enum(["arquitetura", "build"]).default("arquitetura"),
        })
      )
      .mutation(async ({ input }) => {
        const timesheets = input.userId 
          ? await hrDb.getUserTimesheets(input.userId)
          : await hrDb.getPendingTimesheets();
        
        // Filter by date range if provided
        let filteredTimesheets = timesheets;
        if (input.startDate || input.endDate) {
          filteredTimesheets = timesheets.filter(t => {
            const date = new Date(t.date);
            if (input.startDate && date < new Date(input.startDate)) return false;
            if (input.endDate && date > new Date(input.endDate)) return false;
            return true;
          });
        }
        
        // Get stats
        const stats = input.userId
          ? await hrDb.getTimesheetStats(input.userId, input.startDate, input.endDate)
          : null;
        
        const pdfBuffer = await generateTimesheetsReportPDF({
          timesheets: filteredTimesheets.map(t => ({
            userName: t.userName || "N/A",
            date: t.date.toString(),
            projectCode: t.projectCode || "N/A",
            hours: t.hours,
            description: t.description,
            status: t.status,
          })),
          stats: stats ? {
            totalHours: stats.totalHours,
            uniqueProjects: stats.uniqueProjects,
            approvedHours: stats.approvedHours,
          } : undefined,
          startDate: input.startDate,
          endDate: input.endDate,
          companyType: input.companyType,
        });
        
        return {
          pdf: pdfBuffer.toString("base64"),
          filename: `relatorio_timesheets_${new Date().toISOString().split('T')[0]}.pdf`,
        };
      }),
  }),
});
