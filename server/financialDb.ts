import { getDb } from "./db";
import { projects, budgets, budgetAlerts, budgetItems, expenses, costPredictions } from "../drizzle/schema";
import { eq, sql, and, gte, lte, isNull, desc } from "drizzle-orm";

export interface FinancialFilters {
  period?: 'monthly' | 'quarterly' | 'yearly' | 'all';
  status?: string;
  clientName?: string;
  startDate?: Date;
  endDate?: Date;
}

function buildFilterConditions(filters?: FinancialFilters) {
  const conditions = [isNull(projects.deletedAt)];
  
  if (filters?.status) {
    conditions.push(eq(projects.status, filters.status as any));
  }
  
  if (filters?.clientName) {
    conditions.push(sql`${projects.clientName} LIKE ${`%${filters.clientName}%`}`);
  }
  
  if (filters?.startDate) {
    conditions.push(gte(projects.createdAt, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(projects.createdAt, filters.endDate));
  }
  
  return conditions;
}

/**
 * Get financial KPIs across all projects
 */
export async function getFinancialKPIs(filters?: FinancialFilters) {
  const db = await getDb();
  
  const result = await db
    .select({
      totalBudget: sql<number>`COALESCE(SUM(${projects.budget}), 0)`,
      totalSpent: sql<number>`COALESCE(SUM(${projects.actualCost}), 0)`,
      projectCount: sql<number>`COUNT(*)`,
    })
    .from(projects)
    .where(and(...buildFilterConditions(filters)));

  const row = result[0];
  
  const totalBudget = Number(row?.totalBudget || 0);
  const totalSpent = Number(row?.totalSpent || 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Calculate average profit margin
  const projectsWithMargin = await db
    .select({
      budget: projects.budget,
      actualCost: projects.actualCost,
    })
    .from(projects)
    .where(and(
      ...buildFilterConditions(filters),
      sql`${projects.budget} > 0`
    ));

  let totalMargin = 0;
  let projectsWithData = 0;
  
  for (const proj of projectsWithMargin) {
    const budget = Number(proj.budget || 0);
    const cost = Number(proj.actualCost || 0);
    if (budget > 0) {
      const margin = ((budget - cost) / budget) * 100;
      totalMargin += margin;
      projectsWithData++;
    }
  }
  
  const averageProfitMargin = projectsWithData > 0 ? totalMargin / projectsWithData : 0;

  return {
    totalBudget,
    totalSpent,
    budgetUtilization: Math.round(budgetUtilization * 100) / 100,
    averageProfitMargin: Math.round(averageProfitMargin * 100) / 100,
  };
}

/**
 * Get budget evolution over time (monthly aggregation)
 */
export async function getBudgetEvolution(filters?: FinancialFilters) {
  const db = await getDb();
  
  const result = await db
    .select({
      month: sql<string>`DATE_FORMAT(${projects.createdAt}, '%Y-%m')`,
      plannedBudget: sql<number>`COALESCE(SUM(${projects.budget}), 0)`,
      actualCost: sql<number>`COALESCE(SUM(${projects.actualCost}), 0)`,
    })
    .from(projects)
    .where(and(...buildFilterConditions(filters)))
    .groupBy(sql`DATE_FORMAT(${projects.createdAt}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${projects.createdAt}, '%Y-%m')`);

  return result.map(row => ({
    month: row.month,
    plannedBudget: Number(row.plannedBudget),
    actualCost: Number(row.actualCost),
  }));
}

/**
 * Get cost comparison by project
 */
export async function getCostComparison(filters?: FinancialFilters) {
  const db = await getDb();
  
  const result = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      plannedBudget: projects.budget,
      actualCost: projects.actualCost,
      variance: sql<number>`${projects.actualCost} - ${projects.budget}`,
    })
    .from(projects)
    .where(and(
      ...buildFilterConditions(filters),
      sql`${projects.budget} IS NOT NULL`
    ))
    .orderBy(sql`ABS(${projects.actualCost} - ${projects.budget}) DESC`)
    .limit(20);

  return result.map(row => ({
    projectId: row.projectId,
    projectName: row.projectName,
    plannedBudget: Number(row.plannedBudget || 0),
    actualCost: Number(row.actualCost || 0),
    variance: Number(row.variance || 0),
  }));
}

/**
 * Get project profitability analysis
 */
