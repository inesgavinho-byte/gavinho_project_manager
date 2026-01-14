import { getDb } from "./db";
import { emailHistory, emailAlerts, emailAnalytics, emailAnomalies, emailTrends, projects } from "../drizzle/schema";
import { eq, and, desc, gte, lte, count, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * Analisar histórico de emails e gerar alertas automáticos
 */
export async function analyzeEmailHistory(projectId: number): Promise<void> {
  const db = getDb();

  // Buscar emails recentes do projeto
  const recentEmails = await db
    .select()
    .from(emailHistory)
    .where(eq(emailHistory.projectId, projectId))
    .orderBy(desc(emailHistory.sentAt))
    .limit(100);

  if (recentEmails.length === 0) return;

  // Calcular estatísticas
  const totalSent = recentEmails.length;
  const totalDelivered = recentEmails.filter(e => e.status === 'delivered').length;
  const totalBounced = recentEmails.filter(e => e.status === 'bounced').length;
  const totalFailed = recentEmails.filter(e => e.status === 'failed').length;
  const totalOpened = recentEmails.filter(e => e.openedAt).length;
  const totalClicked = recentEmails.filter(e => e.clickedAt).length;

  // Detectar anomalias
  const bounceRate = (totalBounced / totalSent) * 100;
  const deliveryRate = (totalDelivered / totalSent) * 100;
  const openRate = (totalOpened / totalDelivered) * 100;

  // Gerar alertas se necessário
  if (bounceRate > 10) {
    await createAlert(projectId, 'high_bounce_rate', 'critical', 
      `Alta taxa de rejeição detectada (${bounceRate.toFixed(2)}%)`);
  }

  if (deliveryRate < 80) {
    await createAlert(projectId, 'delivery_failure', 'high',
      `Taxa de entrega baixa (${deliveryRate.toFixed(2)}%)`);
  }

  // Detectar padrões suspeitos
  const failedEmails = recentEmails.filter(e => e.status === 'failed');
  if (failedEmails.length > 0) {
    const failureReasons = failedEmails.map(e => e.errorMessage).filter(Boolean);
    const uniqueReasons = new Set(failureReasons);
    
    if (uniqueReasons.size > 0) {
      await createAlert(projectId, 'suspicious_pattern', 'medium',
        `Padrão de falhas detectado: ${Array.from(uniqueReasons).join(', ')}`);
    }
  }

  // Salvar análise diária
  await saveAnalytics(projectId, {
    totalSent,
    totalDelivered,
    totalBounced,
    totalFailed,
    totalOpened,
    totalClicked,
    deliveryRate,
    bounceRate,
    openRate,
  });
}

/**
 * Criar alerta automático
 */
async function createAlert(
  projectId: number,
  alertType: 'delivery_failure' | 'high_bounce_rate' | 'delayed_delivery' | 'suspicious_pattern' | 'anomaly_detected',
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string
): Promise<void> {
  const db = getDb();

  // Verificar se alerta similar já existe
  const existingAlert = await db
    .select()
    .from(emailAlerts)
    .where(
      and(
        eq(emailAlerts.projectId, projectId),
        eq(emailAlerts.alertType, alertType),
        eq(emailAlerts.isResolved, 0)
      )
    )
    .limit(1);

  if (existingAlert.length === 0) {
    await db.insert(emailAlerts).values({
      projectId,
      alertType,
      severity,
      title: getAlertTitle(alertType),
      description,
      isRead: 0,
      isResolved: 0,
    });
  }
}

/**
 * Obter título do alerta baseado no tipo
 */
function getAlertTitle(alertType: string): string {
  const titles: Record<string, string> = {
    'delivery_failure': 'Falha na Entrega de Email',
    'high_bounce_rate': 'Taxa de Rejeição Elevada',
    'delayed_delivery': 'Entrega Atrasada',
    'suspicious_pattern': 'Padrão Suspeito Detectado',
    'anomaly_detected': 'Anomalia Detectada',
  };
  return titles[alertType] || 'Alerta de Email';
}

/**
 * Salvar análise diária
 */
async function saveAnalytics(
  projectId: number,
  data: {
    totalSent: number;
    totalDelivered: number;
    totalBounced: number;
    totalFailed: number;
    totalOpened: number;
    totalClicked: number;
    deliveryRate: number;
    bounceRate: number;
    openRate: number;
  }
): Promise<void> {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Verificar se já existe análise para hoje
  const existing = await db
    .select()
    .from(emailAnalytics)
    .where(
      and(
        eq(emailAnalytics.projectId, projectId),
        eq(sql`DATE(${emailAnalytics.date})`, today)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(emailAnalytics)
      .set(data)
      .where(eq(emailAnalytics.id, existing[0].id));
  } else {
    // Inserir nova
    await db.insert(emailAnalytics).values({
      projectId,
      date: new Date(today),
      ...data,
    });
  }
}

/**
 * Detectar anomalias usando IA
 */
export async function detectAnomaliesWithAI(projectId: number): Promise<void> {
  const db = getDb();

  // Buscar dados históricos
  const analytics = await db
    .select()
    .from(emailAnalytics)
    .where(eq(emailAnalytics.projectId, projectId))
    .orderBy(desc(emailAnalytics.date))
    .limit(30);

  if (analytics.length < 7) return; // Precisamos de pelo menos uma semana de dados

  // Preparar dados para análise
  const analysisData = {
    projectId,
    recentData: analytics.slice(0, 7),
    historicalData: analytics.slice(7),
  };

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em análise de padrões de email. Analise os dados de histórico de emails e identifique anomalias, tendências e problemas potenciais.`,
        },
        {
          role: "user",
          content: `Analise estes dados de emails: ${JSON.stringify(analysisData, null, 2)}. 
          
Identifique:
1. Anomalias (padrões incomuns)
2. Tendências (mudanças consistentes)
3. Problemas potenciais
4. Recomendações

Responda em JSON com estrutura: { anomalies: [], trends: [], issues: [], recommendations: [] }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              anomalies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string" },
                  },
                  required: ["type", "description", "severity"],
                },
              },
              trends: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    description: { type: "string" },
                    direction: { type: "string" },
                  },
                  required: ["type", "description", "direction"],
                },
              },
              issues: {
                type: "array",
                items: { type: "string" },
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["anomalies", "trends", "issues", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    // Processar resposta
    const content = response.choices[0].message.content;
    if (typeof content === 'string') {
      const analysis = JSON.parse(content);

      // Salvar anomalias detectadas
      for (const anomaly of analysis.anomalies) {
        await db.insert(emailAnomalies).values({
          projectId,
          anomalyType: mapAnomalyType(anomaly.type),
          severity: anomaly.severity as 'low' | 'medium' | 'high' | 'critical',
          description: anomaly.description,
          affectedRecipients: 0,
          affectedEmails: 0,
          isActive: 1,
          recommendation: analysis.recommendations.join('; '),
          confidence: 0.85,
        });
      }
    }
  } catch (error) {
    console.error('Erro ao detectar anomalias com IA:', error);
  }
}

