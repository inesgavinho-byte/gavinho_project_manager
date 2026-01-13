import { db } from '../db';
import { emailHistory, sendgridWebhooks } from '../../drizzle/schema';
import { eq, gte, lte, like, and, count, sql } from 'drizzle-orm';

export interface EmailHistoryQuery {
  projectId?: string;
  eventType?: 'delivery' | 'adjudication' | 'payment';
  status?: 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked';
  startDate?: Date;
  endDate?: Date;
  recipientEmail?: string;
  limit?: number;
  offset?: number;
}

export interface EmailStatistics {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  deliveryRate: number;
  bounceRate: number;
  openRate: number;
  clickRate: number;
  avgDeliveryTime: number;
}

export interface EmailHistoryRecord {
  id: string;
  projectId: string;
  eventType: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: string;
  sentAt: Date;
  deliveredAt: Date | null;
  bouncedAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  bounceReason?: string;
  failureReason?: string;
}

/**
 * Serviço de histórico de emails com análise de status de entrega
 */
export class EmailHistoryService {
  /**
   * Obter histórico de emails com filtros
   */
  static async getEmailHistory(query: EmailHistoryQuery): Promise<EmailHistoryRecord[]> {
    const {
      projectId,
      eventType,
      status,
      startDate,
      endDate,
      recipientEmail,
      limit = 50,
      offset = 0,
    } = query;

    let whereConditions = [];

    if (projectId) {
      whereConditions.push(eq(emailHistory.projectId, projectId));
    }

    if (eventType) {
      whereConditions.push(eq(emailHistory.eventType, eventType));
    }

    if (status) {
      whereConditions.push(eq(emailHistory.status, status));
    }

    if (startDate) {
      whereConditions.push(gte(emailHistory.sentAt, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(emailHistory.sentAt, endDate));
    }

    if (recipientEmail) {
      whereConditions.push(like(emailHistory.recipientEmail, `%${recipientEmail}%`));
    }

    const records = await db
      .select()
      .from(emailHistory)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(emailHistory.sentAt)
      .limit(limit)
      .offset(offset);

    return records as EmailHistoryRecord[];
  }

  /**
   * Obter estatísticas de emails
   */
  static async getEmailStatistics(projectId?: string): Promise<EmailStatistics> {
    const whereCondition = projectId ? eq(emailHistory.projectId, projectId) : undefined;

    // Contar por status
    const [
      totalSentResult,
      totalDeliveredResult,
      totalBouncedResult,
      totalFailedResult,
      totalOpenedResult,
      totalClickedResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(emailHistory)
        .where(whereCondition),
      db
        .select({ count: count() })
        .from(emailHistory)
        .where(whereCondition ? and(whereCondition, eq(emailHistory.status, 'delivered')) : eq(emailHistory.status, 'delivered')),
      db
        .select({ count: count() })
        .from(emailHistory)
        .where(whereCondition ? and(whereCondition, eq(emailHistory.status, 'bounced')) : eq(emailHistory.status, 'bounced')),
      db
        .select({ count: count() })
        .from(emailHistory)
        .where(whereCondition ? and(whereCondition, eq(emailHistory.status, 'failed')) : eq(emailHistory.status, 'failed')),
      db
        .select({ count: count() })
        .from(emailHistory)
        .where(whereCondition ? and(whereCondition, eq(emailHistory.status, 'opened')) : eq(emailHistory.status, 'opened')),
      db
        .select({ count: count() })
        .from(emailHistory)
        .where(whereCondition ? and(whereCondition, eq(emailHistory.status, 'clicked')) : eq(emailHistory.status, 'clicked')),
    ]);

    const totalSent = totalSentResult[0]?.count || 0;
    const totalDelivered = totalDeliveredResult[0]?.count || 0;
    const totalBounced = totalBouncedResult[0]?.count || 0;
    const totalFailed = totalFailedResult[0]?.count || 0;
    const totalOpened = totalOpenedResult[0]?.count || 0;
    const totalClicked = totalClickedResult[0]?.count || 0;

    // Calcular taxas
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

    // Tempo médio de entrega
    const avgDeliveryTimeResult = await db
      .select({
        avgTime: sql`AVG(UNIX_TIMESTAMP(${emailHistory.deliveredAt}) - UNIX_TIMESTAMP(${emailHistory.sentAt}))`,
      })
      .from(emailHistory)
      .where(
        whereCondition
          ? and(whereCondition, eq(emailHistory.status, 'delivered'))
          : eq(emailHistory.status, 'delivered')
      );

    const avgDeliveryTime = (avgDeliveryTimeResult[0]?.avgTime as number) || 0;

    return {
      totalSent,
      totalDelivered,
      totalBounced,
      totalFailed,
      totalOpened,
      totalClicked,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      avgDeliveryTime: Math.round(avgDeliveryTime),
    };
  }

