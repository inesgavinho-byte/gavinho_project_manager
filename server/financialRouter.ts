import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as financialDb from "./financialDb";

export const financialRouter = router({
  getFinancialKPIs: protectedProcedure.query(async () => {
    return await financialDb.getFinancialKPIs();
  }),

  getBudgetEvolution: protectedProcedure.query(async () => {
    return await financialDb.getBudgetEvolution();
  }),

  getCostComparison: protectedProcedure.query(async () => {
    return await financialDb.getCostComparison();
  }),

  getProjectProfitability: protectedProcedure.query(async () => {
    return await financialDb.getProjectProfitability();
  }),

  getBudgetAlerts: protectedProcedure.query(async () => {
    return await financialDb.getBudgetAlerts();
  }),

  getExpenseTrends: protectedProcedure.query(async () => {
    return await financialDb.getExpenseTrends();
  }),
});
