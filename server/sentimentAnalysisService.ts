import { getDb } from './db';
import { emailSentimentAnalysis, sentimentAlerts, emailTracking, crmContacts } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

// ============================================
// SENTIMENT ANALYSIS SERVICE
// ============================================

export interface SentimentResult {
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  sentimentScore: number; // -1.00 a 1.00
  confidence: number; // 0.00 a 1.00
  keywords: string[];
  emotions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// Analisar sentimento de um email
export async function analyzeEmailSentiment(emailId: number, emailContent: string, projectId: number): Promise<SentimentResult> {
  try {
    // Usar IA para analisar sentimento
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em análise de sentimento. Analise o email fornecido e retorne um JSON com:
          - sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
          - sentimentScore: número entre -1.00 (muito negativo) e 1.00 (muito positivo)
          - confidence: número entre 0.00 e 1.00 indicando confiança da análise
          - keywords: array de palavras-chave encontradas
          - emotions: array de emoções detectadas
          - urgency: 'low' | 'medium' | 'high' | 'critical'
          
          Retorne APENAS o JSON, sem explicações adicionais.`,
        },
        {
          role: 'user',
          content: `Analise este email:\n\n${emailContent}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sentiment_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              sentiment: { type: 'string', enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'] },
              sentimentScore: { type: 'number', minimum: -1, maximum: 1 },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              keywords: { type: 'array', items: { type: 'string' } },
              emotions: { type: 'array', items: { type: 'string' } },
              urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            },
            required: ['sentiment', 'sentimentScore', 'confidence', 'keywords', 'emotions', 'urgency'],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Salvar análise no banco de dados
    const db = await getDb();
    
    await db.insert(emailSentimentAnalysis).values({
      emailId,
      projectId,
      sentiment: result.sentiment,
      sentimentScore: result.sentimentScore.toString(),
      confidence: result.confidence.toString(),
      keywords: JSON.stringify(result.keywords),
      emotions: JSON.stringify(result.emotions),
      urgency: result.urgency,
      requiresAction: result.urgency === 'high' || result.urgency === 'critical' ? 1 : 0,
    });

    // Se sentimento negativo, criar alerta
    if (result.sentiment === 'very_negative' || result.sentiment === 'negative') {
      await createSentimentAlert(emailId, projectId, result);
    }

    return result;
  } catch (error) {
    console.error('Erro ao analisar sentimento:', error);
    throw error;
  }
}

// Criar alerta de sentimento
export async function createSentimentAlert(emailId: number, projectId: number, sentimentResult: SentimentResult) {
  const db = await getDb();
  
  // Obter email para contexto
  const email = await db.select().from(emailTracking)
    .where(eq(emailTracking.id, emailId))
    .limit(1);

  if (!email[0]) return;

  // Determinar tipo de alerta
  let alertType: 'negative_sentiment' | 'urgent_issue' | 'sentiment_trend' | 'communication_gap' = 'negative_sentiment';
  let title = 'Sentimento Negativo Detectado';
  let description = `Email com sentimento ${sentimentResult.sentiment} recebido de ${email[0].senderEmail}`;

  if (sentimentResult.urgency === 'critical') {
    alertType = 'urgent_issue';
    title = 'Problema Crítico Detectado';
    description = `Email crítico recebido: ${email[0].subject}`;
  }

  const recommendedAction = generateRecommendedAction(sentimentResult);

  await db.insert(sentimentAlerts).values({
    projectId,
    contactId: email[0].contactId,
    sentimentAnalysisId: 0, // Será atualizado depois
    alertType,
    severity: sentimentResult.urgency === 'critical' ? 'critical' : sentimentResult.urgency === 'high' ? 'high' : 'medium',
    title,
    description,
    recommendedAction,
    isRead: 0,
    isResolved: 0,
  });
}

// Obter alertas de sentimento de um projeto
export async function getProjectSentimentAlerts(projectId: number, unreadOnly = false) {
  const db = await getDb();
  
  let query = db.select().from(sentimentAlerts)
    .where(eq(sentimentAlerts.projectId, projectId));

  if (unreadOnly) {
    query = query.where(and(
      eq(sentimentAlerts.projectId, projectId),
      eq(sentimentAlerts.isRead, 0)
    ));
  }

  return await query.orderBy(desc(sentimentAlerts.createdAt));
}

// Marcar alerta como lido
export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  
  return await db.update(sentimentAlerts)
    .set({ isRead: 1 })
    .where(eq(sentimentAlerts.id, alertId));
}

