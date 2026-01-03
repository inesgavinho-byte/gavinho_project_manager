import { getDb } from "./db";
import { suppliers, supplierTransactions, supplierEvaluations, orders } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface SupplierKPIs {
  supplierId: number;
  supplierName: string;
  
  // Quality metrics
  averageQualityRating: number;
  averageDeliveryRating: number;
  averageCommunicationRating: number;
  averagePriceRating: number;
  overallRating: number;
  totalEvaluations: number;
  recommendationRate: number; // Percentage of "would recommend"
  
  // Financial metrics
  totalTransactions: number;
  totalSpent: number;
  averageTransactionValue: number;
  pendingPayments: number;
  
  // Delivery performance
  onTimeDeliveryRate: number; // Percentage of orders delivered on time
  averageDeliveryDelay: number; // Average days of delay
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  
  // Ranking
  rankScore: number; // Calculated composite score for ranking
}

export interface SupplierRanking {
  rank: number;
  supplierId: number;
  supplierName: string;
  rankScore: number;
  overallRating: number;
  onTimeDeliveryRate: number;
  totalOrders: number;
  totalSpent: number;
}

/**
 * Calculate comprehensive KPIs for a supplier
 */
export async function calculateSupplierKPIs(supplierId: number): Promise<SupplierKPIs | null> {
  const db = await getDb();
  if (!db) return null;

  // Get supplier info
  const supplier = await db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
  if (supplier.length === 0) return null;

  // Get evaluation metrics
  const evaluations = await db
    .select()
    .from(supplierEvaluations)
    .where(eq(supplierEvaluations.supplierId, supplierId));

  const totalEvaluations = evaluations.length;
  const avgQuality = totalEvaluations > 0 
    ? evaluations.reduce((sum, e) => sum + e.qualityRating, 0) / totalEvaluations 
    : 0;
  const avgDelivery = totalEvaluations > 0 
    ? evaluations.reduce((sum, e) => sum + e.deliveryRating, 0) / totalEvaluations 
    : 0;
  const avgCommunication = totalEvaluations > 0 
    ? evaluations.reduce((sum, e) => sum + e.communicationRating, 0) / totalEvaluations 
    : 0;
  const avgPrice = totalEvaluations > 0 
    ? evaluations.reduce((sum, e) => sum + e.priceRating, 0) / totalEvaluations 
    : 0;
  const avgOverall = totalEvaluations > 0 
    ? evaluations.reduce((sum, e) => sum + e.overallRating, 0) / totalEvaluations 
    : 0;
  const recommendCount = evaluations.filter(e => e.wouldRecommend).length;
  const recommendationRate = totalEvaluations > 0 ? (recommendCount / totalEvaluations) * 100 : 0;

  // Get financial metrics
  const transactions = await db
    .select()
    .from(supplierTransactions)
    .where(eq(supplierTransactions.supplierId, supplierId));

  const totalTransactions = transactions.length;
  const totalSpent = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const avgTransactionValue = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
  const pendingPayments = transactions
    .filter(t => t.status === "pending")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  // Get delivery performance
  const supplierOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.supplierId, supplierId));

  const totalOrders = supplierOrders.length;
  const completedOrders = supplierOrders.filter(o => o.status === "delivered").length;
  const cancelledOrders = supplierOrders.filter(o => o.status === "cancelled").length;

  // Calculate on-time delivery rate
  let onTimeCount = 0;
  let totalDelay = 0;
  let delayCount = 0;

  for (const order of supplierOrders) {
    if (order.status === "delivered" && order.expectedDeliveryDate && order.actualDeliveryDate) {
      const expected = new Date(order.expectedDeliveryDate).getTime();
      const actual = new Date(order.actualDeliveryDate).getTime();
      const delayDays = (actual - expected) / (1000 * 60 * 60 * 24);

      if (delayDays <= 0) {
        onTimeCount++;
      } else {
        totalDelay += delayDays;
        delayCount++;
      }
    }
  }

  const onTimeDeliveryRate = completedOrders > 0 ? (onTimeCount / completedOrders) * 100 : 0;
  const averageDeliveryDelay = delayCount > 0 ? totalDelay / delayCount : 0;

  // Calculate composite rank score (0-100)
  // Weights: Quality 30%, Delivery 30%, Price 20%, Communication 10%, Recommendation 10%
  const rankScore = (
    avgQuality * 6 +           // 30% (5 * 6 = 30)
    avgDelivery * 6 +          // 30%
    avgPrice * 4 +             // 20%
    avgCommunication * 2 +     // 10%
    (recommendationRate / 20)  // 10% (100% recommendation = 5 points)
  );

  return {
    supplierId,
    supplierName: supplier[0]!.name,
    averageQualityRating: Math.round(avgQuality * 10) / 10,
    averageDeliveryRating: Math.round(avgDelivery * 10) / 10,
    averageCommunicationRating: Math.round(avgCommunication * 10) / 10,
    averagePriceRating: Math.round(avgPrice * 10) / 10,
    overallRating: Math.round(avgOverall * 10) / 10,
    totalEvaluations,
    recommendationRate: Math.round(recommendationRate * 10) / 10,
    totalTransactions,
    totalSpent: Math.round(totalSpent * 100) / 100,
    averageTransactionValue: Math.round(avgTransactionValue * 100) / 100,
    pendingPayments: Math.round(pendingPayments * 100) / 100,
    onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
    averageDeliveryDelay: Math.round(averageDeliveryDelay * 10) / 10,
    totalOrders,
    completedOrders,
    cancelledOrders,
    rankScore: Math.round(rankScore * 10) / 10,
  };
}

