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
import { hrRouter } from "./hrRouter";
import { siteManagementRouter } from "./siteManagementRouter";
import { budgetsRouter } from "./budgetsRouter";
import { relationshipsRouter } from "./relationshipsRouter";
import { libraryRouter } from "./libraryRouter";
import { financialRouter } from "./financialRouter";
import { teamManagementRouter } from "./teamManagementRouter";
import { productivityRouter } from "./productivityRouter";
import { reportsRouter } from "./reportsRouter";
import { calendarRouter } from "./calendarRouter";
import { importRouter } from "./importContracts";
import * as contractAnalytics from "./contractAnalyticsService";
import { userManagementRouter } from "./userManagementRouter";
import { userProfileRouter } from "./userProfileRouter";
import * as supplierEvaluationsDb from "./supplierEvaluationsDb";
import * as approvalNotificationsService from "./approvalNotificationsService";
import * as automaticNotificationsService from "./automaticNotificationsService";
import * as supplierTrendService from "./supplierTrendService";
import * as userNotificationPreferencesDb from "./userNotificationPreferencesDb";

export const appRouter = router({
  system: systemRouter,
  
  // Approval Notifications
  approvalNotifications: router({
    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return await approvalNotificationsService.getUnreadNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number().int() }))
      .mutation(async ({ input }) => {
        return await approvalNotificationsService.markNotificationAsRead(input.notificationId);
      }),

    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await approvalNotificationsService.markAllNotificationsAsRead(ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ notificationId: z.number().int() }))
      .mutation(async ({ input }) => {
        return await approvalNotificationsService.deleteNotification(input.notificationId);
      }),

    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        return await approvalNotificationsService.getNotificationStats(ctx.user.id);
      }),

    notifySupplierEvaluation: protectedProcedure
      .input(z.object({
        supplierId: z.number().int(),
        supplierName: z.string(),
        rating: z.number().min(1).max(5),
      }))
      .mutation(async ({ input, ctx }) => {
        return await approvalNotificationsService.notifySupplierEvaluation(
          input.supplierId,
          input.supplierName,
          input.rating,
          ctx.user.name || "Sistema"
        );
      }),

    notifyProjectStatusChange: protectedProcedure
      .input(z.object({
        projectId: z.number().int(),
        projectName: z.string(),
        oldStatus: z.string(),
        newStatus: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await approvalNotificationsService.notifyProjectStatusChange(
          input.projectId,
          input.projectName,
          input.oldStatus,
          input.newStatus,
          ctx.user.name || "Sistema"
        );
      }),

    notifyProjectCompletion: protectedProcedure
      .input(z.object({
        projectId: z.number().int(),
        projectName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await approvalNotificationsService.notifyProjectCompletion(
          input.projectId,
          input.projectName,
          ctx.user.name || "Sistema"
        );
      }),
  }),

  // Automatic Notifications - Integração com fluxos existentes
  automaticNotifications: router({
    getQueueStats: protectedProcedure.query(async () => {
      return automaticNotificationsService.getQueueStats();
    }),

    processQueue: protectedProcedure.mutation(async () => {
      await automaticNotificationsService.processManually();
      return { success: true };
    }),
  }),

  // User Notification Preferences
  notificationPreferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await userNotificationPreferencesDb.getUserNotificationPreferences(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        enabledSupplierEvaluated: z.boolean().optional(),
        enabledProjectStatusChanged: z.boolean().optional(),
        enabledProjectCompleted: z.boolean().optional(),
        enabledDeadlineAlert: z.boolean().optional(),
        enabledBudgetAlert: z.boolean().optional(),
        enabledOrderUpdate: z.boolean().optional(),
        enabledTaskAssigned: z.boolean().optional(),
        frequency: z.enum(["immediate", "daily", "weekly"]).optional(),
        enableEmailNotifications: z.boolean().optional(),
        enablePushNotifications: z.boolean().optional(),
        enableInAppNotifications: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await userNotificationPreferencesDb.updateUserNotificationPreferences(ctx.user.id, input);
      }),

    toggleNotificationType: protectedProcedure
      .input(z.object({
        notificationType: z.string(),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await userNotificationPreferencesDb.toggleNotificationType(
          ctx.user.id,
          input.notificationType,
          input.enabled
        );
      }),

    setFrequency: protectedProcedure
      .input(z.object({
        frequency: z.enum(["immediate", "daily", "weekly"]),
      }))
      .mutation(async ({ input, ctx }) => {
        return await userNotificationPreferencesDb.setNotificationFrequency(ctx.user.id, input.frequency);
      }),

    toggleChannel: protectedProcedure
      .input(z.object({
        channel: z.enum(["email", "push", "inApp"]),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await userNotificationPreferencesDb.toggleNotificationChannel(
          ctx.user.id,
          input.channel,
          input.enabled
        );
      }),

    reset: protectedProcedure.mutation(async ({ ctx }) => {
      return await userNotificationPreferencesDb.resetNotificationPreferences(ctx.user.id);
    }),
  }),
  
  // User Management - Admin only
  userManagement: userManagementRouter,
  
  // User Profile - Personal settings and preferences
  userProfile: userProfileRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, { name: input.name });
        return { success: true };
      }),
  }),

  // Projects - Full router with phases, milestones, team, documents, gallery
  projects: projectsRouter,

  // Budgets - Budget management, expenses, alerts (Admin Only)
  budgets: budgetsRouter,
  relationships: relationshipsRouter,

  // Deliveries - Central de Entregas
  deliveries: deliveriesRouter,

  // Constructions - Obras (GB) e MQT
  constructions: constructionsRouter,

  // ArchViz - Visualizações 3D / Renders
  archviz: archvizRouter,

  // HR - Recursos Humanos
  hr: hrRouter,
  siteManagement: siteManagementRouter,

  // Library - Biblioteca de Materiais, Modelos 3D e Inspiração
  library: libraryRouter,

  // Financial - Dashboard de KPIs Financeiros
  financial: financialRouter,

  // Team Management - Gestão de Equipa, Tracking de Horas e Disponibilidade
  teamManagement: teamManagementRouter,

  // Productivity - Dashboard de Produtividade da Equipa
  productivity: productivityRouter,

  // Custom Reports - Builder de Relatórios Personalizáveis
  customReports: reportsRouter,

  // Calendar - Sistema de Calendário e Eventos
  calendar: calendarRouter,

  // Import - Importação de Dados
  import: importRouter,

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
    
    // Associate projects with supplier
    associateProjects: protectedProcedure
      .input(z.object({
        supplierId: z.number(),
        projectIds: z.array(z.number()),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.associateSupplierProjects(input.supplierId, input.projectIds, input.category);
        return { success: true };
      }),
    
    getProjects: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSupplierProjects(input.supplierId);
      }),

    createEvaluation: protectedProcedure
      .input(z.object({
        supplierId: z.number().int().positive(),
        rating: z.number().min(1).max(5),
        quality: z.number().min(1).max(5).optional(),
        timeliness: z.number().min(1).max(5).optional(),
        communication: z.number().min(1).max(5).optional(),
        comments: z.string().optional(),
        projectId: z.number().int().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await supplierEvaluationsDb.createSupplierEvaluation({
          ...input,
          evaluatedBy: ctx.user.id,
        });
      }),

    getEvaluations: protectedProcedure
      .input(z.object({
        period: z.enum(["7d", "30d", "90d", "all"]).optional(),
        supplierId: z.number().int().optional(),
      }))
      .query(async ({ input }) => {
        return await supplierEvaluationsDb.getSupplierEvaluations(input);
      }),

    getEvaluationStats: protectedProcedure
      .input(z.object({ supplierId: z.number().int() }))
      .query(async ({ input }) => {
        return await supplierEvaluationsDb.getSupplierEvaluationStats(input.supplierId);
      }),

    getEvaluationHistory: protectedProcedure
      .input(z.object({ supplierId: z.number().int(), limit: z.number().int().optional() }))
      .query(async ({ input }) => {
        return await supplierEvaluationsDb.getSupplierEvaluationHistory(input.supplierId, input.limit);
      }),

    getTrendData: protectedProcedure
      .input(z.object({
        supplierId: z.number().int(),
        period: z.enum(["30d", "90d", "1y", "all"]).optional().default("90d"),
      }))
      .query(async ({ input }) => {
        return await supplierTrendService.getSupplierTrendData(input.supplierId, input.period as any);
      }),

    getComparisonTrendData: protectedProcedure
      .input(z.object({
        supplierIds: z.array(z.number().int()),
        period: z.enum(["30d", "90d", "1y", "all"]).optional().default("90d"),
      }))
      .query(async ({ input }) => {
        return await supplierTrendService.getComparisonTrendData(input.supplierIds, input.period as any);
      }),

    getTrendStats: protectedProcedure
      .input(z.object({ supplierId: z.number().int() }))
      .query(async ({ input }) => {
        return await supplierTrendService.getSupplierTrendStats(input.supplierId);
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
    create: protectedProcedure
      .input(z.object({
        userId: z.number(),
        type: z.string(),
        title: z.string(),
        message: z.string(),
        priority: z.string().optional(),
        projectId: z.number().optional(),
        link: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await notificationDb.createNotification(input);
        return result;
      }),

    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return await notificationDb.getNotificationsByUser(ctx.user.id, true);
    }),

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
      .input(z.object({ id: z.number().optional(), notificationId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const notifId = input.id || input.notificationId;
        if (!notifId) throw new Error("Notification ID is required");
        await notificationDb.markAsRead(notifId, ctx.user.id);
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

    // Run automatic notification checks
    runAutoChecks: protectedProcedure.mutation(async () => {
      const { runAutoNotifications } = await import("./autoNotificationService");
      const result = await runAutoNotifications();
      return result;
    }),

    // Generate test notifications for a project
    generateTest: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { generateTestNotifications } = await import("./autoNotificationService");
        await generateTestNotifications(input.projectId, ctx.user.id);
        return { success: true };
      }),

    // Notification History with Filters
    getHistory: protectedProcedure
      .input(
        z.object({
          type: z.array(z.string()).optional(),
          priority: z.array(z.string()).optional(),
          projectId: z.number().optional(),
          isRead: z.boolean().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        const { getFilteredNotifications } = await import("./notificationHistoryService");
        return await getFilteredNotifications(ctx.user.id, input);
      }),

    getStats: protectedProcedure
      .input(
        z.object({
          type: z.array(z.string()).optional(),
          priority: z.array(z.string()).optional(),
          projectId: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const { getNotificationStats } = await import("./notificationHistoryService");
        return await getNotificationStats(ctx.user.id, input);
      }),

    exportCSV: protectedProcedure
      .input(
        z.object({
          type: z.array(z.string()).optional(),
          priority: z.array(z.string()).optional(),
          projectId: z.number().optional(),
          isRead: z.boolean().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const { exportNotificationsToCSV } = await import("./notificationHistoryService");
        return await exportNotificationsToCSV(ctx.user.id, input);
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

  // Contract Analytics
  contractAnalytics: router({
    getStats: protectedProcedure.query(async () => {
      return await contractAnalytics.getContractStats();
    }),

    getByType: protectedProcedure.query(async () => {
      return await contractAnalytics.getContractsByType();
    }),

    getTimeline: protectedProcedure.query(async () => {
      return await contractAnalytics.getContractTimeline();
    }),

    getByLocation: protectedProcedure.query(async () => {
      return await contractAnalytics.getContractsByLocation();
    }),

    getFiltered: protectedProcedure
      .input(
        z.object({
          year: z.number().optional(),
          status: z.enum(["active", "expired", "expiring_soon", "all"]).optional(),
          type: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await contractAnalytics.getFilteredContracts(input);
      }),
  }),
  emailHistory: router({
    getHistory: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          status: z.string().optional(),
          eventType: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          recipientEmail: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        return await emailHistoryService.getEmailHistory(input.projectId, input);
      }),
    getAlerts: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        return await emailHistoryService.getUnreadAlerts(input.projectId);
      }),
    markAlertAsRead: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        await emailHistoryService.markAlertAsRead(input.alertId);
        return { success: true };
      }),
    getInsights: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        return await emailHistoryService.getAIInsights(input.projectId);
      }),
    analyzeProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        await emailHistoryService.analyzeEmailHistory(input.projectId);
        await emailHistoryService.detectAnomaliesWithAI(input.projectId);
        return { success: true };
      }),
    getTrendChartData: protectedProcedure
      .input(z.object({ projectId: z.number(), days: z.number().default(30) }))
      .query(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        return await emailHistoryService.getTrendChartData(input.projectId, input.days);
      }),
    getDomainComparison: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        return await emailHistoryService.getDomainComparisonData(input.projectId);
      }),
    getEventTypeComparison: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        return await emailHistoryService.getEventTypeComparisonData(input.projectId);
      }),
    getTrendSummary: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const emailHistoryService = await import('./emailHistoryService');
        return await emailHistoryService.getTrendSummary(input.projectId);
      }),

    syncOutlookEmails: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const emailSyncService = await import('./emailSyncService');
        const syncedCount = await emailSyncService.syncOutlookEmails(input.projectId);
        await emailSyncService.updateEmailAnalytics(input.projectId);
        return { syncedCount, success: true };
      }),

    syncSendGridEvents: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const emailSyncService = await import('./emailSyncService');
        const syncedCount = await emailSyncService.syncSendGridEvents(input.projectId);
        await emailSyncService.updateEmailAnalytics(input.projectId);
        return { syncedCount, success: true };
      }),
    markAsRead: protectedProcedure
      .input(z.object({ emailIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const bulkService = await import('./emailBulkActionsService');
        const updated = await bulkService.markEmailsAsRead(input.emailIds);
        return { updated, success: true };
      }),
    resendBulk: protectedProcedure
      .input(z.object({ emailIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const bulkService = await import('./emailBulkActionsService');
        const result = await bulkService.resendEmails(input.emailIds);
        return { ...result, success: true };
      }),
    deleteBulk: protectedProcedure
      .input(z.object({ emailIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const bulkService = await import('./emailBulkActionsService');
        const deleted = await bulkService.deleteEmails(input.emailIds);
        return { deleted, success: true };
      }),
    exportBulkPDF: protectedProcedure
      .input(z.object({ emailIds: z.array(z.number()), projectName: z.string() }))
      .mutation(async ({ input }) => {
        const bulkService = await import('./emailBulkActionsService');
        const result = await bulkService.exportEmailsAsPDF(input.emailIds, input.projectName);
        return { ...result, success: !!result };
      }),
    tagBulk: protectedProcedure
      .input(z.object({ emailIds: z.array(z.number()), tag: z.string() }))
      .mutation(async ({ input }) => {
        const bulkService = await import('./emailBulkActionsService');
        const updated = await bulkService.tagEmails(input.emailIds, input.tag);
        return { updated, success: true };
      }),

    // Endpoints para busca em tempo real
    searchEmails: protectedProcedure
      .input(z.object({ projectId: z.number(), query: z.string(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        const { searchEmails } = await import('./emailSearchService');
        return await searchEmails(input.projectId, input.query, input.limit);
      }),

    getEmailSuggestions: protectedProcedure
      .input(z.object({ 
        projectId: z.number(), 
        query: z.string(), 
        type: z.enum(['recipient', 'sender', 'subject', 'domain']).default('recipient'),
        limit: z.number().default(10)
      }))
      .query(async ({ input }) => {
        const { getEmailSuggestions } = await import('./emailSearchService');
        return await getEmailSuggestions(input.projectId, input.query, input.type, input.limit);
      }),

    advancedSearch: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        filters: z.object({
          query: z.string().optional(),
          recipientEmail: z.string().optional(),
          senderEmail: z.string().optional(),
          domain: z.string().optional(),
          status: z.string().optional(),
          eventType: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }),
        limit: z.number().default(50)
      }))
      .query(async ({ input }) => {
        const { advancedEmailSearch } = await import('./emailSearchService');
        return await advancedEmailSearch(input.projectId, input.filters, input.limit);
      }),

    // Endpoints para scheduler de sincronização
    syncOutlookNow: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const { syncOutlookEmails } = await import('./emailSyncService');
        const synced = await syncOutlookEmails(input.projectId);
        return { synced, provider: 'outlook' };
      }),

    syncSendGridNow: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const { syncSendGridEvents } = await import('./emailSyncService');
        const synced = await syncSendGridEvents(input.projectId);
        return { synced, provider: 'sendgrid' };
      }),

    getSchedulerStatus: protectedProcedure.query(async () => {
      const { getSchedulerStatus } = await import('./emailSchedulerService');
      return getSchedulerStatus();
    }),

    // Endpoints para filtros avançados
    filterEmails: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          status: z.string().optional(),
          eventType: z.string().optional(),
          domain: z.string().optional(),
          sender: z.string().optional(),
          recipient: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          tags: z.array(z.string()).optional(),
          searchText: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        const { filterEmails } = await import('./emailFilterService');
        return filterEmails(input);
      }),

    getUniqueDomains: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getUniqueDomains } = await import('./emailFilterService');
        return getUniqueDomains(input.projectId);
      }),

    getUniqueSenders: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getUniqueSenders } = await import('./emailFilterService');
        return getUniqueSenders(input.projectId);
      }),

    getUniqueTags: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getUniqueTags } = await import('./emailFilterService');
        return getUniqueTags(input.projectId);
      }),

    countFilteredEmails: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          status: z.string().optional(),
          eventType: z.string().optional(),
          domain: z.string().optional(),
          sender: z.string().optional(),
          recipient: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          tags: z.array(z.string()).optional(),
          searchText: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const { countFilteredEmails } = await import('./emailFilterService');
        return countFilteredEmails(input);
      }),

    // Endpoints para alertas inteligentes
    detectAnomalies: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const { detectAnomaliesWithAI, saveDetectedAnomalies } = await import('./intelligentAlertsService');
        const anomalies = await detectAnomaliesWithAI(input.projectId);
        await saveDetectedAnomalies(input.projectId, anomalies);
        return { detected: anomalies.length, anomalies };
      }),

    getIntelligentAlerts: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getUnreadIntelligentAlerts } = await import('./intelligentAlertsService');
        return getUnreadIntelligentAlerts(input.projectId);
      }),

    markAlertAsResolved: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        const { markAlertAsResolved } = await import('./intelligentAlertsService');
        return markAlertAsResolved(input.alertId);
      }),
  }),

  // CRM Integration Endpoints
  crmContacts: router({
    getAllContacts: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ input }) => {
        const { getAllContacts } = await import('./crmIntegrationService');
        return getAllContacts(input.projectId, input.limit, input.offset);
      }),

    getContactById: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        const { getContactById } = await import('./crmIntegrationService');
        return getContactById(input.contactId);
      }),

    getContactCommunicationHistory: protectedProcedure
      .input(z.object({ contactId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getContactCommunicationHistory } = await import('./crmIntegrationService');
        return getContactCommunicationHistory(input.contactId, input.limit);
      }),

    createContact: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        email: z.string(),
        type: z.enum(['client', 'supplier', 'partner']),
        company: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createContact } = await import('./crmIntegrationService');
        return createContact(input);
      }),

    updateContact: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        company: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateContact } = await import('./crmIntegrationService');
        return updateContact(input.contactId, input);
      }),
  }),

  // Sentiment Analysis Endpoints
  sentimentAnalysis: router({
    analyzeSentiment: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const { analyzeSentimentForProject } = await import('./sentimentAnalysisService');
        return analyzeSentimentForProject(input.projectId);
      }),

    getContactSentiment: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        const { getContactSentimentAnalysis } = await import('./sentimentAnalysisService');
        return getContactSentimentAnalysis(input.contactId);
      }),

    getSentimentTrends: protectedProcedure
      .input(z.object({ projectId: z.number(), days: z.number().optional() }))
      .query(async ({ input }) => {
        const { getSentimentTrends } = await import('./sentimentAnalysisService');
        return getSentimentTrends(input.projectId, input.days);
      }),

    getNegativeSentimentAlerts: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getNegativeSentimentAlerts } = await import('./negativeSentimentAlertService');
        return getNegativeSentimentAlerts(input.projectId);
      }),

    checkNegativeSentimentPatterns: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const { checkAndCreateNegativeSentimentAlerts } = await import('./negativeSentimentAlertService');
        return checkAndCreateNegativeSentimentAlerts(input.projectId);
      }),

    markSentimentAlertAsResolved: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        const { markAlertAsResolved } = await import('./negativeSentimentAlertService');
        return markAlertAsResolved(input.alertId);
      }),
  }),

  // Scheduled Reports Endpoints
  recommendedActions: router({
    generateActions: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const { generateRecommendedActions } = await import('./recommendedActionsService');
        return generateRecommendedActions(input.projectId);
      }),

    getActionsForContact: protectedProcedure
      .input(z.object({ contactId: z.number() }))
      .query(async ({ input }) => {
        const { getRecommendedActionsForContact } = await import('./recommendedActionsService');
        return getRecommendedActionsForContact(input.contactId);
      }),

    getActionsByPriority: protectedProcedure
      .input(z.object({ projectId: z.number(), priority: z.enum(['high', 'medium', 'low']) }))
      .query(async ({ input }) => {
        const { getActionsByPriority } = await import('./recommendedActionsService');
        return getActionsByPriority(input.projectId, input.priority);
      }),

    getActionsByCategory: protectedProcedure
      .input(z.object({ projectId: z.number(), category: z.string() }))
      .query(async ({ input }) => {
        const { getActionsByCategory } = await import('./recommendedActionsService');
        return getActionsByCategory(input.projectId, input.category);
      }),
  }),

  emailReports: router({
    getScheduledReports: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const { getScheduledReports } = await import('./emailReportService');
        return getScheduledReports(input.projectId);
      }),

    createScheduledReport: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        recipientEmail: z.string(),
        includeCharts: z.boolean().optional(),
        includeAIInsights: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createScheduledReport } = await import('./emailReportService');
        return createScheduledReport(input);
      }),

    generateReport: protectedProcedure
      .input(z.object({ projectId: z.number(), days: z.number().optional() }))
      .mutation(async ({ input }) => {
        const { generateEmailReport } = await import('./emailReportService');
        return generateEmailReport(input.projectId, input.days);
      }),

    getReportLogs: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getReportLogs } = await import('./emailReportService');
        return getReportLogs(input.projectId, input.limit);
      }),

    deleteScheduledReport: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteScheduledReport } = await import('./emailReportService');
        return deleteScheduledReport(input.reportId);
      }),
  }),


  // Chat Colaborativo com IA
  chat: router({
    getTopics: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        const { getChatTopics } = await import('./chatDbService');
        return getChatTopics(input.projectId);
      }),

    createTopic: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        category: z.string().default('general'),
        createdBy: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { createChatTopic } = await import('./chatDbService');
        return createChatTopic(input);
      }),

    getMessages: protectedProcedure
      .input(z.object({ topicId: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getChatMessages } = await import('./chatDbService');
        return getChatMessages(input.topicId, input.limit);
      }),

    createMessage: protectedProcedure
      .input(z.object({
        topicId: z.string(),
        projectId: z.string(),
        userId: z.string(),
        userName: z.string(),
        content: z.string(),
        parentMessageId: z.string().optional(),
        mentionedUsers: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { createChatMessage } = await import('./chatDbService');
        return createChatMessage(input);
      }),

    getSuggestions: protectedProcedure
      .input(z.object({ projectId: z.string(), status: z.string().optional() }))
      .query(async ({ input }) => {
        const { getAISuggestions } = await import('./chatDbService');
        return getAISuggestions(input.projectId, input.status);
      }),

    approveSuggestion: protectedProcedure
      .input(z.object({ suggestionId: z.string(), approvedBy: z.string() }))
      .mutation(async ({ input }) => {
        const { approveSuggestion } = await import('./chatDbService');
        return approveSuggestion(input.suggestionId, input.approvedBy);
      }),

    rejectSuggestion: protectedProcedure
      .input(z.object({ suggestionId: z.string() }))
      .mutation(async ({ input }) => {
        const { rejectSuggestion } = await import('./chatDbService');
        return rejectSuggestion(input.suggestionId);
      }),
  }),


  // BIA - Assistente de Gestão de Projetos
  bia: router({
    generateMessage: protectedProcedure
      .input(z.object({
        projectName: z.string(),
        teamMember: z.string(),
        messageType: z.enum(['greeting', 'check-in', 'blocker-alert', 'celebration', 'support']),
        context: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateBiaMessage } = await import('./biaPersonalityService');
        return generateBiaMessage(
          {
            projectName: input.projectName,
            teamMember: input.teamMember,
            recentActivity: input.context,
          },
          input.messageType
        );
      }),

    analyzeContext: protectedProcedure
      .input(z.object({
        conversationText: z.string(),
        projectContext: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeBiaContext } = await import('./biaPersonalityService');
        return analyzeBiaContext(input.conversationText, input.projectContext);
      }),

    generateDailyReport: protectedProcedure
      .input(z.object({
        blockers: z.array(z.object({
          project: z.string(),
          blocker: z.string(),
          impact: z.string(),
          responsible: z.string(),
        })),
        warnings: z.array(z.string()),
        wins: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { generateDailyReport } = await import('./biaPersonalityService');
        return generateDailyReport(input.blockers, input.warnings, input.wins, new Date());
      }),

    generateProactiveSuggestion: protectedProcedure
      .input(z.object({
        teamMemberName: z.string(),
        projectName: z.string(),
        inactivityDays: z.number(),
        lastActivity: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { generateProactiveSuggestion } = await import('./biaPersonalityService');
        return generateProactiveSuggestion(
          input.teamMemberName,
          input.projectName,
          input.inactivityDays,
          input.lastActivity
        );
      }),
  }),


  // BIA Insights - Dashboard de Análise
  biaInsights: router({
    getInsights: protectedProcedure
      .query(async () => {
        const { generateBiaInsights } = await import('./biaInsightsService');
        return generateBiaInsights();
      }),

    getExecutiveSummary: protectedProcedure
      .query(async () => {
        const { generateExecutiveSummary } = await import('./biaInsightsService');
        return generateExecutiveSummary();
      }),

    approveSuggestion: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        suggestion: z.string(),
        approvedBy: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Simular aprovação de sugestão
        return {
          success: true,
          message: `Sugestão aprovada para ${input.projectId}`,
          approvedAt: new Date(),
        };
      }),

    rejectSuggestion: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        suggestion: z.string(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Simular rejeição de sugestão
        return {
          success: true,
          message: `Sugestão rejeitada para ${input.projectId}`,
          rejectedAt: new Date(),
        };
      }),
  }),

});

export type AppRouter = typeof appRouter;
