import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as archvizDb from "./archvizDb";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";

export const archvizRouter = router({
  // ============================================================================
  // COMPARTMENTS
  // ============================================================================
  
  compartments: router({
    list: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await archvizDb.getCompartmentsByConstruction(input.constructionId);
      }),

    create: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        parentId: z.number().optional(),
        name: z.string(),
        description: z.string().optional(),
        order: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const id = await archvizDb.createCompartment(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await archvizDb.updateCompartment(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await archvizDb.deleteCompartment(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // RENDERS
  // ============================================================================

  renders: router({
    listByCompartment: protectedProcedure
      .input(z.object({ compartmentId: z.number() }))
      .query(async ({ input }) => {
        return await archvizDb.getRendersByCompartment(input.compartmentId);
      }),

    listByConstruction: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await archvizDb.getRendersByConstruction(input.constructionId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const render = await archvizDb.getRenderById(input.id);
        if (!render) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Render not found" });
        }
        return render;
      }),

    upload: protectedProcedure
      .input(z.object({
        compartmentId: z.number(),
        constructionId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        fileData: z.string(), // Base64 encoded file
        mimeType: z.string(),
        fileSize: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get next version number
        const version = await archvizDb.getNextVersionNumber(input.compartmentId);

        // Upload file to S3
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileKey = `archviz/${input.constructionId}/${input.compartmentId}/v${version}-${Date.now()}.${input.mimeType.split("/")[1]}`;
        const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Create render record
        const id = await archvizDb.createRender({
          compartmentId: input.compartmentId,
          constructionId: input.constructionId,
          version,
          name: input.name,
          description: input.description,
          fileUrl,
          fileKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          uploadedById: ctx.user.id,
        });

        return { id, version, fileUrl };
      }),

    toggleFavorite: protectedProcedure
      .input(z.object({
        id: z.number(),
        isFavorite: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await archvizDb.toggleFavorite(input.id, input.isFavorite);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        compartmentId: z.number().optional(),
        status: z.enum(["pending", "approved_dc", "approved_client"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, notes, ...data } = input;
        
        // If status is changing, record history and notify owner
        if (input.status) {
          const render = await archvizDb.getRenderById(id);
          if (render && render.status !== input.status) {
            await archvizDb.createStatusHistory({
              renderId: id,
              oldStatus: render.status,
              newStatus: input.status,
              changedById: ctx.user.id,
              notes: notes,
            });
            
            // Get construction name for notification
            const construction = await archvizDb.getConstructionByRenderId(id);
            
            // Format status labels
            const statusLabels: Record<string, string> = {
              pending: "Pendente",
              approved_dc: "Aprovada DC",
              approved_client: "Aprovada DC + Cliente"
            };
            
            // Send notification to owner
            await notifyOwner({
              title: `Render "${render.name}" - Mudança de Status`,
              content: `**Obra:** ${construction?.name || "N/A"}\n\n` +
                       `**Render:** ${render.name} (v${render.version})\n\n` +
                       `**Status:** ${statusLabels[render.status]} → ${statusLabels[input.status]}\n\n` +
                       `**Alterado por:** ${ctx.user.name}\n\n` +
                       (notes ? `**Notas:** ${notes}` : "")
            });
          }
        }
        
        await archvizDb.updateRender(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Get render to delete file from S3
        const render = await archvizDb.getRenderById(input.id);
        if (render) {
          // TODO: Delete from S3 using render.fileKey
          // For now, just delete from DB
          await archvizDb.deleteRender(input.id);
        }
        return { success: true };
      }),
  }),

  // ============================================================================
  // COMMENTS
  // ============================================================================

  comments: router({
    list: protectedProcedure
      .input(z.object({ renderId: z.number() }))
      .query(async ({ input }) => {
        return await archvizDb.getCommentsByRender(input.renderId);
      }),

    getCount: protectedProcedure
      .input(z.object({ renderId: z.number() }))
      .query(async ({ input }) => {
        return await archvizDb.getCommentCountByRender(input.renderId);
      }),

    create: protectedProcedure
      .input(z.object({
        renderId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await archvizDb.createComment({
          renderId: input.renderId,
          userId: ctx.user.id,
          content: input.content,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        await archvizDb.updateComment(input.id, input.content);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await archvizDb.deleteComment(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // STATISTICS
  // ============================================================================

  stats: protectedProcedure
    .input(z.object({ constructionId: z.number() }))
    .query(async ({ input }) => {
      return await archvizDb.getArchvizStats(input.constructionId);
    }),

  // ============================================================================
  // STATUS HISTORY
  // ============================================================================

  getStatusHistory: protectedProcedure
    .input(z.object({ renderId: z.number() }))
    .query(async ({ input }) => {
      return await archvizDb.getStatusHistory(input.renderId);
    }),

   // ============================================================================
  // REPORT DATA
  // ============================================================================
  getReportData: protectedProcedure
    .input(z.object({ constructionId: z.number() }))
    .query(async ({ input }) => {
      return await archvizDb.getReportData(input.constructionId);
    }),

  // ============================================================================
  // ANNOTATIONS
  // ============================================================================
  annotations: router({
    get: protectedProcedure
      .input(z.object({ renderId: z.number() }))
      .query(async ({ input }) => {
        return await archvizDb.getAnnotations(input.renderId);
      }),

    save: protectedProcedure
      .input(z.object({
        renderId: z.number(),
        annotations: z.array(z.object({
          id: z.string(),
          type: z.enum(["arrow", "circle", "rectangle", "text", "pen"]),
          color: z.string(),
          lineWidth: z.number(),
          points: z.array(z.object({ x: z.number(), y: z.number() })),
          text: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        await archvizDb.saveAnnotations(input.renderId, input.annotations, ctx.user.id);
        return { success: true };
      }),
  }),
});
