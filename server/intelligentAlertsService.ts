import { emailHistory, emailAnomalies, emailAlerts } from '../drizzle/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getDb } from './db';
import { invokeLLM } from './_core/llm';

export interface AnomalyPattern {
  type: 'high_rejection_rate' | 'domain_failure_pattern' | 'sender_reputation_issue' | 'unusual_volume' | 'time_pattern_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedDomain?: string;
  affectedSender?: string;
  confidence: number; // 0-100
  recommendation: string;
  detectedAt: Date;
  metrics?: {
    currentRate: number;
    historicalRate: number;
    threshold: number;
  };
}

export interface IntelligentAlert {
  id: number;
  projectId: number;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  affectedEmails: number;
  createdAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
}

/**
 * Detectar anomalias com IA analisando padrões de falha
 */
export async function detectAnomaliesWithAI(projectId: number): Promise<AnomalyPattern[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return [];
    }

    // Buscar emails dos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEmails = await db
      .select()
      .from(emailHistory)
      .where(
        and(
          eq(emailHistory.projectId, projectId),
          gte(emailHistory.sentAt, thirtyDaysAgo)
        )
      );

    if (recentEmails.length === 0) {
      return [];
    }

    const anomalies: AnomalyPattern[] = [];

    // 1. Detectar taxa alta de rejeição
    const rejectionRate = detectHighRejectionRate(recentEmails);
    if (rejectionRate) {
      anomalies.push(rejectionRate);
    }

    // 2. Detectar padrões de falha por domínio
    const domainPatterns = detectDomainFailurePatterns(recentEmails);
    anomalies.push(...domainPatterns);

    // 3. Detectar problemas de reputação de remetente
    const senderIssues = detectSenderReputationIssues(recentEmails);
    anomalies.push(...senderIssues);

    // 4. Detectar volume anormal
    const volumeAnomaly = detectUnusualVolume(recentEmails);
    if (volumeAnomaly) {
      anomalies.push(volumeAnomaly);
    }

    // 5. Detectar padrões de tempo
    const timePatterns = detectTimePatternAnomalies(recentEmails);
    anomalies.push(...timePatterns);

    // 6. Usar IA para gerar recomendações
    for (const anomaly of anomalies) {
      anomaly.recommendation = await generateAIRecommendation(anomaly);
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return [];
  }
}

/**
 * Detectar taxa alta de rejeição
 */
function detectHighRejectionRate(emails: any[]): AnomalyPattern | null {
  const total = emails.length;
  const rejected = emails.filter((e) => e.status === 'rejected').length;
  const rejectionRate = (rejected / total) * 100;

  // Se taxa de rejeição > 10%, é uma anomalia
  if (rejectionRate > 10) {
    return {
      type: 'high_rejection_rate',
      severity: rejectionRate > 25 ? 'critical' : rejectionRate > 15 ? 'high' : 'medium',
      description: `Taxa de rejeição de ${rejectionRate.toFixed(1)}% detectada (${rejected}/${total} emails)`,
      confidence: Math.min(100, rejectionRate * 2),
      recommendation: 'Verificar configuração de autenticação SPF/DKIM/DMARC',
      detectedAt: new Date(),
      metrics: {
        currentRate: rejectionRate,
        historicalRate: 5, // Assumir 5% como histórico
        threshold: 10,
      },
    };
  }

  return null;
}

/**
 * Detectar padrões de falha por domínio
 */
