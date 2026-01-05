import { z } from "zod";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { budgets } from "../drizzle/schema";
import { aiAnalysisService } from "./aiAnalysisService";
import * as aiSuggestionsDb from "./aiSuggestionsDb";
import { reportService } from "./reportService";
import { exportService } from "./exportService";
import * as notificationDb from "./notificationDb";
import { runNotificationChecks } from "./notificationService";
import * as supplierDb from "./supplierDb";
import * as supplierAnalyticsService from "./supplierAnalyticsService";
import * as predictiveAnalysisService from "./predictiveAnalysisService";
import * as predictionsDb from "./predictionsDb";
import * as whatIfSimulationService from "./whatIfSimulationService";
import * as scenarioSharingService from "./scenarioSharingService";
import * as activityFeedService from "./activityFeedService";
import * as whatIfDb from "./whatIfDb";
import * as mentionService from "./mentionService";
import * as mentionDb from "./mentionDb";
import { projectsRouter } from "./projectsRouter";
import { deliveriesRouter } from "./deliveriesRouter";
import { constructionsRouter } from "./constructionsRouter";
import { archvizRouter } from "./archvizRouter";
import { mqtRouter } from "./mqtRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Projects - Full router with phases, milestones, team, documents, gallery
  projects: projectsRouter,

  // Deliveries - Central de Entregas
  deliveries: deliveriesRouter,

  // Constructions - Obras (GB) e MQT
  constructions: constructionsRouter,

  // ArchViz - Visualizações 3D / Renders
  archviz: archvizRouter,

  // MQT - Mapa de Quantidades
  mqt: mqtRouter,
    

  // Dashboard
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),

  // Quantity Maps
  quantityMaps: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQuantityMapsByProject(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        description: z.string(),
        category: z.string().optional(),
        unit: z.string(),
        plannedQuantity: z.string(),
        executedQuantity: z.string().optional(),
        unitPrice: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createQuantityMap(input);
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        executedQuantity: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateQuantityMap(id, data);
        return { success: true };
      }),
  }),

  // Suppliers
  suppliers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSuppliers();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSupplierById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        taxId: z.string().optional(),
        category: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createSupplier(input);
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        contactPerson: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSupplier(id, data);
        return { success: true };
      }),
  }),

  // Orders
  orders: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrdersByProject(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        supplierId: z.number().optional(),
        orderNumber: z.string().optional(),
        description: z.string(),
        orderType: z.enum(["material", "service", "equipment", "other"]).default("material"),
        status: z.enum(["pending", "ordered", "in_transit", "delivered", "cancelled"]).default("pending"),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        unitPrice: z.string().optional(),
        totalAmount: z.string(),
        orderDate: z.date().optional(),
        expectedDeliveryDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createOrder({
          ...input,
          createdById: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "ordered", "in_transit", "delivered", "cancelled"]).optional(),
        actualDeliveryDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateOrder(id, data);
        return { success: true };
      }),
  }),

  // Tasks
  tasks: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByProject(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "review", "done", "cancelled"]).default("todo"),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        urgency: z.enum(["low", "medium", "high"]).default("medium"),
        importance: z.enum(["low", "medium", "high"]).default("medium"),
        assignedToId: z.number().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createTask({
          ...input,
          createdById: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "review", "done", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        urgency: z.enum(["low", "medium", "high"]).optional(),
        importance: z.enum(["low", "medium", "high"]).optional(),
        assignedToId: z.number().optional(),
        dueDate: z.date().optional(),
        completedAt: z.date().optional(),
        kanbanOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTask(id, data);
        return { success: true };
      }),
  }),

  // Budgets
  budgets: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBudgetsByProject(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        category: z.string(),
        description: z.string().optional(),
        budgetedAmount: z.string(),
        actualAmount: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createBudget(input);
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        actualAmount: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // Calculate variance
        if (data.actualAmount) {
          const database = await db.getDb();
          if (!database) throw new Error("Database not available");
          const budget = await database.select().from(budgets).where(eq(budgets.id, id)).limit(1);
          if (budget && budget[0]) {
            const budgeted = parseFloat(budget[0].budgetedAmount);
            const actual = parseFloat(data.actualAmount);
            const variance = actual - budgeted;
            const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
            
            await db.updateBudget(id, {
              ...data,
              variance: variance.toFixed(2),
              variancePercent: variancePercent.toFixed(2),
            });
            return { success: true };
          }
        }
        
        await db.updateBudget(id, data);
        return { success: true };
      }),
  }),

  // AI Suggestions

  // Emails
  emails: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getEmailsByUserId(ctx.user.id);
      }),
    
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmailsByProject(input.projectId);
      }),
    
    listByCategory: protectedProcedure
      .input(z.object({ category: z.enum(["order", "adjudication", "purchase", "communication", "other"]) }))
      .query(async ({ input, ctx }) => {
        return await db.getEmailsByCategory(ctx.user.id, input.category);
      }),
    
    search: protectedProcedure
      .input(z.object({ keyword: z.string() }))
      .query(async ({ input, ctx }) => {
        return await db.searchEmails(ctx.user.id, input.keyword);
      }),
    
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getEmailStatsByCategory(ctx.user.id);
      }),
    
    assignToProject: protectedProcedure
      .input(z.object({ emailId: z.number(), projectId: z.number() }))
      .mutation(async ({ input }) => {
        await db.assignEmailToProject(input.emailId, input.projectId);
        return { success: true };
      }),
    
    markAsProcessed: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markEmailAsProcessed(input.emailId);
        return { success: true };
      }),
  }),

  // AI Suggestions
  aiSuggestions: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        if (input?.projectId) {
          return await aiSuggestionsDb.getAISuggestionsByProject(input.projectId);
        }
        return await aiSuggestionsDb.getPendingAISuggestions();
      }),

    pending: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await aiSuggestionsDb.getPendingAISuggestions(input?.projectId);
      }),

    critical: protectedProcedure.query(async () => {
      return await aiSuggestionsDb.getCriticalSuggestions();
    }),

    byType: protectedProcedure
      .input(z.object({ 
        type: z.enum(["risk_alert", "resource_optimization", "next_action", "budget_warning", "deadline_alert", "efficiency_tip"]),
        projectId: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await aiSuggestionsDb.getAISuggestionsByType(input.type, input.projectId);
      }),

    stats: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await aiSuggestionsDb.getAISuggestionStats(input?.projectId);
      }),

    analyze: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const tasks = await db.getTasksByProject(input.projectId);
        const orders = await db.getOrdersByProject(input.projectId);
        const budgets = await db.getBudgetsByProject(input.projectId);
        const emails = await db.getEmailsByProject(input.projectId);

        // Risk analysis
        const riskAnalysis = await aiAnalysisService.analyzeProjectRisk(project, tasks, orders, budgets);
        
        if (riskAnalysis.riskLevel === "high" || riskAnalysis.riskLevel === "critical") {
          await aiSuggestionsDb.createAISuggestion({
            projectId: input.projectId,
            type: "risk_alert",
            priority: riskAnalysis.riskLevel === "critical" ? "critical" : "high",
            title: `Alerta de Risco: ${riskAnalysis.riskLevel === "critical" ? "Crítico" : "Alto"}`,
            description: riskAnalysis.riskFactors.join("; "),
            reasoning: `Análise identificou nível de risco ${riskAnalysis.riskLevel}`,
            suggestedAction: riskAnalysis.recommendations.join("; "),
            impact: "high",
            confidence: riskAnalysis.confidence.toString(),
            status: "pending",
          });
        }

        // Resource optimization
        const resourceOptimizations = await aiAnalysisService.generateResourceOptimization(project, tasks, orders);
        for (const opt of resourceOptimizations) {
          await aiSuggestionsDb.createAISuggestion({
            projectId: input.projectId,
            type: "resource_optimization",
            priority: opt.impact === "high" ? "high" : "medium",
            title: opt.title,
            description: opt.description,
            reasoning: opt.reasoning,
            suggestedAction: opt.suggestedAction,
            impact: opt.impact,
            confidence: opt.confidence.toString(),
            status: "pending",
          });
        }

        // Next actions
        const nextActions = await aiAnalysisService.generateNextActions(project, tasks, orders, emails);
        for (const action of nextActions) {
          await aiSuggestionsDb.createAISuggestion({
            projectId: input.projectId,
            type: "next_action",
            priority: action.priority,
            title: action.title,
            description: action.description,
            reasoning: action.reasoning,
            suggestedAction: action.suggestedAction,
            impact: "medium",
            confidence: action.confidence.toString(),
            status: "pending",
          });
        }

        return { success: true, message: "Análise concluída" };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        status: z.enum(["pending", "accepted", "rejected", "completed"])
      }))
      .mutation(async ({ input, ctx }) => {
        await aiSuggestionsDb.updateAISuggestionStatus(input.id, input.status, ctx.user.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await aiSuggestionsDb.deleteAISuggestion(input.id);
        return { success: true };
      }),
  }),

  // Reports
  reports: router({
    project: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }

        const tasks = await db.getTasksByProject(input.projectId);
        const orders = await db.getOrdersByProject(input.projectId);
        const budgets = await db.getBudgetsByProject(input.projectId);

        return reportService.generateProjectReport(project, tasks, orders, budgets);
      }),

    comparison: protectedProcedure.query(async () => {
      const projects = await db.getAllProjects();
      const tasksMap = new Map();
      const budgetsMap = new Map();

      for (const project of projects) {
        const tasks = await db.getTasksByProject(project.id);
        const budgets = await db.getBudgetsByProject(project.id);
        tasksMap.set(project.id, tasks);
        budgetsMap.set(project.id, budgets);
      }

      return reportService.generateComparisonReport(projects, tasksMap, budgetsMap);
    }),

    executive: protectedProcedure.query(async () => {
      const projects = await db.getAllProjects();
      const tasksMap = new Map();
      const budgetsMap = new Map();

      for (const project of projects) {
        const tasks = await db.getTasksByProject(project.id);
        const budgets = await db.getBudgetsByProject(project.id);
        tasksMap.set(project.id, tasks);
        budgetsMap.set(project.id, budgets);
      }

      return reportService.generateExecutiveSummary(projects, tasksMap, budgetsMap);
    }),

    exportExcel: protectedProcedure
      .input(
        z.object({
          type: z.enum(["project", "comparison"]),
          projectId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        let buffer: Buffer;
        let filename: string;

        if (input.type === "project" && input.projectId) {
          const project = await db.getProjectById(input.projectId);
          if (!project) {
            throw new Error("Project not found");
          }

          const tasks = await db.getTasksByProject(input.projectId);
          const orders = await db.getOrdersByProject(input.projectId);
          const budgets = await db.getBudgetsByProject(input.projectId);

          const report = reportService.generateProjectReport(project, tasks, orders, budgets);
          buffer = await exportService.exportProjectToExcel(report);
          filename = exportService.generateFilename("project", project.name) + ".xlsx";
        } else if (input.type === "comparison") {
          const projects = await db.getAllProjects();
          const tasksMap = new Map();
          const budgetsMap = new Map();

          for (const project of projects) {
            const tasks = await db.getTasksByProject(project.id);
            const budgets = await db.getBudgetsByProject(project.id);
            tasksMap.set(project.id, tasks);
            budgetsMap.set(project.id, budgets);
          }

          const report = reportService.generateComparisonReport(projects, tasksMap, budgetsMap);
          buffer = await exportService.exportComparisonToExcel(report);
          filename = exportService.generateFilename("comparison") + ".xlsx";
        } else {
          throw new Error("Invalid export type");
        }

        // Return base64 encoded buffer
        return {
          data: buffer.toString("base64"),
          filename,
        };
      }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return await notificationDb.getNotificationsByUser(
          ctx.user.id,
          input?.unreadOnly || false
        );
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await notificationDb.getUnreadCount(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await notificationDb.markAsRead(input.id, ctx.user.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await notificationDb.markAllAsRead(ctx.user.id);
      return { success: true };
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await notificationDb.deleteNotification(input.id, ctx.user.id);
        return { success: true };
      }),

    runChecks: protectedProcedure.mutation(async ({ ctx }) => {
      await runNotificationChecks(ctx.user.id);
      return { success: true };
    }),

    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      return await notificationDb.getUserPreferences(ctx.user.id);
    }),

    updatePreferences: protectedProcedure
      .input(
        z.object({
          aiAlerts: z.number().optional(),
          deadlineWarnings: z.number().optional(),
          budgetAlerts: z.number().optional(),
          projectDelays: z.number().optional(),
          taskOverdue: z.number().optional(),
          orderPending: z.number().optional(),
          systemNotifications: z.number().optional(),
          deadlineWarningDays: z.number().optional(),
          budgetThreshold: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await notificationDb.updateUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Predictive Analysis
  predictions: router({
    analyzeProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");

        // Gather project context
        const tasks: any[] = []; // TODO: implement getProjectTasks
        const orders: any[] = []; // TODO: implement getProjectOrders
        const budget: any = null; // TODO: implement getProjectBudget

        const totalBudget = budget ? parseFloat(budget.totalBudget.toString()) : 100000;
        const usedBudget = budget ? parseFloat(budget.usedBudget.toString()) : project.progress ? (totalBudget * project.progress / 100) : 0;

        const now = new Date();
        const startDate = project.startDate ? new Date(project.startDate) : now;
        const endDate = project.endDate ? new Date(project.endDate) : now;
        const daysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        const context: predictiveAnalysisService.ProjectAnalysisContext = {
          project,
          currentProgress: project.progress || 0,
          daysElapsed,
          daysRemaining,
          budgetUsed: usedBudget,
          budgetRemaining: totalBudget - usedBudget,
          tasksCompleted: tasks.filter((t: any) => t.status === "completed").length,
          tasksTotal: tasks.length,
          ordersCompleted: orders.filter((o: any) => o.status === "delivered").length,
          ordersTotal: orders.length,
          averageTaskCompletionTime: 5,
        };

        // Run predictions
        const delayPrediction = await predictiveAnalysisService.predictProjectDelay(context);
        const costPrediction = await predictiveAnalysisService.predictFinalCost(context);
        const riskAnalysis = await predictiveAnalysisService.analyzeProjectRisks(context);

        // Save predictions to database
        await predictionsDb.createPrediction({
          projectId: input.projectId,
          predictionType: "delay",
          predictedDelayDays: delayPrediction.predictedDelayDays,
          delayProbability: delayPrediction.delayProbability,
          predictedCompletionDate: delayPrediction.predictedCompletionDate,
          riskLevel: delayPrediction.riskLevel,
          riskFactors: JSON.stringify(delayPrediction.riskFactors),
          confidence: delayPrediction.confidence,
          recommendations: JSON.stringify(delayPrediction.recommendations),
          analysisDate: now,
        });

        await predictionsDb.createPrediction({
          projectId: input.projectId,
          predictionType: "cost",
          predictedFinalCost: costPrediction.predictedFinalCost.toString(),
          costOverrunProbability: costPrediction.costOverrunProbability,
          estimatedCostVariance: costPrediction.estimatedCostVariance.toString(),
          riskLevel: costPrediction.riskLevel,
          riskFactors: JSON.stringify(costPrediction.riskFactors),
          confidence: costPrediction.confidence,
          recommendations: JSON.stringify(costPrediction.recommendations),
          analysisDate: now,
        });

        await predictionsDb.createPrediction({
          projectId: input.projectId,
          predictionType: "risk",
          riskLevel: riskAnalysis.overallRiskLevel,
          riskFactors: JSON.stringify(riskAnalysis.criticalRisks),
          confidence: riskAnalysis.confidence,
          recommendations: JSON.stringify(riskAnalysis.mitigationStrategies),
          analysisDate: now,
        });

        return {
          delay: delayPrediction,
          cost: costPrediction,
          risk: riskAnalysis,
        };
      }),

    getProjectPredictions: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const predictions = await predictionsDb.getProjectPredictions(input.projectId);
        return predictions.map(p => ({
          ...p,
          riskFactors: p.riskFactors ? JSON.parse(p.riskFactors) : [],
          recommendations: p.recommendations ? JSON.parse(p.recommendations) : [],
          suggestedActions: p.suggestedActions ? JSON.parse(p.suggestedActions) : [],
        }));
      }),

    getCriticalPredictions: protectedProcedure.query(async () => {
      const predictions = await predictionsDb.getCriticalPredictions();
      return predictions.map(p => ({
        ...p,
        riskFactors: p.riskFactors ? JSON.parse(p.riskFactors) : [],
        recommendations: p.recommendations ? JSON.parse(p.recommendations) : [],
      }));
    }),
  }),

  // What-If Simulation
  whatIf: router({
    simulate: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          scenarioName: z.string(),
          description: z.string().optional(),
          budgetAdjustment: z.number().optional(),
          budgetPercentage: z.number().optional(),
          teamSizeAdjustment: z.number().optional(),
          timelineAdjustment: z.number().optional(),
          saveScenario: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");

        // Build context
        const startDate = project.startDate ? new Date(project.startDate) : new Date();
        const endDate = project.endDate ? new Date(project.endDate) : new Date();
        const currentDuration = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

        const context: whatIfSimulationService.ProjectContext = {
          project,
          currentBudget: 100000, // TODO: get from budget table
          currentTeamSize: 5, // TODO: get from team table
          currentDuration,
          currentProgress: project.progress || 0,
          tasksCount: 0, // TODO: get from tasks
          ordersCount: 0, // TODO: get from orders
        };

        const parameters: whatIfSimulationService.ScenarioParameters = {
          budgetAdjustment: input.budgetAdjustment,
          budgetPercentage: input.budgetPercentage,
          teamSizeAdjustment: input.teamSizeAdjustment,
          timelineAdjustment: input.timelineAdjustment,
        };

        // Use enhanced simulation with predictive analysis
        const impact = await whatIfSimulationService.simulateScenarioWithPrediction(context, parameters);

        // Save scenario if requested
        if (input.saveScenario) {
          await whatIfDb.createScenario({
            projectId: input.projectId,
            scenarioName: input.scenarioName,
            description: input.description,
            budgetAdjustment: input.budgetAdjustment?.toString(),
            budgetPercentage: input.budgetPercentage,
            teamSizeAdjustment: input.teamSizeAdjustment,
            timelineAdjustment: input.timelineAdjustment,
            predictedDuration: impact.predictedDuration,
            predictedCost: impact.predictedCost.toString(),
            predictedDelayDays: impact.predictedDelayDays,
            costVariance: impact.costVariance.toString(),
            feasibilityScore: impact.feasibilityScore,
            riskLevel: impact.riskLevel,
            impactSummary: impact.impactSummary,
            recommendations: JSON.stringify(impact.recommendations),
            tradeoffs: JSON.stringify(impact.tradeoffs),
            // Add predictive analysis fields
            successProbability: impact.successProbability,
            criticalFactors: JSON.stringify(impact.criticalFactors),
            riskFactors: JSON.stringify(impact.riskFactors),
            mitigationStrategies: JSON.stringify(impact.mitigationStrategies),
            confidenceLevel: impact.confidenceLevel,
          });
        }

        return impact;
      }),

    getScenarios: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const scenarios = await whatIfDb.getProjectScenarios(input.projectId);
        return scenarios.map(s => ({
          ...s,
          recommendations: s.recommendations ? JSON.parse(s.recommendations) : [],
          tradeoffs: s.tradeoffs ? JSON.parse(s.tradeoffs) : [],
          criticalFactors: s.criticalFactors ? JSON.parse(s.criticalFactors) : [],
          riskFactors: s.riskFactors ? JSON.parse(s.riskFactors) : [],
          mitigationStrategies: s.mitigationStrategies ? JSON.parse(s.mitigationStrategies) : [],
        }));
      }),

    toggleFavorite: protectedProcedure
      .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
      .mutation(async ({ input }) => {
        await whatIfDb.toggleFavorite(input.id, input.isFavorite);
        return { success: true };
      }),

    deleteScenario: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await whatIfDb.deleteScenario(input.id);
        return { success: true };
      }),

    compare: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          scenarios: z.array(
            z.object({
              name: z.string(),
              budgetAdjustment: z.number().optional(),
              budgetPercentage: z.number().optional(),
              teamSizeAdjustment: z.number().optional(),
              timelineAdjustment: z.number().optional(),
            })
          ),
        })
      )
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new Error("Project not found");

        const startDate = project.startDate ? new Date(project.startDate) : new Date();
        const endDate = project.endDate ? new Date(project.endDate) : new Date();
        const currentDuration = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

        const context: whatIfSimulationService.ProjectContext = {
          project,
          currentBudget: 100000,
          currentTeamSize: 5,
          currentDuration,
          currentProgress: project.progress || 0,
          tasksCount: 0,
          ordersCount: 0,
        };

        return await whatIfSimulationService.compareScenarios(
          context,
          input.scenarios.map(s => ({
            name: s.name,
            parameters: {
              budgetAdjustment: s.budgetAdjustment,
              budgetPercentage: s.budgetPercentage,
              teamSizeAdjustment: s.teamSizeAdjustment,
              timelineAdjustment: s.timelineAdjustment,
            },
          }))
        );
      }),
  }),

  // Scenario Sharing
  scenarioSharing: router({
    shareScenario: protectedProcedure
      .input(
        z.object({
          scenarioId: z.number(),
          sharedWith: z.number(),
          permission: z.enum(["view", "edit", "admin"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await scenarioSharingService.shareScenario(
          input.scenarioId,
          ctx.user.id,
          input.sharedWith,
          input.permission
        );
      }),

    unshareScenario: protectedProcedure
      .input(
        z.object({
          scenarioId: z.number(),
          sharedWith: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return await scenarioSharingService.unshareScenario(
          input.scenarioId,
          input.sharedWith
        );
      }),

    getScenarioShares: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input }) => {
        return await scenarioSharingService.getScenarioShares(input.scenarioId);
      }),

    getScenariosSharedWithMe: protectedProcedure
      .query(async ({ ctx }) => {
        return await scenarioSharingService.getScenariosSharedWithUser(ctx.user.id);
      }),

    checkAccess: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await scenarioSharingService.checkScenarioAccess(
          input.scenarioId,
          ctx.user.id
        );
      }),

    addComment: protectedProcedure
      .input(
        z.object({
          scenarioId: z.number(),
          comment: z.string(),
          parentCommentId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await scenarioSharingService.addScenarioComment(
          input.scenarioId,
          ctx.user.id,
          input.comment,
          input.parentCommentId
        );
      }),

    getComments: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .query(async ({ input }) => {
        return await scenarioSharingService.getScenarioComments(input.scenarioId);
      }),

    getCommentReplies: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .query(async ({ input }) => {
        return await scenarioSharingService.getCommentReplies(input.commentId);
      }),

    getCommentThread: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .query(async ({ input }) => {
        return await scenarioSharingService.getCommentThread(input.commentId);
      }),

    deleteComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await scenarioSharingService.deleteScenarioComment(
          input.commentId,
          ctx.user.id
        );
      }),

    getTeamMembers: protectedProcedure
      .query(async () => {
        return await scenarioSharingService.getTeamMembers();
      }),
  }),

  // Activity Feed
  activityFeed: router({
    getActivities: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
          activityTypes: z.array(z.enum([
            "scenario_created",
            "scenario_updated",
            "scenario_shared",
            "scenario_commented",
            "scenario_favorited",
            "scenario_deleted"
          ])).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        return await activityFeedService.getUserActivities(
          ctx.user.id,
          input.limit,
          input.offset,
          input.activityTypes
        );
      }),

    getUnreadCount: protectedProcedure
      .input(z.object({ since: z.date().optional() }))
      .query(async ({ input, ctx }) => {
        return await activityFeedService.getUnreadActivityCount(
          ctx.user.id,
          input.since
        );
      }),

    markAsRead: protectedProcedure
      .input(z.object({ beforeDate: z.date() }))
      .mutation(async ({ input, ctx }) => {
        await activityFeedService.markActivitiesAsRead(
          ctx.user.id,
          input.beforeDate
        );
        return { success: true };
      }),
  }),

  // Mentions
  mentions: router({
    searchUsers: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        const allUsers = await db.getAllUsers();
        return mentionService.searchUsersForMention(allUsers, input.query);
      }),

    getMentionsForComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .query(async ({ input }) => {
        return await mentionDb.getMentionsForComment(input.commentId);
      }),

    getUserMentions: protectedProcedure
      .input(z.object({ 
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
        unreadOnly: z.boolean().optional().default(false),
      }))
      .query(async ({ input, ctx }) => {
        return await mentionDb.getUserMentions(
          ctx.user.id,
          input.limit,
          input.offset,
          input.unreadOnly
        );
      }),

    markMentionAsRead: protectedProcedure
      .input(z.object({ mentionId: z.number() }))
      .mutation(async ({ input }) => {
        await mentionDb.markMentionAsRead(input.mentionId);
        return { success: true };
      }),

    getUnreadMentionsCount: protectedProcedure
      .query(async ({ ctx }) => {
        return await mentionDb.getUnreadMentionsCount(ctx.user.id);
      }),

    markAllMentionsAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await mentionDb.markAllMentionsAsRead(ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
