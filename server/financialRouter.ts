import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as financialDb from "./financialDb";
import { sendBudgetAlertEmail } from "./budgetEmailService";
import { predictProjectCosts } from "./aiPredictionService";

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

  // Budget Alert Endpoints
  checkBudgetThresholds: protectedProcedure
    .query(async () => {
      return await financialDb.checkBudgetThresholds();
    }),

  sendBudgetAlert: protectedProcedure
    .input(z.object({
      budgetId: z.number(),
      projectId: z.number(),
      projectName: z.string(),
      budgetTotal: z.number(),
      actualCost: z.number(),
      percentage: z.number(),
      alertType: z.enum(["warning", "critical", "exceeded"]),
      threshold: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Get budget breakdown
      const breakdown = await financialDb.getBudgetBreakdown(input.budgetId);

      // Send email
      const emailSent = await sendBudgetAlertEmail({
        projectName: input.projectName,
        projectId: input.projectId,
        budgetTotal: input.budgetTotal,
        actualCost: input.actualCost,
        percentage: input.percentage,
        alertType: input.alertType,
        breakdown,
      });

      // Create alert record
      const message = `Orçamento atingiu ${input.percentage.toFixed(1)}% (€${input.actualCost.toLocaleString("pt-PT")} de €${input.budgetTotal.toLocaleString("pt-PT")})`;
      const alertId = await financialDb.createBudgetAlert({
        budgetId: input.budgetId,
        alertType: input.alertType,
        threshold: input.threshold,
        currentPercentage: input.percentage,
        message,
      });

      return { success: emailSent, alertId };
    }),

  getUnreadBudgetAlerts: protectedProcedure
    .query(async () => {
      return await financialDb.getUnreadBudgetAlerts();
    }),

  markBudgetAlertAsRead: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      await financialDb.markBudgetAlertAsRead(input.alertId, ctx.user.id);
      return { success: true };
    }),

  getBudgetBreakdown: protectedProcedure
    .input(z.object({
      budgetId: z.number(),
    }))
    .query(async ({ input }) => {
      return await financialDb.getBudgetBreakdown(input.budgetId);
    }),

  // Cost Prediction Endpoints
  predictProjectCosts: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Get project data
      const projectData = await financialDb.getProjectById(input.projectId);
      if (!projectData) {
        throw new Error("Project not found");
      }

      // Find similar projects
      const similarProjects = await financialDb.findSimilarProjects(input.projectId, 10);

      // Generate prediction using AI
      const prediction = await predictProjectCosts(projectData as any, similarProjects);

      // Save prediction to database
      const predictionId = await financialDb.saveCostPrediction({
        projectId: input.projectId,
        ...prediction,
      });

      return { ...prediction, id: predictionId };
    }),

  getCostPredictions: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      return await financialDb.getCostPredictions(input.projectId);
    }),

  getLatestCostPrediction: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      return await financialDb.getLatestCostPrediction(input.projectId);
    }),

  getHighRiskProjects: protectedProcedure
    .query(async () => {
      return await financialDb.getHighRiskProjects();
    }),

  findSimilarProjects: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      return await financialDb.findSimilarProjects(input.projectId, input.limit);
    }),
});
