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

  // Projects
  projects: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllProjects();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).default("planning"),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.string().optional(),
        clientName: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createProject({
          ...input,
          createdById: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        actualEndDate: z.date().optional(),
        progress: z.number().min(0).max(100).optional(),
        budget: z.string().optional(),
        actualCost: z.string().optional(),
        clientName: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

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
});

export type AppRouter = typeof appRouter;
