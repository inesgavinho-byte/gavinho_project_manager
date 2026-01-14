import { getDb } from './db';
import { scheduledEmailReports, emailReportLogs, emailTracking, emailAnalytics } from '../drizzle/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

// ============================================
// EMAIL REPORT SERVICE
// ============================================

export interface CreateScheduledReportInput {
  projectId: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:MM
  recipients: string[];
  includeMetrics?: boolean;
  includeTrends?: boolean;
  includeAlerts?: boolean;
  includeInsights?: boolean;
  dateRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
}

// Criar relatório agendado
export async function createScheduledReport(input: CreateScheduledReportInput, userId: number) {
  const db = await getDb();
  
  // Calcular próxima data de envio
  const nextSendAt = calculateNextSendDate(input.frequency, input.dayOfWeek, input.dayOfMonth, input.time);
  
  return await db.insert(scheduledEmailReports).values({
    projectId: input.projectId,
    name: input.name,
    description: input.description,
    frequency: input.frequency,
    dayOfWeek: input.dayOfWeek,
    dayOfMonth: input.dayOfMonth,
    time: input.time,
    recipients: JSON.stringify(input.recipients),
    includeMetrics: input.includeMetrics ? 1 : 0,
    includeTrends: input.includeTrends ? 1 : 0,
    includeAlerts: input.includeAlerts ? 1 : 0,
    includeInsights: input.includeInsights ? 1 : 0,
    dateRange: input.dateRange || 'last_30_days',
    customStartDate: input.customStartDate ? new Date(input.customStartDate).toISOString().split('T')[0] : null,
    customEndDate: input.customEndDate ? new Date(input.customEndDate).toISOString().split('T')[0] : null,
    isActive: 1,
    nextSendAt: nextSendAt.toISOString(),
    createdBy: userId,
  });
}

// Gerar relatório de emails
export async function generateEmailReport(reportId: number, projectId: number) {
  const db = await getDb();
  
  const report = await db.select().from(scheduledEmailReports)
    .where(eq(scheduledEmailReports.id, reportId))
    .limit(1);

  if (!report[0]) throw new Error('Relatório não encontrado');

  // Obter período de dados
  const { startDate, endDate } = getDateRange(report[0].dateRange, report[0].customStartDate, report[0].customEndDate);

  // Obter dados de emails
  const emails = await db.select().from(emailTracking)
    .where(and(
      eq(emailTracking.projectId, projectId),
      gte(emailTracking.sentAt, startDate.toISOString()),
      lte(emailTracking.sentAt, endDate.toISOString())
    ));

  // Obter dados de análise
  const analytics = await db.select().from(emailAnalytics)
    .where(and(
      eq(emailAnalytics.projectId, projectId),
      gte(emailAnalytics.date, startDate.toISOString().split('T')[0]),
      lte(emailAnalytics.date, endDate.toISOString().split('T')[0])
    ));

  // Compilar dados do relatório
  const reportData = {
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    summary: {
      totalEmails: emails.length,
      delivered: emails.filter(e => e.status === 'delivered').length,
      bounced: emails.filter(e => e.status === 'bounced').length,
      failed: emails.filter(e => e.status === 'failed').length,
      opened: emails.filter(e => e.openedAt).length,
      clicked: emails.filter(e => e.clickedAt).length,
    },
    metrics: report[0].includeMetrics ? calculateMetrics(analytics) : null,
    trends: report[0].includeTrends ? calculateTrends(analytics) : null,
    insights: report[0].includeInsights ? await generateInsights(emails, analytics, projectId) : null,
  };

  return reportData;
}

// Enviar relatório por email
export async function sendScheduledReport(reportId: number, projectId: number) {
  const db = await getDb();
  
  const report = await db.select().from(scheduledEmailReports)
    .where(eq(scheduledEmailReports.id, reportId))
    .limit(1);

  if (!report[0]) throw new Error('Relatório não encontrado');

  // Gerar dados do relatório
  const reportData = await generateEmailReport(reportId, projectId);
  
  // Preparar conteúdo do email
  const recipients = JSON.parse(report[0].recipients);
  const emailContent = formatReportEmail(report[0].name, reportData);

  // Enviar email (simulado)
  const sendResult = {
    success: true,
    emailsSent: recipients.length,
    emailsFailed: 0,
  };

  // Log do envio
  await db.insert(emailReportLogs).values({
    reportId,
    projectId,
    recipients: JSON.stringify(recipients),
    status: sendResult.success ? 'success' : 'failed',
    reportData: JSON.stringify(reportData),
    emailsSent: sendResult.emailsSent,
    emailsFailed: sendResult.emailsFailed,
  });

  // Atualizar próxima data de envio
  const nextSendAt = calculateNextSendDate(report[0].frequency, report[0].dayOfWeek, report[0].dayOfMonth, report[0].time);
  
  await db.update(scheduledEmailReports)
    .set({
      lastSentAt: new Date().toISOString(),
      nextSendAt: nextSendAt.toISOString(),
    })
    .where(eq(scheduledEmailReports.id, reportId));

  return sendResult;
}

// Obter relatórios agendados de um projeto
export async function getScheduledReports(projectId: number) {
  const db = await getDb();
  
  return await db.select().from(scheduledEmailReports)
    .where(eq(scheduledEmailReports.projectId, projectId))
    .orderBy(desc(scheduledEmailReports.createdAt));
}

