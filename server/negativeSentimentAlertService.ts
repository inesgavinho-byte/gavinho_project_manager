import { getDb } from './db';
import { invokeLLM } from './_core/llm';
import { notifyOwner } from './_core/notification';
import { emailSentimentAnalysis, sentimentAlerts, crmContacts } from '../drizzle/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

/**
 * Serviço de detecção de sentimento negativo persistente
 * Monitora contatos com sentimento consistentemente negativo
 */

export interface SentimentAlertConfig {
  contactId: string;
  negativeThreshold: number; // 0-100, ex: 30 (30% ou menos = negativo)
  persistenceDays: number; // Número de dias para considerar como persistente
  minEmailsRequired: number; // Número mínimo de emails para gerar alerta
  enabled: boolean;
}

export interface NegativeSentimentAlert {
  contactId: string;
  contactName: string;
  contactEmail: string;
  averageSentiment: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
  emailsAnalyzed: number;
  lastNegativeEmail: Date;
  daysOfNegativeSentiment: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
}

/**
 * Analisa sentimento de um contato nos últimos N dias
 */
export async function analyzeContactSentimentTrend(
  contactId: string,
  days: number = 7
): Promise<{
  averageSentiment: number;
  trend: 'improving' | 'declining' | 'stable';
  emailsAnalyzed: number;
  lastNegativeEmail?: Date;
  sentimentHistory: Array<{ date: Date; sentiment: number }>;
}> {
  const db = await getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sentiments = await db
    .select({
      sentiment: emailSentimentAnalysis.sentimentScore,
      createdAt: emailSentimentAnalysis.createdAt,
    })
    .from(emailSentimentAnalysis)
    .where(
      and(
        eq(emailSentimentAnalysis.contactId, contactId),
        gte(emailSentimentAnalysis.createdAt, startDate)
      )
    )
    .orderBy(emailSentimentAnalysis.createdAt);

  if (sentiments.length === 0) {
    return {
      averageSentiment: 50,
      trend: 'stable',
      emailsAnalyzed: 0,
      sentimentHistory: [],
    };
  }

  const scores = sentiments.map((s) => s.sentiment);
  const averageSentiment = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Calcular tendência comparando primeira metade com segunda metade
  const midpoint = Math.floor(sentiments.length / 2);
  const firstHalf = scores.slice(0, midpoint);
  const secondHalf = scores.slice(midpoint);

  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (secondHalfAvg > firstHalfAvg + 10) trend = 'improving';
  else if (secondHalfAvg < firstHalfAvg - 10) trend = 'declining';

  const lastNegativeEmail = sentiments
    .filter((s) => s.sentiment < 40)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;

  return {
    averageSentiment,
    trend,
    emailsAnalyzed: sentiments.length,
    lastNegativeEmail,
    sentimentHistory: sentiments.map((s) => ({
      date: s.createdAt,
      sentiment: s.sentiment,
    })),
  };
}

/**
 * Detecta contatos com sentimento consistentemente negativo
 */
export async function detectNegativeSentimentAlerts(
  config: SentimentAlertConfig
): Promise<NegativeSentimentAlert | null> {
  const db = await getDb();

  // Obter dados de sentimento do contato
  const sentimentData = await analyzeContactSentimentTrend(config.contactId, config.persistenceDays);

  // Verificar se atende aos critérios de alerta
  if (
    sentimentData.emailsAnalyzed < config.minEmailsRequired ||
    sentimentData.averageSentiment > config.negativeThreshold
  ) {
    return null;
  }

  // Obter informações do contato
  const contact = await db
    .select()
    .from(crmContacts)
    .where(eq(crmContacts.id, config.contactId))
    .limit(1);

  if (!contact.length) return null;

  const contactData = contact[0];

  // Calcular dias com sentimento negativo
  const negativeEmails = sentimentData.sentimentHistory.filter((h) => h.sentiment < config.negativeThreshold);
  const daysWithNegative = new Set(
    negativeEmails.map((e) => e.date.toISOString().split('T')[0])
  ).size;

  // Determinar severidade
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (sentimentData.averageSentiment < 20) severity = 'critical';
  else if (sentimentData.averageSentiment < 30) severity = 'high';
  else if (sentimentData.averageSentiment < 40) severity = 'medium';

  // Gerar ações recomendadas
  const recommendedActions = await generateRecommendedActions(
    contactData,
    sentimentData,
    severity
  );

  return {
    contactId: config.contactId,
    contactName: contactData.name,
    contactEmail: contactData.email,
    averageSentiment: sentimentData.averageSentiment,
    sentimentTrend: sentimentData.trend,
    emailsAnalyzed: sentimentData.emailsAnalyzed,
    lastNegativeEmail: sentimentData.lastNegativeEmail || new Date(),
    daysOfNegativeSentiment: daysWithNegative,
    severity,
    recommendedActions,
  };
}

/**
 * Gera ações recomendadas baseadas em análise de sentimento
 */