  /**
   * Obter estatísticas por tipo de evento
   */
  static async getStatisticsByEventType(projectId?: string) {
    const whereCondition = projectId ? eq(emailHistory.projectId, projectId) : undefined;

    const results = await db
      .select({
        eventType: emailHistory.eventType,
        totalSent: count(),
        totalDelivered: sql`SUM(CASE WHEN ${emailHistory.status} = 'delivered' THEN 1 ELSE 0 END)`,
        totalBounced: sql`SUM(CASE WHEN ${emailHistory.status} = 'bounced' THEN 1 ELSE 0 END)`,
        totalFailed: sql`SUM(CASE WHEN ${emailHistory.status} = 'failed' THEN 1 ELSE 0 END)`,
      })
      .from(emailHistory)
      .where(whereCondition)
      .groupBy(emailHistory.eventType);

    return results.map((row) => ({
      eventType: row.eventType,
      totalSent: row.totalSent,
      deliveryRate: row.totalSent > 0 ? ((row.totalDelivered as number) / row.totalSent) * 100 : 0,
      bounceRate: row.totalSent > 0 ? ((row.totalBounced as number) / row.totalSent) * 100 : 0,
      failureRate: row.totalSent > 0 ? ((row.totalFailed as number) / row.totalSent) * 100 : 0,
    }));
  }

  /**
   * Obter estatísticas por data
   */
  static async getStatisticsByDate(projectId?: string, days = 30) {
    const whereCondition = projectId ? eq(emailHistory.projectId, projectId) : undefined;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await db
      .select({
        date: sql`DATE(${emailHistory.sentAt})`,
        totalSent: count(),
        totalDelivered: sql`SUM(CASE WHEN ${emailHistory.status} = 'delivered' THEN 1 ELSE 0 END)`,
        totalBounced: sql`SUM(CASE WHEN ${emailHistory.status} = 'bounced' THEN 1 ELSE 0 END)`,
      })
      .from(emailHistory)
      .where(
        whereCondition
          ? and(whereCondition, gte(emailHistory.sentAt, startDate))
          : gte(emailHistory.sentAt, startDate)
      )
      .groupBy(sql`DATE(${emailHistory.sentAt})`)
      .orderBy(sql`DATE(${emailHistory.sentAt})`);

    return results;
  }

  /**
   * Obter bounce reasons
   */
  static async getBounceReasons(projectId?: string) {
    const whereCondition = projectId
      ? and(eq(emailHistory.projectId, projectId), eq(emailHistory.status, 'bounced'))
      : eq(emailHistory.status, 'bounced');

    const results = await db
      .select({
        reason: emailHistory.bounceReason,
        count: count(),
      })
      .from(emailHistory)
      .where(whereCondition)
      .groupBy(emailHistory.bounceReason)
      .orderBy(sql`count DESC`);

    return results;
  }

  /**
   * Registrar envio de email
   */
  static async logEmailSent(data: {
    projectId: string;
    eventType: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    messageId: string;
  }) {
    const now = new Date();

    await db.insert(emailHistory).values({
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: data.projectId,
      eventType: data.eventType,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      subject: data.subject,
      status: 'sent',
      messageId: data.messageId,
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Atualizar status de email via webhook
   */
  static async updateEmailStatus(
    messageId: string,
    status: string,
    metadata?: {
      bounceReason?: string;
      failureReason?: string;
      timestamp?: Date;
    }
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (metadata?.bounceReason) {
      updateData.bounceReason = metadata.bounceReason;
      updateData.bouncedAt = metadata.timestamp || new Date();
    }

    if (metadata?.failureReason) {
      updateData.failureReason = metadata.failureReason;
    }

    if (status === 'delivered') {
      updateData.deliveredAt = metadata?.timestamp || new Date();
    }

    if (status === 'opened') {
      updateData.openedAt = metadata?.timestamp || new Date();
    }

    if (status === 'clicked') {
      updateData.clickedAt = metadata?.timestamp || new Date();
    }

    await db
      .update(emailHistory)
      .set(updateData)
      .where(eq(emailHistory.messageId, messageId));
  }
}
