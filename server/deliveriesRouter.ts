import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as deliveriesDb from "./deliveriesDb";
import { storagePut } from "./storage";
import { checkAndNotifyDeliveries } from "./deliveryNotificationService";

export const deliveriesRouter = router({
  // List all deliveries for a project
  list: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return deliveriesDb.listDeliveries(input.projectId);
    }),

  // Get single delivery
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return deliveriesDb.getDelivery(input.id);
    }),

  // Create new delivery
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        phaseId: z.number().optional(),
        name: z.string(),
        description: z.string().optional(),
        type: z.enum(["document", "drawing", "render", "model", "report", "specification", "other"]),
        dueDate: z.date(),
        assignedToId: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
      })
    )
    .mutation(async ({ input }) => {
      const id = await deliveriesDb.createDelivery(input);
      return { id };
    }),

  // Update delivery
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["document", "drawing", "render", "model", "report", "specification", "other"]).optional(),
        dueDate: z.date().optional(),
        status: z.enum(["pending", "in_review", "approved", "rejected", "delivered"]).optional(),
        assignedToId: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await deliveriesDb.updateDelivery(id, data);
      return { success: true };
    }),

  // Upload delivery file
  uploadFile: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        fileData: z.string(), // base64 encoded file
        fileName: z.string(),
        fileType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileData, "base64");
      const fileKey = `deliveries/${input.id}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.fileType);

      // Update delivery record
      await deliveriesDb.uploadDeliveryFile(
        input.id,
        url,
        fileKey,
        buffer.length,
        ctx.user.id
      );

      return { url, fileKey };
    }),

  // Delete delivery
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deliveriesDb.deleteDelivery(input.id);
      return { success: true };
    }),

  // Get upcoming deliveries (next 30 days)
  upcoming: publicProcedure
    .input(z.object({ projectId: z.number(), days: z.number().optional() }))
    .query(async ({ input }) => {
      return deliveriesDb.getUpcomingDeliveries(input.projectId, input.days);
    }),

  // Get delivery statistics
  stats: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return deliveriesDb.getDeliveryStats(input.projectId);
    }),

  // Approvals sub-router
  approvals: router({
    // List approvals for a delivery
    list: publicProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return deliveriesDb.listApprovals(input.deliveryId);
      }),

    // Create approval/rejection
    create: protectedProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          status: z.enum(["approved", "rejected", "revision_requested"]),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await deliveriesDb.createApproval({
          deliveryId: input.deliveryId,
          reviewerId: ctx.user.id,
          status: input.status,
          comments: input.comments,
        });
        return { id };
      }),
  }),

  // Check and send notifications (for testing or manual trigger)
  checkNotifications: protectedProcedure
    .mutation(async () => {
      return checkAndNotifyDeliveries();
    }),
});