async function generateRecommendedActions(
  contact: any,
  sentimentData: any,
  severity: string
): Promise<string[]> {
  const actions: string[] = [];

  // Ações baseadas em severidade
  if (severity === 'critical') {
    actions.push('Contactar imediatamente para resolver problema urgente');
    actions.push('Agendar chamada ou reunião presencial');
    actions.push('Escalalar para gestor de conta');
  } else if (severity === 'high') {
    actions.push('Enviar email de acompanhamento personalizado');
    actions.push('Oferecer solução ou compensação');
    actions.push('Agendar reunião para discussão');
  } else if (severity === 'medium') {
    actions.push('Enviar email de check-in amigável');
    actions.push('Oferecer suporte adicional');
  }

  // Ações baseadas em tendência
  if (sentimentData.trend === 'declining') {
    actions.push('Investigar causa raiz da deterioração');
    actions.push('Revisar histórico recente de comunicações');
  } else if (sentimentData.trend === 'improving') {
    actions.push('Manter momentum positivo com follow-ups');
    actions.push('Consolidar relacionamento com ações de valor');
  }

  // Usar IA para gerar ações customizadas
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em gestão de relacionamento com clientes. Gere 2-3 ações específicas e práticas para melhorar o relacionamento com este contato.',
        },
        {
          role: 'user',
          content: `Contato: ${contact.name} (${contact.email})
Sentimento médio: ${sentimentData.averageSentiment.toFixed(1)}%
Tendência: ${sentimentData.trend}
Tipo de contato: ${contact.type}
Gere ações específicas para melhorar o relacionamento.`,
        },
      ],
    });

    if (response.choices[0]?.message?.content) {
      const aiActions = response.choices[0].message.content
        .split('\n')
        .filter((line: string) => line.trim())
        .slice(0, 2);
      actions.push(...aiActions);
    }
  } catch (error) {
    console.error('Erro ao gerar ações com IA:', error);
  }

  return actions;
}

/**
 * Cria alerta de sentimento negativo no banco de dados
 */
export async function createNegativeSentimentAlert(
  alert: NegativeSentimentAlert
): Promise<void> {
  const db = await getDb();

  // Verificar se já existe alerta ativo para este contato
  const existingAlert = await db
    .select()
    .from(sentimentAlerts)
    .where(
      and(
        eq(sentimentAlerts.contactId, alert.contactId),
        eq(sentimentAlerts.status, 'active')
      )
    )
    .limit(1);

  if (existingAlert.length > 0) {
    // Atualizar alerta existente
    await db
      .update(sentimentAlerts)
      .set({
        severity: alert.severity,
        averageSentiment: alert.averageSentiment,
        sentimentTrend: alert.sentimentTrend,
        updatedAt: new Date(),
      })
      .where(eq(sentimentAlerts.id, existingAlert[0].id));
  } else {
    // Criar novo alerta
    await db.insert(sentimentAlerts).values({
      contactId: alert.contactId,
      severity: alert.severity,
      averageSentiment: alert.averageSentiment,
      sentimentTrend: alert.sentimentTrend,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Enviar notificação ao proprietário
  await notifyOwner({
    title: `⚠️ Alerta de Sentimento Negativo: ${alert.contactName}`,
    content: `O contato ${alert.contactName} (${alert.contactEmail}) apresenta sentimento consistentemente negativo (${alert.averageSentiment.toFixed(1)}%). Severidade: ${alert.severity.toUpperCase()}. Ações recomendadas: ${alert.recommendedActions.join('; ')}`,
  });
}

/**
 * Marca alerta como resolvido
 */
export async function resolveNegativeSentimentAlert(
  contactId: string,
  resolution: string
): Promise<void> {
  const db = await getDb();

  await db
    .update(sentimentAlerts)
    .set({
      status: 'resolved',
      resolution,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sentimentAlerts.contactId, contactId),
        eq(sentimentAlerts.status, 'active')
      )
    );
}

/**
 * Obtém todos os alertas ativos de sentimento negativo
 */
export async function getActiveSentimentAlerts(): Promise<NegativeSentimentAlert[]> {
  const db = await getDb();

  const alerts = await db
    .select({
      contactId: sentimentAlerts.contactId,
      severity: sentimentAlerts.severity,
      averageSentiment: sentimentAlerts.averageSentiment,
      sentimentTrend: sentimentAlerts.sentimentTrend,
      contactName: crmContacts.name,
      contactEmail: crmContacts.email,
    })
    .from(sentimentAlerts)
    .innerJoin(crmContacts, eq(sentimentAlerts.contactId, crmContacts.id))
    .where(eq(sentimentAlerts.status, 'active'))
    .orderBy(desc(sentimentAlerts.severity));

  return alerts.map((alert) => ({
    contactId: alert.contactId,
    contactName: alert.contactName,
    contactEmail: alert.contactEmail,
    averageSentiment: alert.averageSentiment,
    sentimentTrend: alert.sentimentTrend as 'improving' | 'declining' | 'stable',
    emailsAnalyzed: 0,
    lastNegativeEmail: new Date(),
    daysOfNegativeSentiment: 0,
    severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
    recommendedActions: [],
  }));
}

/**
 * Monitora todos os contatos e cria alertas conforme necessário
 */
export async function monitorAllContactsSentiment(
  negativeThreshold: number = 40,
  persistenceDays: number = 7,
  minEmailsRequired: number = 3
): Promise<NegativeSentimentAlert[]> {
  const db = await getDb();

  // Obter todos os contatos
  const contacts = await db.select().from(crmContacts);

  const alerts: NegativeSentimentAlert[] = [];

  for (const contact of contacts) {
    const alert = await detectNegativeSentimentAlerts({
      contactId: contact.id,
      negativeThreshold,
      persistenceDays,
      minEmailsRequired,
      enabled: true,
    });

    if (alert) {
      alerts.push(alert);
      await createNegativeSentimentAlert(alert);
    }
  }

  return alerts;
}