export async function getProjectProfitability(filters?: FinancialFilters) {
  const db = await getDb();
  
  const result = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      budget: projects.budget,
      actualCost: projects.actualCost,
      profitMargin: sql<number>`CASE 
        WHEN ${projects.budget} > 0 
        THEN ((${projects.budget} - ${projects.actualCost}) / ${projects.budget}) * 100 
        ELSE 0 
      END`,
      roi: sql<number>`CASE 
        WHEN ${projects.actualCost} > 0 
        THEN ((${projects.budget} - ${projects.actualCost}) / ${projects.actualCost}) * 100 
        ELSE 0 
      END`,
    })
    .from(projects)
    .where(and(
      ...buildFilterConditions(filters),
      sql`${projects.budget} IS NOT NULL`,
      sql`${projects.budget} > 0`
    ))
    .orderBy(sql`((${projects.budget} - ${projects.actualCost}) / ${projects.budget}) * 100 DESC`)
    .limit(20);

  return result.map(row => ({
    projectId: row.projectId,
    projectName: row.projectName,
    budget: Number(row.budget || 0),
    actualCost: Number(row.actualCost || 0),
    profitMargin: Math.round(Number(row.profitMargin || 0) * 100) / 100,
    roi: Math.round(Number(row.roi || 0) * 100) / 100,
  }));
}

/**
 * Get budget alerts (projects over 90% budget)
 */
export async function getBudgetAlerts(filters?: FinancialFilters) {
  const db = await getDb();
  
  const result = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      budget: projects.budget,
      actualCost: projects.actualCost,
      utilization: sql<number>`(${projects.actualCost} / ${projects.budget}) * 100`,
    })
    .from(projects)
    .where(and(
      ...buildFilterConditions(filters),
      sql`${projects.budget} IS NOT NULL`,
      sql`${projects.budget} > 0`,
      sql`(${projects.actualCost} / ${projects.budget}) >= 0.9`
    ))
    .orderBy(sql`(${projects.actualCost} / ${projects.budget}) DESC`);

  return result.map(row => ({
    projectId: row.projectId,
    projectName: row.projectName,
    budget: Number(row.budget || 0),
    actualCost: Number(row.actualCost || 0),
    utilization: Math.round(Number(row.utilization || 0) * 100) / 100,
    severity: Number(row.utilization || 0) >= 100 ? 'critical' : 'warning',
  }));
}

/**
 * Get expense trends (last 6 months)
 */
export async function getExpenseTrends(filters?: FinancialFilters) {
  const db = await getDb();
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const result = await db
    .select({
      month: sql<string>`DATE_FORMAT(${projects.updatedAt}, '%Y-%m')`,
      totalExpenses: sql<number>`COALESCE(SUM(${projects.actualCost}), 0)`,
      projectCount: sql<number>`COUNT(*)`,
    })
    .from(projects)
    .where(and(
      ...buildFilterConditions(filters),
      gte(projects.updatedAt, sixMonthsAgo)
    ))
    .groupBy(sql`DATE_FORMAT(${projects.updatedAt}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${projects.updatedAt}, '%Y-%m')`);

  return result.map(row => ({
    month: row.month,
    totalExpenses: Number(row.totalExpenses),
    projectCount: Number(row.projectCount),
    averagePerProject: Number(row.projectCount) > 0 
      ? Math.round(Number(row.totalExpenses) / Number(row.projectCount) * 100) / 100
      : 0,
  }));
}


/**
 * Budget Alert Monitoring Functions
 */

interface BudgetThresholdCheck {
  budgetId: number;
  projectId: number;
  projectName: string;
  budgetTotal: number;
  actualCost: number;
  percentage: number;
  threshold: number;
  alertType: "warning" | "critical" | "exceeded";
  shouldAlert: boolean;
}

/**
 * Check all budgets for threshold violations
 */
