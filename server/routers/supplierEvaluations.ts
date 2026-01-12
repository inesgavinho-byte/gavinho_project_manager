import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createSupplierEvaluation,
  getSupplierEvaluations,
  getSupplierEvaluationStats,
  updateSupplierEvaluation,
  deleteSupplierEvaluation,
  getSupplierEvaluationById,
  getSupplierEvaluationHistory,
} from "../supplierEvaluationsDb";

const createEvaluationSchema = z.object({
  supplierId: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  quality: z.number().min(1).max(5).optional(),
  timeliness: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  comments: z.string().optional(),
  projectId: z.number().int().optional(),
});

const getEvaluationsSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "all"]).optional(),
  supplierId: z.number().int().optional(),
});

export const supplierEvaluationsRouter = router({
  create: protectedProcedure
    .input(createEvaluationSchema)
    .mutation(async ({ input, ctx }) => {
      return createSupplierEvaluation({
        ...input,
        evaluatedBy: ctx.user.id,
      });
    }),

  list: protectedProcedure
    .input(getEvaluationsSchema)
    .query(async ({ input }) => {
      return getSupplierEvaluations(input);
    }),

  getStats: protectedProcedure
    .input(z.object({ supplierId: z.number().int() }))
    .query(async ({ input }) => {
      return getSupplierEvaluationStats(input.supplierId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return getSupplierEvaluationById(input.id);
    }),

  getHistory: protectedProcedure
    .input(z.object({ supplierId: z.number().int(), limit: z.number().int().optional() }))
    .query(async ({ input }) => {
      return getSupplierEvaluationHistory(input.supplierId, input.limit);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        data: createEvaluationSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      return updateSupplierEvaluation(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      return deleteSupplierEvaluation(input.id);
    }),
});