/**
 * Get supplier rankings
 */
export async function getSupplierRankings(): Promise<SupplierRanking[]> {
  const db = await getDb();
  if (!db) return [];

  const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.isActive, true));
  
  const rankings: SupplierRanking[] = [];

  for (const supplier of allSuppliers) {
    const kpis = await calculateSupplierKPIs(supplier.id);
    if (kpis) {
      rankings.push({
        rank: 0, // Will be set after sorting
        supplierId: kpis.supplierId,
        supplierName: kpis.supplierName,
        rankScore: kpis.rankScore,
        overallRating: kpis.overallRating,
        onTimeDeliveryRate: kpis.onTimeDeliveryRate,
        totalOrders: kpis.totalOrders,
        totalSpent: kpis.totalSpent,
      });
    }
  }

  // Sort by rank score descending
  rankings.sort((a, b) => b.rankScore - a.rankScore);

  // Assign ranks
  rankings.forEach((ranking, index) => {
    ranking.rank = index + 1;
  });

  return rankings;
}

/**
 * Get top suppliers by criteria
 */
export async function getTopSuppliers(criteria: "quality" | "delivery" | "price" | "overall", limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.isActive, true));
  
  const suppliersWithKPIs = [];

  for (const supplier of allSuppliers) {
    const kpis = await calculateSupplierKPIs(supplier.id);
    if (kpis && kpis.totalEvaluations > 0) {
      suppliersWithKPIs.push(kpis);
    }
  }

  // Sort based on criteria
  switch (criteria) {
    case "quality":
      suppliersWithKPIs.sort((a, b) => b.averageQualityRating - a.averageQualityRating);
      break;
    case "delivery":
      suppliersWithKPIs.sort((a, b) => b.averageDeliveryRating - a.averageDeliveryRating);
      break;
    case "price":
      suppliersWithKPIs.sort((a, b) => b.averagePriceRating - a.averagePriceRating);
      break;
    case "overall":
    default:
      suppliersWithKPIs.sort((a, b) => b.overallRating - a.overallRating);
      break;
  }

  return suppliersWithKPIs.slice(0, limit);
}

/**
 * Compare multiple suppliers
 */
export async function compareSuppliers(supplierIds: number[]): Promise<SupplierKPIs[]> {
  const comparisons: SupplierKPIs[] = [];

  for (const supplierId of supplierIds) {
    const kpis = await calculateSupplierKPIs(supplierId);
    if (kpis) {
      comparisons.push(kpis);
    }
  }

  return comparisons;
}