export async function checkBudgetThresholds(): Promise<BudgetThresholdCheck[]> {
  const db = await getDb();

  // Get all active budgets with their total and spent amounts
  const budgetsData = await db
    .select({
      budgetId: budgets.id,
      projectId: budgets.projectId,
      projectName: projects.name,
      budgetTotal: budgets.totalBudget,
      actualCost: sql<number>`COALESCE((
        SELECT SUM(amount)
        FROM expenses
        WHERE budgetId = ${budgets.id}
      ), 0)`,
    })
    .from(budgets)
    .leftJoin(projects, eq(budgets.projectId, projects.id))
    .where(and(eq(budgets.status, "active"), isNull(projects.deletedAt)));

  const checks: BudgetThresholdCheck[] = [];

  for (const budget of budgetsData) {
    const percentage = (Number(budget.actualCost) / Number(budget.budgetTotal)) * 100;

    // Check 80% threshold (warning)
    if (percentage >= 80 && percentage < 90) {
      checks.push({
        budgetId: budget.budgetId,
        projectId: budget.projectId,
        projectName: budget.projectName || "Projeto sem nome",
        budgetTotal: Number(budget.budgetTotal),
        actualCost: Number(budget.actualCost),
        percentage,
        threshold: 80,
        alertType: "warning",
        shouldAlert: await shouldCreateAlert(budget.budgetId, 80, percentage),
      });
    }

    // Check 90% threshold (critical)
    if (percentage >= 90 && percentage < 100) {
      checks.push({
        budgetId: budget.budgetId,
        projectId: budget.projectId,
        projectName: budget.projectName || "Projeto sem nome",
        budgetTotal: Number(budget.budgetTotal),
        actualCost: Number(budget.actualCost),
        percentage,
        threshold: 90,
        alertType: "critical",
        shouldAlert: await shouldCreateAlert(budget.budgetId, 90, percentage),
      });
    }

    // Check 100% threshold (exceeded)
    if (percentage >= 100) {
      checks.push({
        budgetId: budget.budgetId,
        projectId: budget.projectId,
        projectName: budget.projectName || "Projeto sem nome",
        budgetTotal: Number(budget.budgetTotal),
        actualCost: Number(budget.actualCost),
        percentage,
        threshold: 100,
        alertType: "exceeded",
        shouldAlert: await shouldCreateAlert(budget.budgetId, 100, percentage),
      });
    }
  }

  return checks;
}

/**
 * Check if we should create a new alert (avoid duplicates)
 */
async function shouldCreateAlert(budgetId: number, threshold: number, currentPercentage: number): Promise<boolean> {
  const db = await getDb();

  // Get the most recent alert for this budget and threshold
  const recentAlert = await db
    .select()
    .from(budgetAlerts)
    .where(and(eq(budgetAlerts.budgetId, budgetId), eq(budgetAlerts.threshold, threshold)))
    .orderBy(desc(budgetAlerts.createdAt))
    .limit(1);

  // If no alert exists, create one
  if (recentAlert.length === 0) {
    return true;
  }

  // If alert exists but percentage has increased significantly (>5%), create new alert
  const lastAlert = recentAlert[0];
  if (currentPercentage - lastAlert.currentPercentage > 5) {
    return true;
  }

  return false;
}

/**
 * Create a budget alert
 */
export async function createBudgetAlert(data: {
  budgetId: number;
  alertType: "warning" | "critical" | "exceeded";
  threshold: number;
  currentPercentage: number;
  message: string;
}): Promise<number> {
  const db = await getDb();

  const result = await db.insert(budgetAlerts).values({
    budgetId: data.budgetId,
    alertType: data.alertType,
    threshold: data.threshold,
    currentPercentage: data.currentPercentage,
    message: data.message,
    isRead: false,
  });

  return result[0].insertId;
}

/**
 * Get budget breakdown by category for email
 */
export async function getBudgetBreakdown(budgetId: number) {
  const db = await getDb();

  const breakdown = await db
    .select({
      category: budgetItems.category,
      budgeted: budgetItems.amount,
      actual: sql<number>`COALESCE((
        SELECT SUM(amount)
        FROM expenses
        WHERE budgetItemId = ${budgetItems.id}
      ), 0)`,
    })
    .from(budgetItems)
    .where(eq(budgetItems.budgetId, budgetId));

  return breakdown.map((item) => ({
    category: item.category,
    budgeted: Number(item.budgeted),
    actual: Number(item.actual),
    percentage: (Number(item.actual) / Number(item.budgeted)) * 100,
    variance: Number(item.actual) - Number(item.budgeted),
  }));
}

/**
 * Mark budget alert as read
 */
export async function markBudgetAlertAsRead(alertId: number, userId: number): Promise<void> {
  const db = await getDb();

  await db
    .update(budgetAlerts)
    .set({
      isRead: true,
      readById: userId,
      readAt: new Date(),
    })
    .where(eq(budgetAlerts.id, alertId));
}

/**
 * Get unread budget alerts
 */
export async function getUnreadBudgetAlerts() {
  const db = await getDb();

  const alerts = await db
    .select({
      id: budgetAlerts.id,
      budgetId: budgetAlerts.budgetId,
      projectId: budgets.projectId,
      projectName: projects.name,
      alertType: budgetAlerts.alertType,
      threshold: budgetAlerts.threshold,
      currentPercentage: budgetAlerts.currentPercentage,
      message: budgetAlerts.message,
      createdAt: budgetAlerts.createdAt,
    })
    .from(budgetAlerts)
    .leftJoin(budgets, eq(budgetAlerts.budgetId, budgets.id))
    .leftJoin(projects, eq(budgets.projectId, projects.id))
    .where(eq(budgetAlerts.isRead, false))
    .orderBy(desc(budgetAlerts.createdAt));

  return alerts;
}


