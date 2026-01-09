import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as productivityDb from "./productivityDb";

const filterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).optional();

export const productivityRouter = router({
  getTeamProductivityMetrics: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await productivityDb.getTeamProductivityMetrics(input);
    }),

  getTaskCompletionRates: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await productivityDb.getTaskCompletionRates(input);
    }),

  getEfficiencyMetrics: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await productivityDb.getEfficiencyMetrics(input);
    }),

  getProductivityTrends: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await productivityDb.getProductivityTrends(input);
    }),
});
