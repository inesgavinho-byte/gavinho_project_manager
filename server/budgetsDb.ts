import { getDb } from "./db";
import { 
  budgets, 
  budgetItems, 
  expenses, 
  budgetAlerts,
  type Budget,
  type InsertBudget,
  type BudgetItem,
  type InsertBudgetItem,
  type Expense,
  type InsertExpense,
  type BudgetAlert,
  type InsertBudgetAlert
} from "../drizzle/schema";
import { eq, desc, and, sql, sum, gte, lte } from "drizzle-orm";

// ============= BUDGETS =============

export async function getProjectBudgets(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(budgets)
    .where(eq(budgets.projectId, projectId))
    .orderBy(desc(budgets.createdAt));
}

export async function getBudgetById(budgetId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(budgets).where(eq(budgets.id, budgetId)).limit(1);
  return result[0] || null;
}

export async function createBudget(data: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgets).values(data);
  return result[0].insertId;
}

export async function updateBudget(budgetId: number, data: Partial<InsertBudget>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgets).set(data).where(eq(budgets.id, budgetId));
}

export async function deleteBudget(budgetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(budgets).where(eq(budgets.id, budgetId));
}

// ============= BUDGET ITEMS =============

export async function getBudgetItems(budgetId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budgetId))
    .orderBy(budgetItems.createdAt);
}

export async function createBudgetItem(data: InsertBudgetItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgetItems).values(data);
  return result[0].insertId;
}

export async function updateBudgetItem(itemId: number, data: Partial<InsertBudgetItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgetItems).set(data).where(eq(budgetItems.id, itemId));
}

export async function deleteBudgetItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(budgetItems).where(eq(budgetItems.id, itemId));
}

// ============= EXPENSES =============

export async function getProjectExpenses(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(expenses)
    .where(eq(expenses.projectId, projectId))
    .orderBy(desc(expenses.expenseDate));
}

export async function getBudgetExpenses(budgetId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(expenses)
    .where(eq(expenses.budgetId, budgetId))
    .orderBy(desc(expenses.expenseDate));
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(expenses).values(data);
  
  // Update budget actualAmount
  if (data.budgetId) {
    await updateBudgetActuals(data.budgetId);
  }
  
  return result[0].insertId;
}

export async function updateExpense(expenseId: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get old expense to update budget if needed
  const oldExpense = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  
  await db.update(expenses).set(data).where(eq(expenses.id, expenseId));
  
  // Update budget actuals for both old and new budget if changed
  if (oldExpense[0]?.budgetId) {
    await updateBudgetActuals(oldExpense[0].budgetId);
  }
  if (data.budgetId && data.budgetId !== oldExpense[0]?.budgetId) {
    await updateBudgetActuals(data.budgetId);
  }
}

export async function deleteExpense(expenseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get expense to update budget after deletion
  const expense = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  
  await db.delete(expenses).where(eq(expenses.id, expenseId));
  
  // Update budget actuals
  if (expense[0]?.budgetId) {
    await updateBudgetActuals(expense[0].budgetId);
  }
}

// ============= BUDGET ALERTS =============

export async function getBudgetAlerts(budgetId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(budgetAlerts)
    .where(eq(budgetAlerts.budgetId, budgetId))
    .orderBy(desc(budgetAlerts.createdAt));
}

export async function getUnreadBudgetAlerts(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all budgets for project
  const projectBudgets = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(eq(budgets.projectId, projectId));
  
  const budgetIds = projectBudgets.map(b => b.id);
  if (budgetIds.length === 0) return [];
  
  return await db
    .select()
    .from(budgetAlerts)
    .where(
      and(
        sql`${budgetAlerts.budgetId} IN (${sql.join(budgetIds.map(id => sql`${id}`), sql`, `)})`,
        eq(budgetAlerts.isRead, false)
      )
    )
    .orderBy(desc(budgetAlerts.createdAt));
}

export async function createBudgetAlert(data: InsertBudgetAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgetAlerts).values(data);
  return result[0].insertId;
}

export async function markAlertAsRead(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgetAlerts).set({
    isRead: true,
    readById: userId,
    readAt: new Date(),
  }).where(eq(budgetAlerts.id, alertId));
}

// ============= HELPER FUNCTIONS =============

export async function updateBudgetActuals(budgetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calculate total expenses for this budget
  const result = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`
    })
    .from(expenses)
    .where(eq(expenses.budgetId, budgetId));
  
  const actualAmount = parseFloat(result[0]?.total || "0");
  
  // Get budget to calculate variance
  const budget = await getBudgetById(budgetId);
  if (!budget) return;
  
  const budgetedAmount = parseFloat(budget.budgetedAmount);
  const variance = actualAmount - budgetedAmount;
  const variancePercent = budgetedAmount > 0 ? (variance / budgetedAmount) * 100 : 0;
  
  // Update budget
  await db.update(budgets).set({
    actualAmount: actualAmount.toFixed(2),
    variance: variance.toFixed(2),
    variancePercent: variancePercent.toFixed(2),
  }).where(eq(budgets.id, budgetId));
  
  // Check for alerts
  await checkBudgetAlerts(budgetId, parseFloat(variancePercent.toFixed(2)));
}

export async function checkBudgetAlerts(budgetId: number, currentPercentage: number) {
  const db = await getDb();
  if (!db) return;
  
  // Define alert thresholds
  const thresholds = [
    { threshold: 80, type: "warning" as const },
    { threshold: 90, type: "critical" as const },
    { threshold: 100, type: "exceeded" as const },
  ];
  
  for (const { threshold, type } of thresholds) {
    if (currentPercentage >= threshold) {
      // Check if alert already exists
      const existing = await db
        .select()
        .from(budgetAlerts)
        .where(
          and(
            eq(budgetAlerts.budgetId, budgetId),
            eq(budgetAlerts.alertType, type),
            eq(budgetAlerts.isRead, false)
          )
        )
        .limit(1);
      
      if (existing.length === 0) {
        // Create new alert
        const messages = {
          warning: `Orçamento atingiu ${currentPercentage.toFixed(1)}% (limite de aviso: 80%)`,
          critical: `Orçamento atingiu ${currentPercentage.toFixed(1)}% (limite crítico: 90%)`,
          exceeded: `Orçamento excedido! Atual: ${currentPercentage.toFixed(1)}%`,
        };
        
        await createBudgetAlert({
          budgetId,
          alertType: type,
          threshold,
          currentPercentage: Math.round(currentPercentage),
          message: messages[type],
        });
      }
    }
  }
}

export async function getBudgetSummary(budgetId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const budget = await getBudgetById(budgetId);
  if (!budget) return null;
  
  const items = await getBudgetItems(budgetId);
  const expensesList = await getBudgetExpenses(budgetId);
  const alerts = await getBudgetAlerts(budgetId);
  
  return {
    budget,
    items,
    expenses: expensesList,
    alerts,
    summary: {
      budgetedAmount: parseFloat(budget.budgetedAmount),
      actualAmount: parseFloat(budget.actualAmount),
      variance: parseFloat(budget.variance),
      variancePercent: parseFloat(budget.variancePercent || "0"),
      remaining: parseFloat(budget.budgetedAmount) - parseFloat(budget.actualAmount),
      itemCount: items.length,
      expenseCount: expensesList.length,
      unreadAlerts: alerts.filter(a => !a.isRead).length,
    }
  };
}