/**
 * Cost Prediction Functions
 */

/**
 * Find similar projects based on budget, duration, and location
 */
export async function findSimilarProjects(projectId: number, limit: number = 10) {
  const db = await getDb();

  // Get current project details
  const currentProject = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);

  if (currentProject.length === 0) {
    return [];
  }

  const project = currentProject[0];
  const projectBudget = Number(project.budget || 0);

  // Find similar completed projects
  // Criteria: similar budget (±30%), same location if available, completed status
  const similarProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      budget: projects.budget,
      actualCost: projects.actualCost,
      location: projects.location,
      startDate: projects.startDate,
      endDate: projects.endDate,
    })
    .from(projects)
    .where(
      and(
        eq(projects.status, "completed"),
        isNull(projects.deletedAt),
        sql`${projects.id} != ${projectId}`,
        sql`${projects.budget} BETWEEN ${projectBudget * 0.7} AND ${projectBudget * 1.3}`
      )
    )
    .orderBy(sql`ABS(${projects.budget} - ${projectBudget})`)
    .limit(limit);

  return similarProjects.map((p) => ({
    id: p.id,
    name: p.name,
    budget: Number(p.budget),
    actualCost: Number(p.actualCost),
    variance: Number(p.actualCost) - Number(p.budget),
    variancePercentage: ((Number(p.actualCost) - Number(p.budget)) / Number(p.budget)) * 100,
  }));
}

/**
 * Save cost prediction to database
 */
export async function saveCostPrediction(data: {
  projectId: number;
  predictedCost: number;
  confidenceLevel: "low" | "medium" | "high";
  confidenceScore: number;
  overrunRisk: "low" | "medium" | "high" | "critical";
  overrunProbability: number;
  basedOnProjects: number[];
  factors: any;
  recommendations: string[];
}): Promise<number> {
  const db = await getDb();

  const result = await db.insert(costPredictions).values({
    projectId: data.projectId,
    predictedCost: data.predictedCost.toString(),
    confidenceLevel: data.confidenceLevel,
    confidenceScore: data.confidenceScore,
    overrunRisk: data.overrunRisk,
    overrunProbability: data.overrunProbability,
    analysisDate: new Date(),
    basedOnProjects: data.basedOnProjects,
    factors: data.factors,
    recommendations: data.recommendations,
  });

  return result[0].insertId;
}

/**
 * Get cost predictions for a project
 */
export async function getCostPredictions(projectId: number) {
  const db = await getDb();

  const predictions = await db
    .select()
    .from(costPredictions)
    .where(eq(costPredictions.projectId, projectId))
    .orderBy(desc(costPredictions.analysisDate));

  return predictions;
}

/**
 * Get latest cost prediction for a project
 */
export async function getLatestCostPrediction(projectId: number) {
  const db = await getDb();

  const prediction = await db
    .select()
    .from(costPredictions)
    .where(eq(costPredictions.projectId, projectId))
    .orderBy(desc(costPredictions.analysisDate))
    .limit(1);

  return prediction.length > 0 ? prediction[0] : null;
}

/**
 * Get projects with high overrun risk
 */
export async function getHighRiskProjects() {
  const db = await getDb();

  const highRiskPredictions = await db
    .select({
      predictionId: costPredictions.id,
      projectId: costPredictions.projectId,
      projectName: projects.name,
      predictedCost: costPredictions.predictedCost,
      overrunRisk: costPredictions.overrunRisk,
      overrunProbability: costPredictions.overrunProbability,
      analysisDate: costPredictions.analysisDate,
    })
    .from(costPredictions)
    .leftJoin(projects, eq(costPredictions.projectId, projects.id))
    .where(
      and(
        sql`${costPredictions.overrunRisk} IN ('high', 'critical')`,
        isNull(projects.deletedAt),
        sql`${projects.status} != 'completed'`
      )
    )
    .orderBy(desc(costPredictions.analysisDate));

  // Get only the latest prediction for each project
  const latestPredictions = new Map();
  for (const pred of highRiskPredictions) {
    if (!latestPredictions.has(pred.projectId)) {
      latestPredictions.set(pred.projectId, pred);
    }
  }

  return Array.from(latestPredictions.values());
}


/**
 * Get project by ID for prediction analysis
 */
export async function getProjectById(projectId: number) {
  const db = await getDb();

  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