// Obter histórico de envios de um relatório
export async function getReportSendHistory(reportId: number, limit = 20) {
  const db = await getDb();
  
  return await db.select().from(emailReportLogs)
    .where(eq(emailReportLogs.reportId, reportId))
    .orderBy(desc(emailReportLogs.sentAt))
    .limit(limit);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateNextSendDate(frequency: string, dayOfWeek?: number, dayOfMonth?: number, time?: string): Date {
  const now = new Date();
  const [hours, minutes] = time?.split(':').map(Number) || [9, 0];

  const nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);

  if (frequency === 'daily') {
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  } else if (frequency === 'weekly' && dayOfWeek !== undefined) {
    const currentDay = nextDate.getDay();
    let daysToAdd = dayOfWeek - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    nextDate.setDate(nextDate.getDate() + daysToAdd);
  } else if (frequency === 'monthly' && dayOfMonth !== undefined) {
    nextDate.setDate(dayOfMonth);
    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }

  return nextDate;
}

function getDateRange(dateRange: string, customStart?: string, customEnd?: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  if (dateRange === 'last_7_days') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (dateRange === 'last_30_days') {
    startDate.setDate(endDate.getDate() - 30);
  } else if (dateRange === 'last_90_days') {
    startDate.setDate(endDate.getDate() - 90);
  } else if (dateRange === 'custom' && customStart && customEnd) {
    return {
      startDate: new Date(customStart),
      endDate: new Date(customEnd),
    };
  }

  return { startDate, endDate };
}

function calculateMetrics(analytics: any[]) {
  if (analytics.length === 0) return null;

  const avgDeliveryRate = analytics.reduce((sum, a) => sum + (parseFloat(a.deliveryRate) || 0), 0) / analytics.length;
  const avgOpenRate = analytics.reduce((sum, a) => sum + (parseFloat(a.openRate) || 0), 0) / analytics.length;
  const avgClickRate = analytics.reduce((sum, a) => sum + (parseFloat(a.clickRate) || 0), 0) / analytics.length;
  const avgBounceRate = analytics.reduce((sum, a) => sum + (parseFloat(a.bounceRate) || 0), 0) / analytics.length;

  return {
    averageDeliveryRate: Math.round(avgDeliveryRate * 100) / 100,
    averageOpenRate: Math.round(avgOpenRate * 100) / 100,
    averageClickRate: Math.round(avgClickRate * 100) / 100,
    averageBounceRate: Math.round(avgBounceRate * 100) / 100,
  };
}

function calculateTrends(analytics: any[]) {
  if (analytics.length < 2) return null;

  const firstHalf = analytics.slice(0, Math.floor(analytics.length / 2));
  const secondHalf = analytics.slice(Math.floor(analytics.length / 2));

  const avgFirstDelivery = firstHalf.reduce((sum, a) => sum + (parseFloat(a.deliveryRate) || 0), 0) / firstHalf.length;
  const avgSecondDelivery = secondHalf.reduce((sum, a) => sum + (parseFloat(a.deliveryRate) || 0), 0) / secondHalf.length;

  return {
    deliveryTrend: avgSecondDelivery > avgFirstDelivery ? 'improving' : 'declining',
    deliveryChange: Math.round((avgSecondDelivery - avgFirstDelivery) * 100) / 100,
  };
}

async function generateInsights(emails: any[], analytics: any[], projectId: number) {
  // Usar IA para gerar insights
  const summary = `
    Total de emails: ${emails.length}
    Taxa média de entrega: ${(emails.filter(e => e.status === 'delivered').length / emails.length * 100).toFixed(2)}%
    Taxa média de abertura: ${(emails.filter(e => e.openedAt).length / emails.length * 100).toFixed(2)}%
  `;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de campanhas de email. Gere 3-4 insights acionáveis baseado nos dados fornecidos.',
        },
        {
          role: 'user',
          content: `Analise estes dados de email e forneça insights: ${summary}`,
        },
      ],
    });

    return {
      aiInsights: response.choices[0].message.content,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      aiInsights: 'Insights de IA não disponíveis no momento',
      generatedAt: new Date().toISOString(),
    };
  }
}

function formatReportEmail(reportName: string, reportData: any): string {
  return `
    <h2>${reportName}</h2>
    <p>Período: ${reportData.period.startDate} a ${reportData.period.endDate}</p>
    
    <h3>Resumo</h3>
    <ul>
      <li>Total de emails: ${reportData.summary.totalEmails}</li>
      <li>Entregues: ${reportData.summary.delivered}</li>
      <li>Abertos: ${reportData.summary.opened}</li>
      <li>Clicados: ${reportData.summary.clicked}</li>
      <li>Rejeitados: ${reportData.summary.bounced}</li>
      <li>Falhados: ${reportData.summary.failed}</li>
    </ul>

    ${reportData.metrics ? `
      <h3>Métricas</h3>
      <ul>
        <li>Taxa de entrega: ${reportData.metrics.averageDeliveryRate}%</li>
        <li>Taxa de abertura: ${reportData.metrics.averageOpenRate}%</li>
        <li>Taxa de clique: ${reportData.metrics.averageClickRate}%</li>
        <li>Taxa de rejeição: ${reportData.metrics.averageBounceRate}%</li>
      </ul>
    ` : ''}

    ${reportData.insights ? `
      <h3>Insights de IA</h3>
      <p>${reportData.insights.aiInsights}</p>
    ` : ''}
  `;
}
