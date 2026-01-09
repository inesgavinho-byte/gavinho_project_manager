import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as teamManagementDb from "./teamManagementDb";

export const teamManagementRouter = router({
  getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
    return await teamManagementDb.getUserAssignments(ctx.user.id);
  }),

  getAllTasks: protectedProcedure.query(async () => {
    return await teamManagementDb.getAllTasks();
  }),

  getMyTimeEntries: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      return await teamManagementDb.getUserTimeEntries(
        ctx.user.id,
        input.startDate,
        input.endDate
      );
    }),

  getTimeSummary: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      return await teamManagementDb.getTimeSummary(
        ctx.user.id,
        input.startDate,
        input.endDate
      );
    }),

  logTime: protectedProcedure
    .input(z.object({
      description: z.string(),
      hours: z.number(),
      date: z.date(),
      taskId: z.number().optional(),
      projectId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await teamManagementDb.logTimeEntry({
        userId: ctx.user.id,
        projectId: input.projectId,
        taskId: input.taskId,
        description: input.description,
        hours: input.hours,
        date: input.date,
      });
    }),

  getMyAvailability: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      return await teamManagementDb.getUserAvailability(
        ctx.user.id,
        input.startDate,
        input.endDate
      );
    }),

  getTeamAvailability: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return await teamManagementDb.getTeamAvailability(
        input.startDate,
        input.endDate
      );
    }),

  setAvailability: protectedProcedure
    .input(z.object({
      date: z.date(),
      status: z.enum(["available", "busy", "off", "vacation"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await teamManagementDb.setUserAvailability({
        userId: ctx.user.id,
        date: input.date,
        status: input.status,
        notes: input.notes,
      });
    }),

  getProductivityReport: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      userId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // If userId not provided, use current user
      const userId = input.userId || ctx.user.id;
      
      return await teamManagementDb.getProductivityReport(
        input.startDate,
        input.endDate,
        userId
      );
    }),
});
