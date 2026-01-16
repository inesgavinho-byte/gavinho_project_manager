import { db } from './db';
import { actionExecutionLogs } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

export interface TrendMetrics {
  period: string;
  totalActions: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageDuration: number;
  slowestAction: { type: string; duration: number } | null;
  mostFailedAction: { type: string; failureCount: number } | null;
}

export interface AnomalyDetection {
  actionType: string;
  expectedDuration: number;
  actualDuration: number;
  deviation: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface OptimizationRecommendation {
  actionType: string;
  issue: string;
  recommendation: string;
  estimatedImprovement: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Calcula métricas de tendências para um período específico
 */
export async function calculateTrendMetrics(
  startDate: Date,
  endDate: Date,
  actionType?: string
): Promise<TrendMetrics> {
  const dbInstance = await db();

  const query = dbInstance
    .select({
      totalActions: sql<number>`COUNT(*)`,
      successCount: sql<number>`SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)`,
      failureCount: sql<number>`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
      averageDuration: sql<number>`AVG(CAST(duration AS DECIMAL))`,
    })
    .from(actionExecutionLogs)
    .where(
      sql`${actionExecutionLogs.executedAt} BETWEEN ${startDate} AND ${endDate}`
    );

  if (actionType) {
    query.where(sql`${actionExecutionLogs.actionType} = ${actionType}`);
  }

  const result = await query;

  const metrics = result[0] || {
    totalActions: 0,
    successCount: 0,
    failureCount: 0,
    averageDuration: 0,
  };

  const successRate =
    metrics.totalActions > 0
      ? (metrics.successCount / metrics.totalActions) * 100
      : 0;

  // Encontrar ação mais lenta
  const slowestActionResult = await dbInstance
    .select({
      actionType: actionExecutionLogs.actionType,
      duration: actionExecutionLogs.duration,
    })
    .from(actionExecutionLogs)
    .where(
      sql`${actionExecutionLogs.executedAt} BETWEEN ${startDate} AND ${endDate}`
    )
    .orderBy(sql`${actionExecutionLogs.duration} DESC`)
    .limit(1);

  // Encontrar ação com mais falhas
  const mostFailedActionResult = await dbInstance
    .select({
      actionType: actionExecutionLogs.actionType,
      failureCount: sql<number>`COUNT(*)`,
    })
    .from(actionExecutionLogs)
    .where(
      sql`${actionExecutionLogs.executedAt} BETWEEN ${startDate} AND ${endDate} AND ${actionExecutionLogs.status} = 'failed'`
    )
    .groupBy(actionExecutionLogs.actionType)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(1);

  return {
    period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    totalActions: metrics.totalActions,
    successCount: metrics.successCount,
    failureCount: metrics.failureCount,
    successRate: Math.round(successRate * 100) / 100,
    averageDuration: Math.round(metrics.averageDuration || 0),
    slowestAction: slowestActionResult[0]
      ? {
          type: slowestActionResult[0].actionType,
          duration: slowestActionResult[0].duration,
        }
      : null,
    mostFailedAction: mostFailedActionResult[0]
      ? {
          type: mostFailedActionResult[0].actionType,
          failureCount: mostFailedActionResult[0].failureCount,
        }
      : null,
  };
}

/**
 * Detecta anomalias em ações baseado em desvios padrão
 */
export async function detectAnomalies(
  timeWindowDays: number = 30
): Promise<AnomalyDetection[]> {
  const dbInstance = await db();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeWindowDays);

  // Calcular média e desvio padrão por tipo de ação
  const actionStats = await dbInstance
    .select({
      actionType: actionExecutionLogs.actionType,
      avgDuration: sql<number>`AVG(CAST(duration AS DECIMAL))`,
      stdDevDuration: sql<number>`STDDEV(CAST(duration AS DECIMAL))`,
    })
    .from(actionExecutionLogs)
    .where(sql`${actionExecutionLogs.executedAt} >= ${startDate}`)
    .groupBy(actionExecutionLogs.actionType);

  const anomalies: AnomalyDetection[] = [];

  for (const stat of actionStats) {
    const threshold = (stat.stdDevDuration || 0) * 2; // 2 desvios padrão

    const recentActions = await dbInstance
      .select({
        duration: actionExecutionLogs.duration,
      })
      .from(actionExecutionLogs)
      .where(
        sql`${actionExecutionLogs.actionType} = ${stat.actionType} AND ${actionExecutionLogs.executedAt} >= ${startDate}`
      )
      .orderBy(sql`${actionExecutionLogs.executedAt} DESC`)
      .limit(5);

    for (const action of recentActions) {
      const deviation = Math.abs(action.duration - stat.avgDuration);
      const isAnomaly = deviation > threshold;

      if (isAnomaly) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (deviation > threshold * 2) severity = 'high';
        else if (deviation > threshold * 1.5) severity = 'medium';

        anomalies.push({
          actionType: stat.actionType,
          expectedDuration: Math.round(stat.avgDuration),
          actualDuration: action.duration,
          deviation: Math.round(deviation),
          isAnomaly,
          severity,
        });
      }
    }
  }

  return anomalies;
}

/**
 * Gera recomendações de otimização baseado em análise de dados
 */
export async function generateOptimizationRecommendations(
  timeWindowDays: number = 30
): Promise<OptimizationRecommendation[]> {
  const dbInstance = await db();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeWindowDays);

  const recommendations: OptimizationRecommendation[] = [];

  // Analisar ações com alta taxa de falha
  const failureAnalysis = await dbInstance
    .select({
      actionType: actionExecutionLogs.actionType,
      failureRate: sql<number>`(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*))`,
      totalExecutions: sql<number>`COUNT(*)`,
    })
    .from(actionExecutionLogs)
    .where(sql`${actionExecutionLogs.executedAt} >= ${startDate}`)
    .groupBy(actionExecutionLogs.actionType)
    .having(
      sql`(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) > 10`
    );

  for (const analysis of failureAnalysis) {
    recommendations.push({
      actionType: analysis.actionType,
      issue: `High failure rate (${Math.round(analysis.failureRate)}%)`,
      recommendation: `Review error logs and implement retry logic with exponential backoff for ${analysis.actionType}`,
      estimatedImprovement: Math.min(analysis.failureRate * 0.5, 50),
      priority: analysis.failureRate > 30 ? 'high' : 'medium',
    });
  }

  // Analisar ações lentas
  const slowActionAnalysis = await dbInstance
    .select({
      actionType: actionExecutionLogs.actionType,
      avgDuration: sql<number>`AVG(CAST(duration AS DECIMAL))`,
    })
    .from(actionExecutionLogs)
    .where(sql`${actionExecutionLogs.executedAt} >= ${startDate}`)
    .groupBy(actionExecutionLogs.actionType)
    .having(sql`AVG(CAST(duration AS DECIMAL)) > 5000`);

  for (const analysis of slowActionAnalysis) {
    recommendations.push({
      actionType: analysis.actionType,
      issue: `Slow execution (${Math.round(analysis.avgDuration)}ms average)`,
      recommendation: `Optimize ${analysis.actionType} by implementing caching, parallel processing, or async operations`,
      estimatedImprovement: 30,
      priority: analysis.avgDuration > 10000 ? 'high' : 'medium',
    });
  }

  // Analisar padrões de falha
  const failurePatterns = await dbInstance
    .select({
      actionType: actionExecutionLogs.actionType,
      errorMessage: actionExecutionLogs.errorMessage,
      count: sql<number>`COUNT(*)`,
    })
    .from(actionExecutionLogs)
    .where(
      sql`${actionExecutionLogs.executedAt} >= ${startDate} AND ${actionExecutionLogs.status} = 'failed'`
    )
    .groupBy(actionExecutionLogs.actionType, actionExecutionLogs.errorMessage)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  for (const pattern of failurePatterns) {
    if (pattern.count > 3) {
      recommendations.push({
        actionType: pattern.actionType,
        issue: `Recurring error: ${pattern.errorMessage}`,
        recommendation: `Implement specific error handling for "${pattern.errorMessage}" in ${pattern.actionType}`,
        estimatedImprovement: 20,
        priority: pattern.count > 10 ? 'high' : 'medium',
      });
    }
  }

  return recommendations;
}

/**
 * Calcula comparação de tendências entre dois períodos
 */
export async function compareTrendPeriods(
  startDate1: Date,
  endDate1: Date,
  startDate2: Date,
  endDate2: Date
): Promise<{ period1: TrendMetrics; period2: TrendMetrics; comparison: any }> {
  const period1 = await calculateTrendMetrics(startDate1, endDate1);
  const period2 = await calculateTrendMetrics(startDate2, endDate2);

  const comparison = {
    successRateChange: period2.successRate - period1.successRate,
    averageDurationChange: period2.averageDuration - period1.averageDuration,
    totalActionsChange: period2.totalActions - period1.totalActions,
    failureRateChange:
      (100 - period2.successRate) - (100 - period1.successRate),
  };

  return { period1, period2, comparison };
}
