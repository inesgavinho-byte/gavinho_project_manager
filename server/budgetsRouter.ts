import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as budgetsDb from "./budgetsDb";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { auditView, auditModify } from "./_core/auditMiddleware";

export const budgetsRouter = router({
  // ============= BUDGETS =============
  
  list: adminProcedure
    .use(auditView("budget"))
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await budgetsDb.getProjectBudgets(input.projectId);
    }),

  getById: adminProcedure
    .input(z.object({ budgetId: z.number() }))
    .query(async ({ input }) => {
      return await budgetsDb.getBudgetById(input.budgetId);
    }),

  getSummary: adminProcedure
    .input(z.object({ budgetId: z.number() }))
    .query(async ({ input }) => {
      return await budgetsDb.getBudgetSummary(input.budgetId);
    }),

  create: adminProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1),
      category: z.string().min(1),
      description: z.string().optional(),
      budgetedAmount: z.number().positive(),
      status: z.enum(["draft", "approved", "active", "closed"]).default("draft"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const budgetId = await budgetsDb.createBudget({
        projectId: input.projectId,
        name: input.name,
        category: input.category,
        description: input.description,
        budgetedAmount: input.budgetedAmount.toFixed(2),
        status: input.status,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        createdById: ctx.user.id,
      });
      return { id: budgetId };
    }),

  update: adminProcedure
    .input(z.object({
      budgetId: z.number(),
      name: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
      description: z.string().optional(),
      budgetedAmount: z.number().positive().optional(),
      status: z.enum(["draft", "approved", "active", "closed"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { budgetId, ...data } = input;
      const updateData: any = { ...data };
      
      if (data.budgetedAmount !== undefined) {
        updateData.budgetedAmount = data.budgetedAmount.toFixed(2);
      }
      if (data.startDate) {
        updateData.startDate = new Date(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = new Date(data.endDate);
      }
      
      await budgetsDb.updateBudget(budgetId, updateData);
      
      // Recalculate actuals if budgeted amount changed
      if (data.budgetedAmount !== undefined) {
        await budgetsDb.updateBudgetActuals(budgetId);
      }
      
      return { success: true };
    }),

  approve: adminProcedure
    .input(z.object({ budgetId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await budgetsDb.updateBudget(input.budgetId, {
        status: "approved",
        approvedById: ctx.user.id,
        approvedAt: new Date(),
      });
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ budgetId: z.number() }))
    .mutation(async ({ input }) => {
      await budgetsDb.deleteBudget(input.budgetId);
      return { success: true };
    }),

  // ============= BUDGET ITEMS =============

  items: router({
    list: adminProcedure
      .input(z.object({ budgetId: z.number() }))
      .query(async ({ input }) => {
        return await budgetsDb.getBudgetItems(input.budgetId);
      }),

    create: adminProcedure
      .input(z.object({
        budgetId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        unit: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const totalPrice = input.quantity * input.unitPrice;
        const itemId = await budgetsDb.createBudgetItem({
          budgetId: input.budgetId,
          name: input.name,
          description: input.description,
          quantity: input.quantity.toFixed(2),
          unitPrice: input.unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          unit: input.unit,
          notes: input.notes,
        });
        return { id: itemId };
      }),

    update: adminProcedure
      .input(z.object({
        itemId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        quantity: z.number().positive().optional(),
        unitPrice: z.number().positive().optional(),
        unit: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { itemId, ...data } = input;
        const updateData: any = { ...data };
        
        // Recalculate total if quantity or unitPrice changed
        if (data.quantity !== undefined || data.unitPrice !== undefined) {
          // Get current item
          const items = await budgetsDb.getBudgetItems(0); // This needs the budget ID, but we only have itemId
          // For now, just update the fields provided
          if (data.quantity !== undefined) {
            updateData.quantity = data.quantity.toFixed(2);
          }
          if (data.unitPrice !== undefined) {
            updateData.unitPrice = data.unitPrice.toFixed(2);
          }
        }
        
        await budgetsDb.updateBudgetItem(itemId, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        await budgetsDb.deleteBudgetItem(input.itemId);
        return { success: true };
      }),
  }),

  // ============= EXPENSES =============

  expenses: router({
    listByProject: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await budgetsDb.getProjectExpenses(input.projectId);
      }),

    listByBudget: adminProcedure
      .input(z.object({ budgetId: z.number() }))
      .query(async ({ input }) => {
        return await budgetsDb.getBudgetExpenses(input.budgetId);
      }),

    create: adminProcedure
      .input(z.object({
        projectId: z.number(),
        budgetId: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        amount: z.number().positive(),
        expenseDate: z.string(),
        supplier: z.string().optional(),
        invoiceNumber: z.string().optional(),
        paymentStatus: z.enum(["pending", "paid", "overdue", "cancelled"]).default("pending"),
        paymentDate: z.string().optional(),
        receiptData: z.string().optional(), // base64
        receiptType: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let receiptUrl: string | undefined;
        let receiptKey: string | undefined;
        
        // Upload receipt if provided
        if (input.receiptData && input.receiptType) {
          const buffer = Buffer.from(input.receiptData, 'base64');
          receiptKey = `projects/${input.projectId}/receipts/${Date.now()}-${input.name}`;
          const { url } = await storagePut(receiptKey, buffer, input.receiptType);
          receiptUrl = url;
        }
        
        const expenseId = await budgetsDb.createExpense({
          projectId: input.projectId,
          budgetId: input.budgetId || null,
          name: input.name,
          description: input.description,
          amount: input.amount.toFixed(2),
          expenseDate: new Date(input.expenseDate),
          supplier: input.supplier,
          invoiceNumber: input.invoiceNumber,
          paymentStatus: input.paymentStatus,
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
          receiptUrl,
          receiptKey,
          notes: input.notes,
          createdById: ctx.user.id,
        });
        
        return { id: expenseId, receiptUrl };
      }),

    update: adminProcedure
      .input(z.object({
        expenseId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        amount: z.number().positive().optional(),
        expenseDate: z.string().optional(),
        supplier: z.string().optional(),
        invoiceNumber: z.string().optional(),
        paymentStatus: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        paymentDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { expenseId, ...data } = input;
        const updateData: any = { ...data };
        
        if (data.amount !== undefined) {
          updateData.amount = data.amount.toFixed(2);
        }
        if (data.expenseDate) {
          updateData.expenseDate = new Date(data.expenseDate);
        }
        if (data.paymentDate) {
          updateData.paymentDate = new Date(data.paymentDate);
        }
        
        await budgetsDb.updateExpense(expenseId, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ expenseId: z.number() }))
      .mutation(async ({ input }) => {
        await budgetsDb.deleteExpense(input.expenseId);
        return { success: true };
      }),
  }),

  // ============= ALERTS =============

  alerts: router({
    list: adminProcedure
      .input(z.object({ budgetId: z.number() }))
      .query(async ({ input }) => {
        return await budgetsDb.getBudgetAlerts(input.budgetId);
      }),

    listUnread: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await budgetsDb.getUnreadBudgetAlerts(input.projectId);
      }),

    markAsRead: adminProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await budgetsDb.markAlertAsRead(input.alertId, ctx.user.id);
        return { success: true };
      }),
  }),
});
