import { db } from './db';
import { emailMetrics, emailTrackingEvents } from '../drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface RecipientSegment {
  id: string;
  name: string;
  description?: string;
  type: 'client_type' | 'project_type' | 'region' | 'custom';
  criteria: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentMetrics {
  segmentId: string;
  segmentName: string;
  totalRecipients: number;
  totalEmails: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalDropped: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  uniqueOpens: number;
  uniqueClicks: number;
  averageOpenTime?: number;
  averageClickTime?: number;
  topLinks?: Array<{ url: string; clicks: number }>;
  topEmails?: Array<{ email: string; opens: number; clicks: number }>;
}

export interface RecipientEngagement {
  email: string;
  segmentId: string;
  opens: number;
  clicks: number;
  bounces: number;
  dropped: number;
  delivered: number;
  firstEventAt?: Date;
  lastEventAt?: Date;
  engagementScore: number; // 0-100
}

/**
 * Calcula métricas agregadas para um segmento específico
 */
export async function calculateSegmentMetrics(
  segmentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<SegmentMetrics | null> {
  try {
    // Buscar informações do segmento
    const segment = await db.query.recipientSegments.findFirst({
      where: eq(db.schema.recipientSegments.id, segmentId),
    });

    if (!segment) {
      return null;
    }

    // Buscar destinatários do segmento
    const segmentMembers = await db.query.segmentMembers.findMany({
      where: eq(db.schema.segmentMembers.segmentId, segmentId),
    });

    const memberEmails = segmentMembers.map((m) => m.email);

    if (memberEmails.length === 0) {
      return {
        segmentId,
        segmentName: segment.name,
        totalRecipients: 0,
        totalEmails: 0,
        totalOpens: 0,
        totalClicks: 0,
        totalBounces: 0,
        totalDropped: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
      };
    }

    // Construir condições de data
    const dateConditions = [];
    if (startDate) {
      dateConditions.push(gte(emailTrackingEvents.timestamp, startDate));
    }
    if (endDate) {
      dateConditions.push(lte(emailTrackingEvents.timestamp, endDate));
    }

    // Buscar eventos de rastreamento para o segmento
    const events = await db
      .select()
      .from(emailTrackingEvents)
      .where(
        and(
          sql`${emailTrackingEvents.email} IN (${sql.raw(memberEmails.map((e) => `'${e}'`).join(','))})`,
          ...dateConditions
        )
      );

    // Buscar métricas agregadas
    const metrics = await db
      .select()
      .from(emailMetrics)
      .where(
        sql`${emailMetrics.email} IN (${sql.raw(memberEmails.map((e) => `'${e}'`).join(','))})`
      );

    // Calcular agregações
    const totalOpens = metrics.reduce((sum, m) => sum + (m.opens || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalBounces = metrics.reduce((sum, m) => sum + (m.bounces || 0), 0);
    const totalDropped = metrics.reduce((sum, m) => sum + (m.dropped || 0), 0);
    const totalDelivered = metrics.reduce((sum, m) => sum + (m.delivered || 0), 0);
    const totalEmails = totalDelivered + totalBounces + totalDropped;

    const uniqueOpens = metrics.filter((m) => m.opens > 0).length;
    const uniqueClicks = metrics.filter((m) => m.clicks > 0).length;

    const openRate = totalEmails > 0 ? (totalOpens / totalEmails) * 100 : 0;
    const clickRate = totalEmails > 0 ? (totalClicks / totalEmails) * 100 : 0;
    const bounceRate = totalEmails > 0 ? (totalBounces / totalEmails) * 100 : 0;

    // Buscar links mais clicados
    const topLinks = await getTopClickedLinks(memberEmails, 5);

    // Buscar destinatários mais engajados
    const topEmails = metrics
      .sort((a, b) => (b.opens || 0) + (b.clicks || 0) - ((a.opens || 0) + (a.clicks || 0)))
      .slice(0, 5)
      .map((m) => ({
        email: m.email,
        opens: m.opens || 0,
        clicks: m.clicks || 0,
      }));

    return {
      segmentId,
      segmentName: segment.name,
      totalRecipients: memberEmails.length,
      totalEmails,
      totalOpens,
      totalClicks,
      totalBounces,
      totalDropped,
      openRate,
      clickRate,
      bounceRate,
      uniqueOpens,
      uniqueClicks,
      topLinks,
      topEmails,
    };
  } catch (error) {
    console.error('Erro ao calcular métricas do segmento:', error);
    throw error;
  }
}

/**
 * Busca links mais clicados em um segmento
 */
async function getTopClickedLinks(
  emails: string[],
  limit: number = 5
): Promise<Array<{ url: string; clicks: number }>> {
  try {
    const events = await db
      .select({
        url: emailTrackingEvents.url,
        count: sql<number>`COUNT(*)`,
      })
      .from(emailTrackingEvents)
      .where(
        and(
          sql`${emailTrackingEvents.email} IN (${sql.raw(emails.map((e) => `'${e}'`).join(','))})`,
          eq(emailTrackingEvents.eventType, 'click'),
          sql`${emailTrackingEvents.url} IS NOT NULL`
        )
      )
      .groupBy(emailTrackingEvents.url)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit);

    return events.map((e) => ({
      url: e.url || '',
      clicks: e.count,
    }));
  } catch (error) {
    console.error('Erro ao buscar links mais clicados:', error);
    return [];
  }
}

/**
 * Calcula engajamento individual de um destinatário
 */
export function calculateEngagementScore(engagement: RecipientEngagement): number {
  // Fórmula: (opens * 10 + clicks * 20) / max_possible_score * 100
  const maxScore = 100;
  const score = Math.min((engagement.opens * 10 + engagement.clicks * 20) / maxScore * 100, 100);
  return Math.round(score);
}

/**
 * Compara métricas entre dois segmentos
 */
export async function compareSegments(
  segmentId1: string,
  segmentId2: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  segment1: SegmentMetrics | null;
  segment2: SegmentMetrics | null;
  comparison: {
    openRateDiff: number;
    clickRateDiff: number;
    bounceRateDiff: number;
    winner: 'segment1' | 'segment2' | 'tie';
  };
}> {
  const metrics1 = await calculateSegmentMetrics(segmentId1, startDate, endDate);
  const metrics2 = await calculateSegmentMetrics(segmentId2, startDate, endDate);

  if (!metrics1 || !metrics2) {
    return {
      segment1: metrics1,
      segment2: metrics2,
      comparison: {
        openRateDiff: 0,
        clickRateDiff: 0,
        bounceRateDiff: 0,
        winner: 'tie',
      },
    };
  }

  const openRateDiff = metrics1.openRate - metrics2.openRate;
  const clickRateDiff = metrics1.clickRate - metrics2.clickRate;
  const bounceRateDiff = metrics2.bounceRate - metrics1.bounceRate; // Menor é melhor

  const score1 = openRateDiff + clickRateDiff + bounceRateDiff;
  const winner = score1 > 0 ? 'segment1' : score1 < 0 ? 'segment2' : 'tie';

  return {
    segment1: metrics1,
    segment2: metrics2,
    comparison: {
      openRateDiff,
      clickRateDiff,
      bounceRateDiff,
      winner,
    },
  };
}

/**
 * Identifica destinatários de alto engajamento em um segmento
 */
export async function getHighEngagementRecipients(
  segmentId: string,
  threshold: number = 50 // Engajamento acima de 50
): Promise<RecipientEngagement[]> {
  try {
    const segmentMembers = await db.query.segmentMembers.findMany({
      where: eq(db.schema.segmentMembers.segmentId, segmentId),
    });

    const memberEmails = segmentMembers.map((m) => m.email);

    const metrics = await db
      .select()
      .from(emailMetrics)
      .where(
        sql`${emailMetrics.email} IN (${sql.raw(memberEmails.map((e) => `'${e}'`).join(','))})`
      );

    const engagements = metrics
      .map((m) => ({
        email: m.email,
        segmentId,
        opens: m.opens || 0,
        clicks: m.clicks || 0,
        bounces: m.bounces || 0,
        dropped: m.dropped || 0,
        delivered: m.delivered || 0,
        firstEventAt: m.firstEventAt,
        lastEventAt: m.lastEventAt,
        engagementScore: calculateEngagementScore({
          email: m.email,
          segmentId,
          opens: m.opens || 0,
          clicks: m.clicks || 0,
          bounces: m.bounces || 0,
          dropped: m.dropped || 0,
          delivered: m.delivered || 0,
        }),
      }))
      .filter((e) => e.engagementScore >= threshold)
      .sort((a, b) => b.engagementScore - a.engagementScore);

    return engagements;
  } catch (error) {
    console.error('Erro ao buscar destinatários de alto engajamento:', error);
    return [];
  }
}

/**
 * Identifica destinatários inativos em um segmento
 */
export async function getInactiveRecipients(
  segmentId: string,
  daysInactive: number = 30
): Promise<RecipientEngagement[]> {
  try {
    const segmentMembers = await db.query.segmentMembers.findMany({
      where: eq(db.schema.segmentMembers.segmentId, segmentId),
    });

    const memberEmails = segmentMembers.map((m) => m.email);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const metrics = await db
      .select()
      .from(emailMetrics)
      .where(
        and(
          sql`${emailMetrics.email} IN (${sql.raw(memberEmails.map((e) => `'${e}'`).join(','))})`,
          lte(emailMetrics.lastEventAt, cutoffDate)
        )
      );

    return metrics.map((m) => ({
      email: m.email,
      segmentId,
      opens: m.opens || 0,
      clicks: m.clicks || 0,
      bounces: m.bounces || 0,
      dropped: m.dropped || 0,
      delivered: m.delivered || 0,
      firstEventAt: m.firstEventAt,
      lastEventAt: m.lastEventAt,
      engagementScore: 0,
    }));
  } catch (error) {
    console.error('Erro ao buscar destinatários inativos:', error);
    return [];
  }
}
