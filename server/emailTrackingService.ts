/**
 * Email Tracking Service - SendGrid Webhooks
 * 
 * Processa eventos de email do SendGrid (opens, clicks, bounces, etc)
 * e persiste dados de rastreamento para análise
 */

import { getDb } from './db';
import { emailTrackingEvents, emailMetrics } from '../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface SendGridEvent {
  event: 'open' | 'click' | 'bounce' | 'dropped' | 'delivered' | 'deferred' | 'unsubscribe' | 'group_unsubscribe' | 'spamreport' | 'processed';
  email: string;
  timestamp: number;
  'message-id': string;
  'smtp-id': string;
  sg_event_id: string;
  sg_message_id: string;
  reason?: string;
  status?: string;
  response?: string;
  attempt?: number;
  url?: string;
  useragent?: string;
  ip?: string;
  category?: string[];
  [key: string]: any;
}

/**
 * Processar evento de email do SendGrid
 */
export async function processEmailEvent(event: SendGridEvent): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[EmailTracking] Database not available');
      return;
    }

    const eventTimestamp = new Date(event.timestamp * 1000);

    // Inserir evento de rastreamento
    await db.insert(emailTrackingEvents).values({
      messageId: event['message-id'] || event.sg_message_id,
      email: event.email,
      eventType: event.event,
      timestamp: eventTimestamp,
      url: event.url || null,
      userAgent: event.useragent || null,
      ip: event.ip || null,
      reason: event.reason || null,
      status: event.status || null,
      response: event.response || null,
      attempt: event.attempt || null,
      metadata: JSON.stringify({
        smtpId: event['smtp-id'],
        sgEventId: event.sg_event_id,
        sgMessageId: event.sg_message_id,
        categories: event.category || [],
        ...event,
      }),
    });

    // Atualizar métricas agregadas
    await updateEmailMetrics(event);

    console.log(`[EmailTracking] Evento processado: ${event.event} para ${event.email}`);
  } catch (error) {
    console.error('[EmailTracking] Erro ao processar evento:', error);
    throw error;
  }
}

/**
 * Atualizar métricas agregadas de email
 */
async function updateEmailMetrics(event: SendGridEvent): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const messageId = event['message-id'] || event.sg_message_id;
    const email = event.email;

    // Buscar ou criar métrica
    const existingMetric = await db
      .select()
      .from(emailMetrics)
      .where(
        and(
          eq(emailMetrics.messageId, messageId),
          eq(emailMetrics.email, email)
        )
      )
      .limit(1);

    const baseMetric = {
      messageId,
      email,
      firstEventAt: new Date(event.timestamp * 1000),
      lastEventAt: new Date(event.timestamp * 1000),
    };

    if (!existingMetric || existingMetric.length === 0) {
      // Criar nova métrica
      const newMetric = {
        ...baseMetric,
        opens: event.event === 'open' ? 1 : 0,
        clicks: event.event === 'click' ? 1 : 0,
        bounces: event.event === 'bounce' ? 1 : 0,
        dropped: event.event === 'dropped' ? 1 : 0,
        delivered: event.event === 'delivered' ? 1 : 0,
        deferred: event.event === 'deferred' ? 1 : 0,
        unsubscribes: event.event === 'unsubscribe' ? 1 : 0,
        spamReports: event.event === 'spamreport' ? 1 : 0,
        lastEventType: event.event,
      };

      await db.insert(emailMetrics).values(newMetric);
    } else {
      // Atualizar métrica existente
      const metric = existingMetric[0];
      const updates: Record<string, any> = {
        lastEventAt: new Date(event.timestamp * 1000),
        lastEventType: event.event,
      };

      // Incrementar contador apropriado
      switch (event.event) {
        case 'open':
          updates.opens = (metric.opens || 0) + 1;
          break;
        case 'click':
          updates.clicks = (metric.clicks || 0) + 1;
          break;
        case 'bounce':
          updates.bounces = (metric.bounces || 0) + 1;
          break;
        case 'dropped':
          updates.dropped = (metric.dropped || 0) + 1;
          break;
        case 'delivered':
          updates.delivered = (metric.delivered || 0) + 1;
          break;
        case 'deferred':
          updates.deferred = (metric.deferred || 0) + 1;
          break;
        case 'unsubscribe':
          updates.unsubscribes = (metric.unsubscribes || 0) + 1;
          break;
        case 'spamreport':
          updates.spamReports = (metric.spamReports || 0) + 1;
          break;
      }

      await db
        .update(emailMetrics)
        .set(updates)
        .where(
          and(
            eq(emailMetrics.messageId, messageId),
            eq(emailMetrics.email, email)
          )
        );
    }
  } catch (error) {
    console.error('[EmailTracking] Erro ao atualizar métricas:', error);
  }
}

/**
 * Obter eventos de rastreamento de um email
 */
export async function getEmailEvents(
  messageId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const events = await db
      .select()
      .from(emailTrackingEvents)
      .where(eq(emailTrackingEvents.messageId, messageId))
      .limit(limit);

    return events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata as string) : {},
    }));
  } catch (error) {
    console.error('[EmailTracking] Erro ao obter eventos:', error);
    return [];
  }
}

/**
 * Obter métricas agregadas de um email
 */
export async function getEmailMetrics(messageId: string): Promise<any | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const metrics = await db
      .select()
      .from(emailMetrics)
      .where(eq(emailMetrics.messageId, messageId))
      .limit(1);

    return metrics.length > 0 ? metrics[0] : null;
  } catch (error) {
    console.error('[EmailTracking] Erro ao obter métricas:', error);
    return null;
  }
}

/**
 * Obter métricas agregadas de um relatório de email
 */
export async function getReportMetrics(
  reportId: number,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalDropped: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  uniqueOpens: number;
  uniqueClicks: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        totalSent: 0,
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

    // Construir query com filtros de data se fornecidos
    let query = db
      .select({
        totalSent: emailMetrics.messageId,
        totalOpens: emailMetrics.opens,
        totalClicks: emailMetrics.clicks,
        totalBounces: emailMetrics.bounces,
        totalDropped: emailMetrics.dropped,
      })
      .from(emailMetrics);

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(emailMetrics.firstEventAt, startDate),
          lte(emailMetrics.lastEventAt, endDate)
        )
      );
    }

    const metrics = await query;

    // Calcular agregações
    const totalSent = metrics.length;
    const totalOpens = metrics.reduce((sum, m) => sum + (m.totalOpens || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.totalClicks || 0), 0);
    const totalBounces = metrics.reduce((sum, m) => sum + (m.totalBounces || 0), 0);
    const totalDropped = metrics.reduce((sum, m) => sum + (m.totalDropped || 0), 0);

    return {
      totalSent,
      totalOpens,
      totalClicks,
      totalBounces,
      totalDropped,
      openRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounces / totalSent) * 100 : 0,
      uniqueOpens: metrics.filter(m => (m.totalOpens || 0) > 0).length,
      uniqueClicks: metrics.filter(m => (m.totalClicks || 0) > 0).length,
    };
  } catch (error) {
    console.error('[EmailTracking] Erro ao obter métricas do relatório:', error);
    return {
      totalSent: 0,
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
}

/**
 * Obter histórico de eventos por tipo
 */
export async function getEventsByType(
  eventType: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const events = await db
      .select()
      .from(emailTrackingEvents)
      .where(eq(emailTrackingEvents.eventType, eventType))
      .limit(limit);

    return events;
  } catch (error) {
    console.error('[EmailTracking] Erro ao obter eventos por tipo:', error);
    return [];
  }
}
