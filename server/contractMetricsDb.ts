/**
 * Database functions for contract processing metrics and analytics
 */

import { getDb } from "./db";
import { contractProcessingHistory } from "../drizzle/schema";
import { sql, gte, and, eq } from "drizzle-orm";

/**
 * Get overall statistics for contract processing
 */
export async function getOverallStatistics(startDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = startDate ? [gte(contractProcessingHistory.createdAt, startDate)] : [];
  
  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
      success: sql<number>`SUM(CASE WHEN ${contractProcessingHistory.status} = 'success' THEN 1 ELSE 0 END)`,
      error: sql<number>`SUM(CASE WHEN ${contractProcessingHistory.status} = 'error' THEN 1 ELSE 0 END)`,
      processing: sql<number>`SUM(CASE WHEN ${contractProcessingHistory.status} = 'processing' THEN 1 ELSE 0 END)`,
      reprocessed: sql<number>`SUM(CASE WHEN ${contractProcessingHistory.isReprocessing} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(contractProcessingHistory)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const stats = result[0];
  const successRate = stats.total > 0 ? (Number(stats.success) / Number(stats.total)) * 100 : 0;
  
  return {
    total: Number(stats.total),
    success: Number(stats.success),
    error: Number(stats.error),
    processing: Number(stats.processing),
    reprocessed: Number(stats.reprocessed),
    successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Get time series data for uploads (grouped by day)
 */
export async function getTimeSeriesData(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      date: sql<string>`DATE(${contractProcessingHistory.createdAt})`.as('date'),
      total: sql<number>`COUNT(*)`,
      success: sql<number>`SUM(CASE WHEN ${contractProcessingHistory.status} = 'success' THEN 1 ELSE 0 END)`,
      error: sql<number>`SUM(CASE WHEN ${contractProcessingHistory.status} = 'error' THEN 1 ELSE 0 END)`,
    })
    .from(contractProcessingHistory)
    .where(
      and(
        gte(contractProcessingHistory.createdAt, startDate),
        sql`${contractProcessingHistory.createdAt} <= ${endDate}`
      )
    )
    .groupBy(sql`date`)
    .orderBy(sql`date`);
  
  return result.map(row => ({
    date: row.date,
    total: Number(row.total),
    success: Number(row.success),
    error: Number(row.error),
    successRate: row.total > 0 ? Math.round((Number(row.success) / Number(row.total)) * 1000) / 10 : 0,
  }));
}

/**
 * Get most common error messages with counts
 */
export async function getCommonErrors(startDate?: Date, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(contractProcessingHistory.status, "error"),
    sql`${contractProcessingHistory.errorMessage} IS NOT NULL`,
  ];
  
  if (startDate) {
    conditions.push(gte(contractProcessingHistory.createdAt, startDate));
  }
  
  const result = await db
    .select({
      errorMessage: contractProcessingHistory.errorMessage,
      count: sql<number>`COUNT(*)`,
      lastOccurrence: sql<Date>`MAX(${contractProcessingHistory.createdAt})`,
    })
    .from(contractProcessingHistory)
    .where(and(...conditions))
    .groupBy(contractProcessingHistory.errorMessage)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(limit);
  
  return result.map(row => ({
    errorMessage: row.errorMessage || "Unknown error",
    count: Number(row.count),
    lastOccurrence: row.lastOccurrence,
  }));
}

/**
 * Get processing performance metrics
 */
export async function getPerformanceMetrics(startDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    sql`${contractProcessingHistory.processingDurationMs} IS NOT NULL`,
  ];
  
  if (startDate) {
    conditions.push(gte(contractProcessingHistory.createdAt, startDate));
  }
  
  const result = await db
    .select({
      avgDuration: sql<number>`AVG(${contractProcessingHistory.processingDurationMs})`,
      minDuration: sql<number>`MIN(${contractProcessingHistory.processingDurationMs})`,
      maxDuration: sql<number>`MAX(${contractProcessingHistory.processingDurationMs})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(contractProcessingHistory)
    .where(and(...conditions));
  
  const metrics = result[0];
  
  return {
    avgDuration: Math.round(Number(metrics.avgDuration || 0)),
    minDuration: Math.round(Number(metrics.minDuration || 0)),
    maxDuration: Math.round(Number(metrics.maxDuration || 0)),
    count: Number(metrics.count),
  };
}

/**
 * Get distribution of processing durations (bucketed)
 */
export async function getDurationDistribution(startDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    sql`${contractProcessingHistory.processingDurationMs} IS NOT NULL`,
  ];
  
  if (startDate) {
    conditions.push(gte(contractProcessingHistory.createdAt, startDate));
  }
  
  // Bucket durations: <5s, 5-10s, 10-20s, 20-30s, 30-60s, >60s
  const result = await db
    .select({
      bucket: sql<string>`
        CASE 
          WHEN ${contractProcessingHistory.processingDurationMs} < 5000 THEN '< 5s'
          WHEN ${contractProcessingHistory.processingDurationMs} < 10000 THEN '5-10s'
          WHEN ${contractProcessingHistory.processingDurationMs} < 20000 THEN '10-20s'
          WHEN ${contractProcessingHistory.processingDurationMs} < 30000 THEN '20-30s'
          WHEN ${contractProcessingHistory.processingDurationMs} < 60000 THEN '30-60s'
          ELSE '> 60s'
        END
      `.as('bucket'),
      count: sql<number>`COUNT(*)`,
      bucketOrder: sql<number>`
        CASE 
          WHEN ${contractProcessingHistory.processingDurationMs} < 5000 THEN 1
          WHEN ${contractProcessingHistory.processingDurationMs} < 10000 THEN 2
          WHEN ${contractProcessingHistory.processingDurationMs} < 20000 THEN 3
          WHEN ${contractProcessingHistory.processingDurationMs} < 30000 THEN 4
          WHEN ${contractProcessingHistory.processingDurationMs} < 60000 THEN 5
          ELSE 6
        END
      `.as('bucketOrder'),
    })
    .from(contractProcessingHistory)
    .where(and(...conditions))
    .groupBy(sql`bucket`, sql`bucketOrder`)
    .orderBy(sql`bucketOrder`);
  
  return result.map(row => ({
    bucket: row.bucket,
    count: Number(row.count),
  }));
}

/**
 * Get file size statistics
 */
export async function getFileSizeStats(startDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = startDate ? [gte(contractProcessingHistory.createdAt, startDate)] : [];
  
  const result = await db
    .select({
      avgSize: sql<number>`AVG(${contractProcessingHistory.fileSize})`,
      minSize: sql<number>`MIN(${contractProcessingHistory.fileSize})`,
      maxSize: sql<number>`MAX(${contractProcessingHistory.fileSize})`,
      totalSize: sql<number>`SUM(${contractProcessingHistory.fileSize})`,
    })
    .from(contractProcessingHistory)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const stats = result[0];
  
  return {
    avgSize: Math.round(Number(stats.avgSize || 0)),
    minSize: Number(stats.minSize || 0),
    maxSize: Number(stats.maxSize || 0),
    totalSize: Number(stats.totalSize || 0),
  };
}