function detectDomainFailurePatterns(emails: any[]): AnomalyPattern[] {
  const domainStats: Record<string, { total: number; failed: number }> = {};

  emails.forEach((email) => {
    if (!email.recipientEmail) return;
    const domain = email.recipientEmail.split('@')[1];
    if (!domain) return;

    if (!domainStats[domain]) {
      domainStats[domain] = { total: 0, failed: 0 };
    }

    domainStats[domain].total++;
    if (['rejected', 'bounced', 'failed'].includes(email.status)) {
      domainStats[domain].failed++;
    }
  });

  const anomalies: AnomalyPattern[] = [];

  Object.entries(domainStats).forEach(([domain, stats]) => {
    const failureRate = (stats.failed / stats.total) * 100;

    // Se taxa de falha > 20% para um domínio específico
    if (failureRate > 20 && stats.total >= 5) {
      anomalies.push({
        type: 'domain_failure_pattern',
        severity: failureRate > 50 ? 'critical' : failureRate > 30 ? 'high' : 'medium',
        description: `Domínio ${domain} com ${failureRate.toFixed(1)}% de falha (${stats.failed}/${stats.total})`,
        affectedDomain: domain,
        confidence: Math.min(100, failureRate),
        recommendation: `Verificar se ${domain} tem filtros rigorosos ou lista negra`,
        detectedAt: new Date(),
        metrics: {
          currentRate: failureRate,
          historicalRate: 5,
          threshold: 20,
        },
      });
    }
  });

  return anomalies;
}

/**
 * Detectar problemas de reputação de remetente
 */
function detectSenderReputationIssues(emails: any[]): AnomalyPattern[] {
  const senderStats: Record<string, { total: number; bounced: number; complained: number }> = {};

  emails.forEach((email) => {
    if (!email.senderEmail) return;

    if (!senderStats[email.senderEmail]) {
      senderStats[email.senderEmail] = { total: 0, bounced: 0, complained: 0 };
    }

    senderStats[email.senderEmail].total++;
    if (email.status === 'bounced') {
      senderStats[email.senderEmail].bounced++;
    }
    if (email.eventType === 'complaint') {
      senderStats[email.senderEmail].complained++;
    }
  });

  const anomalies: AnomalyPattern[] = [];

  Object.entries(senderStats).forEach(([sender, stats]) => {
    const bouncedRate = (stats.bounced / stats.total) * 100;
    const complaintRate = (stats.complained / stats.total) * 100;

    if ((bouncedRate > 5 || complaintRate > 1) && stats.total >= 10) {
      anomalies.push({
        type: 'sender_reputation_issue',
        severity: bouncedRate > 15 || complaintRate > 3 ? 'high' : 'medium',
        description: `Remetente ${sender} com problemas de reputação (${bouncedRate.toFixed(1)}% bounces, ${complaintRate.toFixed(1)}% reclamações)`,
        affectedSender: sender,
        confidence: Math.min(100, bouncedRate + complaintRate),
        recommendation: `Verificar lista de supressão e considerar aquecimento de IP`,
        detectedAt: new Date(),
      });
    }
  });

  return anomalies;
}

/**
 * Detectar volume anormal
 */
function detectUnusualVolume(emails: any[]): AnomalyPattern | null {
  const now = new Date();
  const today = emails.filter((e) => {
    const emailDate = new Date(e.sentAt);
    return emailDate.toDateString() === now.toDateString();
  }).length;

  const lastWeekAvg = emails.length / 30; // Média diária dos últimos 30 dias

  // Se volume de hoje > 3x a média diária
  if (today > lastWeekAvg * 3) {
    return {
      type: 'unusual_volume',
      severity: 'medium',
      description: `Volume anormal de emails hoje: ${today} (média diária: ${lastWeekAvg.toFixed(0)})`,
      confidence: 75,
      recommendation: `Verificar se há campanhas não planeadas ou loops de envio`,
      detectedAt: new Date(),
    };
  }

  return null;
}

/**
 * Detectar padrões de tempo anormais
 */
