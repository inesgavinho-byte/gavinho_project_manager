import { getDb } from "./db";
import { supplierEvaluations, suppliers } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface TrendDataPoint {
  date: string;
  rating: number;
  quality: number;
  timeliness: number;
  communication: number;
  count: number;
}

export interface SupplierTrendData {
  supplierId: number;
  supplierName: string;
  period: "30d" | "90d" | "1y" | "all";
  data: TrendDataPoint[];
  summary: {
    currentAvg: number;
    previousAvg: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
  };
}

export interface ComparisonTrendData {
  suppliers: Array<{
    supplierId: number;
    supplierName: string;
    data: TrendDataPoint[];
  }>;
  period: "30d" | "90d" | "1y" | "all";
}

/**
 * Busca dados de tendencia de ratings para um fornecedor
 */
export async function getSupplierTrendData(
  supplierId: number,
  period: "30d" | "90d" | "1y" | "all" = "90d"
): Promise<SupplierTrendData | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Buscar informacoes do fornecedor
  const supplierResult = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, supplierId));

  if (supplierResult.length === 0) {
    return null;
  }

  const supplier = supplierResult[0];

  // Calcular data de inicio baseado no periodo
  const now = new Date();
  let startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // padrao 90 dias

  if (period === "30d") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === "1y") {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  } else if (period === "all") {
    startDate = new Date(0); // desde o inicio dos tempos
  }

  // Buscar avaliacoes do periodo
  let conditions: any[] = [eq(supplierEvaluations.supplierId, supplierId)];

  if (period !== "all") {
    conditions.push(
      gte(supplierEvaluations.evaluatedAt, startDate.toISOString()),
      lte(supplierEvaluations.evaluatedAt, now.toISOString())
    );
  }

  const evaluationsList = await db
    .select()
    .from(supplierEvaluations)
    .where(and(...conditions))
    .orderBy(desc(supplierEvaluations.evaluatedAt));

  // Agrupar por semana para melhor visualizacao
  const weeklyData = new Map<string, TrendDataPoint>();

  evaluationsList.forEach((item) => {
    const evalDate = new Date(item.evaluatedAt);
    const weekStart = new Date(evalDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Inicio da semana (domingo)

    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, {
        date: weekKey,
        rating: 0,
        quality: 0,
        timeliness: 0,
        communication: 0,
        count: 0,
      });
    }

    const point = weeklyData.get(weekKey)!;
    point.rating += item.rating;
    point.quality += item.quality || 0;
    point.timeliness += item.timeliness || 0;
    point.communication += item.communication || 0;
    point.count += 1;
  });

  // Calcular medias
  const data = Array.from(weeklyData.values())
    .map((point) => ({
      ...point,
      rating: Math.round((point.rating / point.count) * 100) / 100,
      quality: Math.round((point.quality / point.count) * 100) / 100,
      timeliness: Math.round((point.timeliness / point.count) * 100) / 100,
      communication: Math.round((point.communication / point.count) * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calcular tendencia
  let currentAvg = 0;
  let previousAvg = 0;
  let trend: "up" | "down" | "stable" = "stable";
  let trendPercentage = 0;

  if (data.length > 0) {
    // Media atual (ultimas 2 semanas)
    const recentData = data.slice(-2);
    currentAvg =
      recentData.reduce((sum, d) => sum + d.rating, 0) / recentData.length;

    // Media anterior (2 semanas antes)
    if (data.length > 4) {
      const olderData = data.slice(-4, -2);
      previousAvg =
        olderData.reduce((sum, d) => sum + d.rating, 0) / olderData.length;

      trendPercentage = Math.round(((currentAvg - previousAvg) / previousAvg) * 100);

      if (trendPercentage > 5) {
        trend = "up";
      } else if (trendPercentage < -5) {
        trend = "down";
      } else {
        trend = "stable";
      }
    } else {
      previousAvg = currentAvg;
    }
  }

  return {
    supplierId,
    supplierName: supplier.name,
    period,
    data,
    summary: {
      currentAvg: Math.round(currentAvg * 100) / 100,
      previousAvg: Math.round(previousAvg * 100) / 100,
      trend,
      trendPercentage,
    },
  };
}

/**
 * Busca dados de tendencia para multiplos fornecedores (comparacao)
 */
export async function getComparisonTrendData(
  supplierIds: number[],
  period: "30d" | "90d" | "1y" | "all" = "90d"
): Promise<ComparisonTrendData> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const suppliers_data = await Promise.all(
    supplierIds.map(async (id) => {
      const trendData = await getSupplierTrendData(id, period);
      if (!trendData) return null;

      return {
        supplierId: trendData.supplierId,
        supplierName: trendData.supplierName,
        data: trendData.data,
      };
    })
  );

  return {
    suppliers: suppliers_data.filter((s) => s !== null) as Array<{
      supplierId: number;
      supplierName: string;
      data: TrendDataPoint[];
    }>,
    period,
  };
}

/**
 * Busca estatisticas agregadas de tendencia para um fornecedor
 */
export async function getSupplierTrendStats(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const evaluationsList = await db
    .select()
    .from(supplierEvaluations)
    .where(eq(supplierEvaluations.supplierId, supplierId))
    .orderBy(desc(supplierEvaluations.evaluatedAt));

  if (evaluationsList.length === 0) {
    return null;
  }

  // Ultimas 5 avaliacoes
  const recent = evaluationsList.slice(0, 5);
  const recentAvg =
    recent.reduce((sum, e) => sum + e.rating, 0) / recent.length;

  // Todas as avaliacoes
  const allAvg = evaluationsList.reduce((sum, e) => sum + e.rating, 0) / evaluationsList.length;

  // Tendencia
  let trend: "up" | "down" | "stable" = "stable";
  if (recentAvg > allAvg + 0.3) {
    trend = "up";
  } else if (recentAvg < allAvg - 0.3) {
    trend = "down";
  }

  return {
    supplierId,
    totalEvaluations: evaluationsList.length,
    recentAverage: Math.round(recentAvg * 100) / 100,
    overallAverage: Math.round(allAvg * 100) / 100,
    trend,
    bestRating: Math.max(...evaluationsList.map((e) => e.rating)),
    worstRating: Math.min(...evaluationsList.map((e) => e.rating)),
    lastEvaluationDate: evaluationsList[0]?.evaluatedAt,
  };
}
