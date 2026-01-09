import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as calendarDb from "./calendarDb";

const eventTypeSchema = z.enum(["meeting", "deadline", "delivery", "site_visit", "presentation", "milestone", "personal", "other"]);
const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const statusSchema = z.enum(["scheduled", "completed", "cancelled", "postponed"]);

const recurrenceRuleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number(),
  endDate: z.string().optional(),
  daysOfWeek: z.array(z.number()).optional(),
});

export const calendarRouter = router({
  // Create Event
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        allDay: z.boolean(),
        eventType: eventTypeSchema,
        priority: prioritySchema.optional(),
        projectId: z.number().optional(),
        deliveryId: z.number().optional(),
        constructionId: z.number().optional(),
        location: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurrenceRule: recurrenceRuleSchema.optional(),
        reminderMinutes: z.number().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const eventId = await calendarDb.createCalendarEvent({
        ...input,
        createdById: ctx.user.id,
      });
      return { eventId };
    }),

  // Update Event
  updateEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        allDay: z.boolean().optional(),
        eventType: eventTypeSchema.optional(),
        priority: prioritySchema.optional(),
        projectId: z.number().optional(),
        deliveryId: z.number().optional(),
        constructionId: z.number().optional(),
        location: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurrenceRule: recurrenceRuleSchema.optional(),
        reminderMinutes: z.number().optional(),
        status: statusSchema.optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { eventId, ...updateData } = input;
      await calendarDb.updateCalendarEvent(eventId, ctx.user.id, updateData);
      return { success: true };
    }),

  // Delete Event
  deleteEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await calendarDb.deleteCalendarEvent(input.eventId, ctx.user.id);
      return { success: true };
    }),

  // Get Events by Date Range
  getEventsByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await calendarDb.getEventsByDateRange(input.startDate, input.endDate, ctx.user.id);
    }),

  // Get Upcoming Events
  getUpcomingEvents: protectedProcedure
    .input(
      z
        .object({
          days: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      return await calendarDb.getUpcomingEvents(ctx.user.id, input?.days);
    }),

  // Get Project Deadlines
  getProjectDeadlines: protectedProcedure.query(async ({ ctx }) => {
    return await calendarDb.getProjectDeadlines(ctx.user.id);
  }),

  // Get Single Event
  getEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await calendarDb.getCalendarEvent(input.eventId, ctx.user.id);
    }),

  // Get Events by Project
  getEventsByProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await calendarDb.getEventsByProject(input.projectId, ctx.user.id);
    }),
});
