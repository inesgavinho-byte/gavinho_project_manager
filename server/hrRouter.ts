import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as hrDb from "./hrDb";
import * as db from "./db";

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
        return { success: true };
      }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await hrDb.approveAbsence(input.id, ctx.user.id);
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
        await hrDb.rejectAbsence(input.id, ctx.user.id, input.rejectionReason);
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
    myTimesheets: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return await hrDb.getUserTimesheets(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number().optional(),
          date: z.string(),
          hours: z.number(),
          description: z.string().optional(),
          taskType: z.string().optional(),
          isBillable: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await hrDb.createTimesheet({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),
});
