import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getOrCreateCategory, createMqtItem, getMqtItems } from "./mqtDb";

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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { constructionId, items } = input;
      const imported: number[] = [];

      for (let i = 0; i < items.length; i++) {
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
      }

      return {
        success: true,
        imported: imported.length,
        ids: imported,
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
});
