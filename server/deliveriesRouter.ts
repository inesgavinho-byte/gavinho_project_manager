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

  // ============================================================================
  // VERSIONAMENTO DE ENTREGAS
  // ============================================================================
  versions: router({
    // Get all versions of a delivery
    list: publicProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return deliveriesDb.getDeliveryVersions(input.deliveryId);
      }),

    // Get latest version
    latest: publicProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return deliveriesDb.getLatestDeliveryVersion(input.deliveryId);
      }),

    // Upload new version
    upload: protectedProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          versionNotes: z.string().optional(),
          fileData: z.string(), // base64
          fileName: z.string(),
          fileType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const nextVersion = await deliveriesDb.getNextVersionNumber(input.deliveryId);
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `deliveries/${input.deliveryId}/v${nextVersion}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        await deliveriesDb.createDeliveryVersion({
          deliveryId: input.deliveryId,
          version: nextVersion,
          versionNotes: input.versionNotes,
          fileUrl: url,
          fileKey,
          fileSize: buffer.length,
          uploadedById: ctx.user.id,
        });

        return { version: nextVersion, url, fileKey };
      }),
  }),

  // ============================================================================
  // CHECKLISTS AUTOMATICOS
  // ============================================================================
  checklists: router({
    // Get checklist for delivery
    get: publicProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return deliveriesDb.getDeliveryChecklist(input.deliveryId);
      }),

    // Add checklist item
    addItem: protectedProcedure
      .input(
        z.object({
          checklistId: z.number(),
          title: z.string(),
          description: z.string().optional(),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return deliveriesDb.addChecklistItem(input);
      }),

    // Complete checklist item
    completeItem: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return deliveriesDb.completeChecklistItem(input.itemId, ctx.user.id);
      }),

    // Get completion percentage
    completion: publicProcedure
      .input(z.object({ checklistId: z.number() }))
      .query(async ({ input }) => {
        return deliveriesDb.getChecklistCompletion(input.checklistId);
      }),
  }),

  // ============================================================================
  // APROVACAO DO CLIENTE
  // ============================================================================
  clientApproval: router({
    // Get approval status
    status: publicProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return deliveriesDb.getClientApprovalStatus(input.deliveryId);
      }),

    // Approve as client
    approve: protectedProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          feedback: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return deliveriesDb.approveDeliveryAsClient(
          input.deliveryId,
          ctx.user.id,
          input.feedback
        );
      }),

    // Reject as client
    reject: protectedProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          rejectionReason: z.string(),
          feedback: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return deliveriesDb.rejectDeliveryAsClient(
          input.deliveryId,
          ctx.user.id,
          input.rejectionReason,
          input.feedback
        );
      }),

    // Request revision as client
    requestRevision: protectedProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          feedback: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return deliveriesDb.requestRevisionAsClient(
          input.deliveryId,
          ctx.user.id,
          input.feedback
        );
      }),
  }),

  // ============================================================================
  // NOTIFICACOES
  // ============================================================================
  notifications: router({
    // Get unread notifications
    unread: protectedProcedure.query(async ({ ctx }) => {
      return deliveriesDb.getUnreadDeliveryNotifications(ctx.user.id);
    }),

    // Mark as read
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        return deliveriesDb.markNotificationAsRead(input.notificationId);
      }),
  }),

  // ============================================================================
  // AUDITORIA
  // ============================================================================
  audit: router({
    // Get audit log for delivery
    log: publicProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return deliveriesDb.getDeliveryAuditLog(input.deliveryId);
      }),
  }),

  // ============================================================================
  // RELATORIOS E METRICAS
  // ============================================================================
  metrics: router({
    // Calculate delivery metrics
    calculate: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
          phaseId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return deliveriesDb.calculateDeliveryMetrics(input.projectId, input.phaseId);
      }),

    // Get deliveries by status
    byStatus: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
          status: z.enum(["pending", "in_review", "approved", "rejected", "delivered"]),
        })
      )
      .query(async ({ input }) => {
        return deliveriesDb.getDeliveriesByStatus(input.projectId, input.status);
      }),

    // Get overdue deliveries
    overdue: publicProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ input }) => {
        return deliveriesDb.getOverdueDeliveries(input.projectId);
      }),

    // Get upcoming deliveries (advanced)
    upcoming: publicProcedure
      .input(
        z.object({
          projectId: z.number().optional(),
          daysAhead: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return deliveriesDb.getUpcomingDeliveriesAdvanced(input.projectId, input.daysAhead);
      }),

    // Get delivery reports
    reports: publicProcedure
      .input(
        z.object({
          projectId: z.number(),
          phaseId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return deliveriesDb.getDeliveryReports(input.projectId, input.phaseId);
      }),
  }),
});
