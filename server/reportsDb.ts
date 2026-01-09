import { getDb } from "./db";
import { reportTemplates, reportExecutions, users } from "../drizzle/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

/**
 * Reports Database Functions
 */

/**
 * Create a new report template
 */
export async function createReportTemplate(data: {
  name: string;
  description?: string;
  createdById: number;
  isPublic: boolean;
  reportType: "progress" | "financial" | "resources" | "timeline" | "custom";
  metrics: string[];
  chartTypes: { metricId: string; chartType: "line" | "bar" | "pie" | "area" | "table" }[];
  filters: any;
  layout: any;
}): Promise<number> {
  const db = await getDb();

  const result = await db.insert(reportTemplates).values({
    name: data.name,
    description: data.description,
    createdById: data.createdById,
    isPublic: data.isPublic ? 1 : 0,
    reportType: data.reportType,
    metrics: data.metrics,
    chartTypes: data.chartTypes,
    filters: data.filters,
    layout: data.layout,
  });

  return result[0].insertId;
}

/**
 * Update a report template
 */
export async function updateReportTemplate(
  templateId: number,
  userId: number,
  data: Partial<{
    name: string;
    description: string;
    isPublic: boolean;
    reportType: "progress" | "financial" | "resources" | "timeline" | "custom";
    metrics: string[];
    chartTypes: { metricId: string; chartType: "line" | "bar" | "pie" | "area" | "table" }[];
    filters: any;
    layout: any;
  }>
): Promise<void> {
  const db = await getDb();

  // Check if user owns the template
  const template = await db
    .select()
    .from(reportTemplates)
    .where(eq(reportTemplates.id, templateId))
    .limit(1);

  if (template.length === 0) {
    throw new Error("Template not found");
  }

  if (template[0].createdById !== userId) {
    throw new Error("Unauthorized: You can only edit your own templates");
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic ? 1 : 0;
  if (data.reportType !== undefined) updateData.reportType = data.reportType;
  if (data.metrics !== undefined) updateData.metrics = data.metrics;
  if (data.chartTypes !== undefined) updateData.chartTypes = data.chartTypes;
  if (data.filters !== undefined) updateData.filters = data.filters;
  if (data.layout !== undefined) updateData.layout = data.layout;

  await db.update(reportTemplates).set(updateData).where(eq(reportTemplates.id, templateId));
}

/**
 * Delete a report template
 */
export async function deleteReportTemplate(templateId: number, userId: number): Promise<void> {
  const db = await getDb();

  // Check if user owns the template
  const template = await db
    .select()
    .from(reportTemplates)
    .where(eq(reportTemplates.id, templateId))
    .limit(1);

  if (template.length === 0) {
    throw new Error("Template not found");
  }

  if (template[0].createdById !== userId) {
    throw new Error("Unauthorized: You can only delete your own templates");
  }

  await db.delete(reportTemplates).where(eq(reportTemplates.id, templateId));
}

/**
 * Get all report templates accessible by user
 */
export async function getReportTemplates(userId: number) {
  const db = await getDb();

  const templates = await db
    .select({
      id: reportTemplates.id,
      name: reportTemplates.name,
      description: reportTemplates.description,
      reportType: reportTemplates.reportType,
      isPublic: reportTemplates.isPublic,
      createdById: reportTemplates.createdById,
      createdByName: users.name,
      createdAt: reportTemplates.createdAt,
      updatedAt: reportTemplates.updatedAt,
    })
    .from(reportTemplates)
    .leftJoin(users, eq(reportTemplates.createdById, users.id))
    .where(sql`${reportTemplates.isPublic} = 1 OR ${reportTemplates.createdById} = ${userId}`)
    .orderBy(desc(reportTemplates.updatedAt));

  return templates;
}

/**
 * Get a specific report template
 */
export async function getReportTemplate(templateId: number, userId: number) {
  const db = await getDb();

  const template = await db
    .select()
    .from(reportTemplates)
    .where(
      and(
        eq(reportTemplates.id, templateId),
        sql`${reportTemplates.isPublic} = 1 OR ${reportTemplates.createdById} = ${userId}`
      )
    )
    .limit(1);

  if (template.length === 0) {
    throw new Error("Template not found or access denied");
  }

  return template[0];
}

/**
 * Save report execution
 */
export async function saveReportExecution(data: {
  templateId: number;
  executedById: number;
  parameters: any;
  data: any;
  exportFormat: "pdf" | "excel" | "csv" | "json";
  fileUrl?: string;
  fileSize?: number;
}): Promise<number> {
  const db = await getDb();

  const result = await db.insert(reportExecutions).values({
    templateId: data.templateId,
    executedById: data.executedById,
    parameters: data.parameters,
    data: data.data,
    exportFormat: data.exportFormat,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize,
  });

  return result[0].insertId;
}

/**
 * Get report execution history
 */
export async function getReportExecutions(userId: number, limit: number = 20) {
  const db = await getDb();

  const executions = await db
    .select({
      id: reportExecutions.id,
      templateId: reportExecutions.templateId,
      templateName: reportTemplates.name,
      executedAt: reportExecutions.executedAt,
      exportFormat: reportExecutions.exportFormat,
      fileUrl: reportExecutions.fileUrl,
      fileSize: reportExecutions.fileSize,
    })
    .from(reportExecutions)
    .leftJoin(reportTemplates, eq(reportExecutions.templateId, reportTemplates.id))
    .where(eq(reportExecutions.executedById, userId))
    .orderBy(desc(reportExecutions.executedAt))
    .limit(limit);

  return executions;
}

/**
 * Get report execution by ID
 */
export async function getReportExecution(executionId: number, userId: number) {
  const db = await getDb();

  const execution = await db
    .select()
    .from(reportExecutions)
    .where(and(eq(reportExecutions.id, executionId), eq(reportExecutions.executedById, userId)))
    .limit(1);

  if (execution.length === 0) {
    throw new Error("Report execution not found or access denied");
  }

  return execution[0];
}
