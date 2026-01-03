import { z } from "zod";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { budgets } from "../drizzle/schema";

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
        status: z.enum(["pending", "approved", "ordered", "in_transit", "delivered", "cancelled"]).default("pending"),
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
        status: z.enum(["pending", "approved", "ordered", "in_transit", "delivered", "cancelled"]).optional(),
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
        status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).default("todo"),
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
        status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).optional(),
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

  // Notifications
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().default(false) }))
      .query(async ({ input, ctx }) => {
        return await db.getNotificationsByUser(ctx.user.id, input.unreadOnly);
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
  }),

  // AI Suggestions
  aiSuggestions: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAISuggestionsByProject(input.projectId);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "accepted", "rejected", "completed"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, status } = input;
        await db.updateAISuggestion(id, {
          status,
          ...(status === "accepted" ? { acceptedById: ctx.user.id, acceptedAt: new Date() } : {}),
        });
        return { success: true };
      }),
  }),

  // Emails
  emails: router({
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmailsByProject(input.projectId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