/**
 * Mapear tipo de anomalia para enum
 */
function mapAnomalyType(type: string): 'high_bounce_rate' | 'low_delivery_rate' | 'unusual_pattern' | 'recipient_issue' | 'domain_issue' | 'content_issue' {
  const mapping: Record<string, any> = {
    'bounce': 'high_bounce_rate',
    'delivery': 'low_delivery_rate',
    'pattern': 'unusual_pattern',
    'recipient': 'recipient_issue',
    'domain': 'domain_issue',
    'content': 'content_issue',
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (type.toLowerCase().includes(key)) {
      return value;
    }
  }

  return 'unusual_pattern';
}

/**
 * Obter alertas não lidos de um projeto
 */
export async function getUnreadAlerts(projectId: number): Promise<any[]> {
  const db = getDb();

  return db
    .select()
    .from(emailAlerts)
    .where(
      and(
        eq(emailAlerts.projectId, projectId),
        eq(emailAlerts.isRead, 0)
      )
    )
    .orderBy(desc(emailAlerts.createdAt));
}

/**
 * Marcar alerta como lido
 */
export async function markAlertAsRead(alertId: number): Promise<void> {
  const db = getDb();

  await db
    .update(emailAlerts)
    .set({ isRead: 1 })
    .where(eq(emailAlerts.id, alertId));
}

/**
 * Obter histórico de emails com filtros
 */
export async function getEmailHistory(
  projectId: number,
  filters?: {
    status?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    recipientEmail?: string;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  const db = getDb();
  let query = db
    .select()
    .from(emailHistory)
    .where(eq(emailHistory.projectId, projectId));

  if (filters?.status) {
    query = query.where(eq(emailHistory.status, filters.status));
  }

  if (filters?.eventType) {
    query = query.where(eq(emailHistory.eventType, filters.eventType));
  }

  if (filters?.startDate) {
    query = query.where(gte(emailHistory.sentAt, filters.startDate.toISOString()));
  }

  if (filters?.endDate) {
    query = query.where(lte(emailHistory.sentAt, filters.endDate.toISOString()));
  }

  if (filters?.recipientEmail) {
    query = query.where(eq(emailHistory.recipientEmail, filters.recipientEmail));
  }

  query = query.orderBy(desc(emailHistory.sentAt));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return query;
}

/**
 * Obter insights de IA
 */
export async function getAIInsights(projectId: number): Promise<any> {
  const db = getDb();

  // Buscar anomalias ativas
  const anomalies = await db
    .select()
    .from(emailAnomalies)
    .where(
      and(
        eq(emailAnomalies.projectId, projectId),
        eq(emailAnomalies.isActive, 1)
      )
    )
    .orderBy(desc(emailAnomalies.confidence));

  // Buscar tendências
  const trends = await db
    .select()
    .from(emailTrends)
    .where(eq(emailTrends.projectId, projectId))
    .orderBy(desc(emailTrends.startDate))
    .limit(5);

  // Buscar alertas críticos
  const criticalAlerts = await db
    .select()
    .from(emailAlerts)
    .where(
      and(
        eq(emailAlerts.projectId, projectId),
        eq(emailAlerts.severity, 'critical'),
        eq(emailAlerts.isResolved, 0)
      )
    );

  return {
    anomalies: anomalies.slice(0, 5),
    trends,
    criticalAlerts,
    summary: {
      totalAnomalies: anomalies.length,
      totalTrends: trends.length,
      criticalIssues: criticalAlerts.length,
    },
  };
}