// Marcar alerta como resolvido
export async function markAlertAsResolved(alertId: number) {
  const db = await getDb();
  
  return await db.update(sentimentAlerts)
    .set({
      isResolved: 1,
      resolvedAt: new Date().toISOString(),
    })
    .where(eq(sentimentAlerts.id, alertId));
}

// Obter análise de sentimento de um email
export async function getEmailSentimentAnalysis(emailId: number) {
  const db = await getDb();
  
  return await db.select().from(emailSentimentAnalysis)
    .where(eq(emailSentimentAnalysis.emailId, emailId))
    .limit(1);
}

// Obter tendência de sentimento de um projeto
export async function getProjectSentimentTrend(projectId: number, days = 30) {
  const db = await getDb();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sentiments = await db.select().from(emailSentimentAnalysis)
    .where(and(
      eq(emailSentimentAnalysis.projectId, projectId),
    ));

  if (sentiments.length === 0) return null;

  // Agrupar por dia
  const dailySentiments: { [key: string]: number[] } = {};
  
  sentiments.forEach(s => {
    const date = s.analyzedAt.split('T')[0];
    if (!dailySentiments[date]) {
      dailySentiments[date] = [];
    }
    dailySentiments[date].push(parseFloat(s.sentimentScore));
  });

  // Calcular média diária
  const trend = Object.entries(dailySentiments).map(([date, scores]) => ({
    date,
    averageSentiment: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
    count: scores.length,
  }));

  return trend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Detectar padrões de sentimento negativo
export async function detectNegativeSentimentPatterns(projectId: number) {
  const db = await getDb();
  
  const negativeSentiments = await db.select().from(emailSentimentAnalysis)
    .where(and(
      eq(emailSentimentAnalysis.projectId, projectId),
    ));

  const patterns = {
    contactsWithNegativeSentiment: [] as any[],
    frequentNegativeKeywords: [] as { keyword: string; count: number }[],
    criticalAlerts: 0,
    trend: 'stable' as 'improving' | 'declining' | 'stable',
  };

  // Contar sentimentos negativos por contato
  const contactSentiments: { [key: number]: number[] } = {};
  
  negativeSentiments.forEach(s => {
    if (s.sentiment === 'very_negative' || s.sentiment === 'negative') {
      if (s.contactId) {
        if (!contactSentiments[s.contactId]) {
          contactSentiments[s.contactId] = [];
        }
        contactSentiments[s.contactId].push(parseFloat(s.sentimentScore));
      }
    }
  });

  // Obter contatos com sentimento negativo
  for (const [contactId, scores] of Object.entries(contactSentiments)) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avgScore < -0.3) {
      const contact = await db.select().from(crmContacts)
        .where(eq(crmContacts.id, parseInt(contactId)))
        .limit(1);

      if (contact[0]) {
        patterns.contactsWithNegativeSentiment.push({
          contactId: parseInt(contactId),
          name: contact[0].name,
          email: contact[0].email,
          averageSentiment: Math.round(avgScore * 100) / 100,
          negativeEmailCount: scores.length,
        });
      }
    }
  }

  // Contar palavras-chave negativas frequentes
  const keywordCounts: { [key: string]: number } = {};
  
  negativeSentiments.forEach(s => {
    if (s.sentiment === 'very_negative' || s.sentiment === 'negative') {
      const keywords = JSON.parse(s.keywords);
      keywords.forEach((kw: string) => {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      });
    }
  });

  patterns.frequentNegativeKeywords = Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Contar alertas críticos
  const criticalAlerts = await db.select().from(sentimentAlerts)
    .where(and(
      eq(sentimentAlerts.projectId, projectId),
      eq(sentimentAlerts.severity, 'critical')
    ));

  patterns.criticalAlerts = criticalAlerts.length;

  return patterns;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRecommendedAction(sentimentResult: SentimentResult): string {
  if (sentimentResult.sentiment === 'very_negative') {
    return 'Recomendação: Contate o cliente imediatamente para resolver o problema. Escale para gerente se necessário.';
  } else if (sentimentResult.sentiment === 'negative') {
    return 'Recomendação: Revise a comunicação e considere um follow-up para melhorar o relacionamento.';
  } else if (sentimentResult.urgency === 'high') {
    return 'Recomendação: Priorize a resposta a este email. Pode haver um problema que precisa de atenção rápida.';
  } else if (sentimentResult.urgency === 'critical') {
    return 'Recomendação: URGENTE - Escalação imediata necessária. Este email requer ação imediata.';
  }
  
  return 'Recomendação: Monitore este contato para mudanças futuras no sentimento.';
}
