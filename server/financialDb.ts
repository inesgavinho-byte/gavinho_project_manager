import { getDb } from "./db";
import { projects, budgets } from "../drizzle/schema";
import { eq, sql, and, gte, lte, isNull } from "drizzle-orm";

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
