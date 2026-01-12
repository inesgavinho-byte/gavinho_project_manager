import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as approvalNotificationsService from "../approvalNotificationsService";

export const approvalNotificationsRouter = router({
  getUnread: protectedProcedure
    .query(async ({ ctx }) => {
      return await approvalNotificationsService.getUnreadNotifications(ctx.user.id);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int() }))
    .mutation(async ({ input }) => {
      return await approvalNotificationsService.markNotificationAsRead(input.notificationId);
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await approvalNotificationsService.markAllNotificationsAsRead(ctx.user.id);
    }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.number().int() }))
    .mutation(async ({ input }) => {
      return await approvalNotificationsService.deleteNotification(input.notificationId);
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      return await approvalNotificationsService.getNotificationStats(ctx.user.id);
    }),

  notifySupplierEvaluation: protectedProcedure
    .input(z.object({
      supplierId: z.number().int(),
      supplierName: z.string(),
      rating: z.number().min(1).max(5),
    }))
    .mutation(async ({ input, ctx }) => {
      return await approvalNotificationsService.notifySupplierEvaluation(
        input.supplierId,
        input.supplierName,
        input.rating,
        ctx.user.name || "Sistema"
      );
    }),

  notifyProjectStatusChange: protectedProcedure
    .input(z.object({
      projectId: z.number().int(),
      projectName: z.string(),
      oldStatus: z.string(),
      newStatus: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await approvalNotificationsService.notifyProjectStatusChange(
        input.projectId,
        input.projectName,
        input.oldStatus,
        input.newStatus,
        ctx.user.name || "Sistema"
      );
    }),

  notifyProjectCompletion: protectedProcedure
    .input(z.object({
      projectId: z.number().int(),
      projectName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await approvalNotificationsService.notifyProjectCompletion(
        input.projectId,
        input.projectName,
        ctx.user.name || "Sistema"
      );
    }),
});