function detectTimePatternAnomalies(emails: any[]): AnomalyPattern[] {
  const hourStats: Record<number, number> = {};

  emails.forEach((email) => {
    const hour = new Date(email.sentAt).getHours();
    hourStats[hour] = (hourStats[hour] || 0) + 1;
  });

  const anomalies: AnomalyPattern[] = [];
  const avgPerHour = emails.length / 24;

  Object.entries(hourStats).forEach(([hour, count]) => {
    // Se uma hora tem > 5x a média
    if (count > avgPerHour * 5) {
      anomalies.push({
        type: 'time_pattern_anomaly',
        severity: 'low',
        description: `Pico de envios às ${hour}:00 (${count} emails, média: ${avgPerHour.toFixed(0)})`,
        confidence: 60,
        recommendation: `Verificar se há jobs agendados ou campanhas automáticas nesse horário`,
        detectedAt: new Date(),
      });
    }
  });

  return anomalies;
}

/**
 * Gerar recomendação com IA
 */
async function generateAIRecommendation(anomaly: AnomalyPattern): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em entrega de emails. Forneça uma recomendação concisa e acionável para resolver a anomalia detectada.',
        },
        {
          role: 'user',
          content: `Anomalia: ${anomaly.description}\nTipo: ${anomaly.type}\nSeveridade: ${anomaly.severity}\n\nQual é a recomendação mais importante para resolver isso?`,
        },
      ],
    });

    const recommendation = response.choices[0]?.message?.content || anomaly.recommendation;
    return recommendation.substring(0, 500); // Limitar a 500 caracteres
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    return anomaly.recommendation;
  }
}

/**
 * Salvar anomalias detectadas no banco de dados
 */
export async function saveDetectedAnomalies(projectId: number, anomalies: AnomalyPattern[]) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return;
    }

    for (const anomaly of anomalies) {
      // Salvar na tabela emailAnomalies
      await db.insert(emailAnomalies).values({
        projectId,
        anomalyType: anomaly.type,
        description: anomaly.description,
        severity: anomaly.severity,
        confidence: anomaly.confidence,
        affectedDomain: anomaly.affectedDomain,
        affectedSender: anomaly.affectedSender,
        metrics: JSON.stringify(anomaly.metrics),
        detectedAt: anomaly.detectedAt,
        resolvedAt: null,
        isResolved: false,
      });

      // Criar alerta correspondente
      await db.insert(emailAlerts).values({
        projectId,
        alertType: anomaly.type,
        severity: anomaly.severity,
        title: `${anomaly.type.replace(/_/g, ' ').toUpperCase()}: ${anomaly.severity}`,
        description: anomaly.description,
        recommendation: anomaly.recommendation,
        isRead: false,
        createdAt: anomaly.detectedAt,
      });
    }

    console.log(`[Intelligent Alerts] ${anomalies.length} anomalias salvas para projeto ${projectId}`);
  } catch (error) {
    console.error('Error saving detected anomalies:', error);
  }
}

/**
 * Obter alertas inteligentes não lidos
 */
export async function getUnreadIntelligentAlerts(projectId: number): Promise<IntelligentAlert[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return [];
    }

    const alerts = await db
      .select()
      .from(emailAlerts)
      .where(and(eq(emailAlerts.projectId, projectId), eq(emailAlerts.isRead, false)))
      .orderBy(desc(emailAlerts.createdAt));

    return alerts.map((alert) => ({
      id: alert.id,
      projectId: alert.projectId,
      anomalyType: alert.alertType,
      severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
      title: alert.title,
      description: alert.description,
      recommendation: alert.recommendation,
      confidence: 85, // Valor padrão
      affectedEmails: 0,
      createdAt: alert.createdAt,
      resolvedAt: alert.resolvedAt,
      isResolved: alert.isResolved,
    }));
  } catch (error) {
    console.error('Error getting unread intelligent alerts:', error);
    return [];
  }
}

/**
 * Marcar alerta como resolvido
 */
export async function markAlertAsResolved(alertId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return;
    }

    await db
      .update(emailAlerts)
      .set({
        isRead: true,
        isResolved: true,
        resolvedAt: new Date(),
      })
      .where(eq(emailAlerts.id, alertId));

    console.log(`[Intelligent Alerts] Alerta ${alertId} marcado como resolvido`);
  } catch (error) {
    console.error('Error marking alert as resolved:', error);
  }
}
