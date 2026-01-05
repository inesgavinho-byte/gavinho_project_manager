import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getOrCreateCategory, createMqtItem, getMqtItems, createImportHistory, createImportItem, getImportHistory, revertImport, getValidationRules, createValidationRule, updateValidationRule, deleteValidationRule, toggleValidationRule } from "./mqtDb";

const mqtImportRowSchema = z.object({
  code: z.string(),
  category: z.string(),
  type: z.string().optional(),
  subtype: z.string().optional(),
  zone: z.string().optional(),
  description: z.string(),
  unit: z.string(),
  quantity: z.number(),
  unitPrice: z.number().optional(),
  totalPrice: z.number().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export const mqtRouter = router({
  /**
   * Import MQT items from Excel or Google Sheets
   */
  importItems: protectedProcedure
    .input(
      z.object({
        constructionId: z.number(),
        items: z.array(mqtImportRowSchema),
        source: z.enum(["excel", "sheets"]),
        fileName: z.string().optional(),
        sheetsUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { constructionId, items, source, fileName, sheetsUrl } = input;
      const imported: number[] = [];
      const errors: string[] = [];

      // Create import history record
      const importId = await createImportHistory({
        constructionId,
        userId: ctx.user.id,
        source,
        fileName,
        sheetsUrl,
        itemsImported: items.length,
      });

      for (let i = 0; i < items.length; i++) {
        try {
          const item = items[i];

          // Get or create category
          const categoryId = await getOrCreateCategory(
            constructionId,
            item.category,
            item.code.split('.')[0] // Extract category code from item code (e.g., "1.1" -> "1")
          );

          // Create MQT item
          const itemId = await createMqtItem({
            constructionId,
            categoryId,
            code: item.code,
            typePt: item.type,
            subtypePt: item.subtype,
            zonePt: item.zone,
            descriptionPt: item.description,
            unit: item.unit,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice?.toString(),
            totalPrice: item.totalPrice?.toString(),
            notes: item.notes,
            order: i + 1,
          });

          imported.push(itemId);

          // Track which items were added in this import
          await createImportItem(importId, itemId);
        } catch (error) {
          errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        imported: imported.length,
        errors: errors.length,
        ids: imported,
        importId,
      };
    }),

  /**
   * Get all MQT items for a construction
   */
  getItems: protectedProcedure
    .input(z.object({ constructionId: z.number() }))
    .query(async ({ input }) => {
      return await getMqtItems(input.constructionId);
    }),

  /**
   * Get import history for a construction
   */
  getImportHistory: protectedProcedure
    .input(z.object({ constructionId: z.number() }))
    .query(async ({ input }) => {
      return await getImportHistory(input.constructionId);
    }),

  /**
   * Revert an import (delete all items that were added in that import)
   */
  revertImport: protectedProcedure
    .input(z.object({ importId: z.number() }))
    .mutation(async ({ input }) => {
      return await revertImport(input.importId);
    }),

  /**
   * Get validation rules for a construction
   */
  getValidationRules: protectedProcedure
    .input(z.object({ constructionId: z.number() }))
    .query(async ({ input }) => {
      return await getValidationRules(input.constructionId);
    }),

  /**
   * Create a new validation rule
   */
  createValidationRule: protectedProcedure
    .input(z.object({
      constructionId: z.number(),
      name: z.string(),
      ruleType: z.enum(['price_min', 'price_max', 'code_pattern', 'quantity_min', 'quantity_max', 'duplicate_check']),
      field: z.string(),
      condition: z.string(),
      severity: z.enum(['error', 'warning', 'info']),
      message: z.string().optional(),
      enabled: z.boolean(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await createValidationRule(input);
    }),

  /**
   * Update a validation rule
   */
  updateValidationRule: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      ruleType: z.enum(['price_min', 'price_max', 'code_pattern', 'quantity_min', 'quantity_max', 'duplicate_check']).optional(),
      field: z.string().optional(),
      condition: z.string().optional(),
      severity: z.enum(['error', 'warning', 'info']).optional(),
      message: z.string().optional(),
      enabled: z.boolean().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateValidationRule(id, data);
    }),

  /**
   * Delete a validation rule
   */
  deleteValidationRule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteValidationRule(input.id);
    }),

  /**
   * Toggle validation rule enabled status
   */
  toggleValidationRule: protectedProcedure
    .input(z.object({ id: z.number(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return await toggleValidationRule(input.id, input.enabled);
    }),
});
