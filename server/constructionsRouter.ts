import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as constructionsDb from "./constructionsDb";

export const constructionsRouter = router({
  // ==================== CONSTRUCTIONS ====================
  
  list: protectedProcedure.query(async () => {
    return await constructionsDb.getAllConstructions();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await constructionsDb.getConstructionById(input.id);
    }),

  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      return await constructionsDb.getConstructionByCode(input.code);
    }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        projectId: z.number().optional(),
        client: z.string().optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        budget: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await constructionsDb.createConstruction(input);
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        projectId: z.number().optional(),
        client: z.string().optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        budget: z.string().optional(),
        actualCost: z.string().optional(),
        progress: z.number().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await constructionsDb.updateConstruction(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await constructionsDb.deleteConstruction(input.id);
      return { success: true };
    }),

  // ==================== MQT CATEGORIES ====================

  categories: router({
    list: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await constructionsDb.getMqtCategoriesByConstruction(input.constructionId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          constructionId: z.number(),
          code: z.string(),
          namePt: z.string(),
          nameEn: z.string().optional(),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await constructionsDb.createMqtCategory(input);
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          code: z.string().optional(),
          namePt: z.string().optional(),
          nameEn: z.string().optional(),
          order: z.number().optional(),
          subtotal: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await constructionsDb.updateMqtCategory(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await constructionsDb.deleteMqtCategory(input.id);
        return { success: true };
      }),
  }),

  // ==================== MQT ITEMS ====================

  items: router({
    listByConstruction: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await constructionsDb.getMqtItemsByConstruction(input.constructionId);
      }),

    listByCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await constructionsDb.getMqtItemsByCategory(input.categoryId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          constructionId: z.number(),
          categoryId: z.number(),
          code: z.string(),
          typePt: z.string().optional(),
          typeEn: z.string().optional(),
          subtypePt: z.string().optional(),
          subtypeEn: z.string().optional(),
          zonePt: z.string().optional(),
          zoneEn: z.string().optional(),
          descriptionPt: z.string(),
          descriptionEn: z.string().optional(),
          unit: z.string(),
          quantity: z.string(),
          unitPrice: z.string().optional(),
          totalPrice: z.string().optional(),
          supplierId: z.number().optional(),
          status: z.enum(["pending", "ordered", "in_progress", "completed"]).optional(),
          notes: z.string().optional(),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await constructionsDb.createMqtItem(input);
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          code: z.string().optional(),
          typePt: z.string().optional(),
          typeEn: z.string().optional(),
          subtypePt: z.string().optional(),
          subtypeEn: z.string().optional(),
          zonePt: z.string().optional(),
          zoneEn: z.string().optional(),
          descriptionPt: z.string().optional(),
          descriptionEn: z.string().optional(),
          unit: z.string().optional(),
          quantity: z.string().optional(),
          unitPrice: z.string().optional(),
          totalPrice: z.string().optional(),
          supplierId: z.number().optional(),
          status: z.enum(["pending", "ordered", "in_progress", "completed"]).optional(),
          notes: z.string().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await constructionsDb.updateMqtItem(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await constructionsDb.deleteMqtItem(input.id);
        return { success: true };
      }),

    updateQuantityExecuted: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          quantityExecuted: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get current value before updating
        const currentItem = await constructionsDb.getMqtItemById(input.id);
        const oldValue = currentItem?.quantityExecuted || "0.00";
        
        // Update quantity executed
        await constructionsDb.updateMqtItemQuantityExecuted(input.id, input.quantityExecuted);
        
        // Record history entry
        await constructionsDb.createMqtItemHistoryEntry({
          itemId: input.id,
          userId: ctx.user.id,
          oldValue: oldValue,
          newValue: input.quantityExecuted,
        });
        
        return { success: true };
      }),

    getHistory: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .query(async ({ input }) => {
        return await constructionsDb.getMqtItemHistory(input.itemId);
      }),
  }),

  // ==================== MQT ANALYTICS ====================

  analytics: router({
    overview: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await constructionsDb.getMqtHistoryAnalytics(input.constructionId);
      }),

    mostEditedItems: protectedProcedure
      .input(z.object({ constructionId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await constructionsDb.getMostEditedItems(input.constructionId, input.limit);
      }),

    mostActiveUsers: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await constructionsDb.getMostActiveUsers(input.constructionId);
      }),

    criticalDeviations: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await constructionsDb.getCriticalDeviations(input.constructionId);
      }),

    activityTimeline: protectedProcedure
      .input(z.object({ constructionId: z.number(), days: z.number().optional() }))
      .query(async ({ input }) => {
        return await constructionsDb.getActivityTimeline(input.constructionId, input.days);
      }),
  }),

  // ==================== STATISTICS ====================

  statistics: protectedProcedure
    .input(z.object({ constructionId: z.number() }))
    .query(async ({ input }) => {
      return await constructionsDb.getConstructionStatistics(input.constructionId);
    }),
});
