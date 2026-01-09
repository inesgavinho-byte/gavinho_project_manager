import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as financialDb from "./financialDb";

const filterSchema = z.object({
  period: z.enum(['monthly', 'quarterly', 'yearly', 'all']).optional(),
  status: z.string().optional(),
  clientName: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).optional();

export const financialRouter = router({
  getFinancialKPIs: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await financialDb.getFinancialKPIs(input);
    }),

  getBudgetEvolution: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await financialDb.getBudgetEvolution(input);
    }),

  getCostComparison: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await financialDb.getCostComparison(input);
    }),

  getProjectProfitability: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await financialDb.getProjectProfitability(input);
    }),

  getBudgetAlerts: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await financialDb.getBudgetAlerts(input);
    }),

  getExpenseTrends: protectedProcedure
    .input(filterSchema)
    .query(async ({ input }) => {
      return await financialDb.getExpenseTrends(input);
    }),
});
