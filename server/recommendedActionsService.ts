import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { emailHistory, emailSentimentAnalysis, crmContacts } from "../drizzle/schema";
import { eq, and, desc, limit } from "drizzle-orm";

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "follow_up" | "meeting" | "support" | "relationship" | "analysis";
  actionType: "email" | "call" | "meeting" | "task" | "review";
  targetContactId?: number;
  targetContactName?: string;
  targetContactEmail?: string;
  relatedEmailIds?: number[];
  suggestedTemplate?: string;
  estimatedTime?: string;
  reasoning: string;
  createdAt: Date;
}

export async function generateRecommendedActions(projectId: number): Promise<RecommendedAction[]> {
  const actions: RecommendedAction[] = [];
  const db = await getDb();
  
  if (!db) {
    console.warn("Database not available for generating recommended actions");
    return actions;
  }

  // 1. Buscar emails com sentimento negativo sem resposta
  const negativeSentimentEmails = await db
    .select()
    .from(emailSentimentAnalysis)
    .where(and(
      eq(emailSentimentAnalysis.projectId, projectId),
      eq(emailSentimentAnalysis.sentiment, "negative")
    ))
    .orderBy(desc(emailSentimentAnalysis.createdAt))
    .limit(10);

  // 2. Buscar contatos com múltiplas comunicações negativas
  const contactsWithNegativeSentiment = await db
    .select({
      contactId: emailSentimentAnalysis.contactId,
      contactName: crmContacts.name,
      contactEmail: crmContacts.email,
      negativeCount: emailSentimentAnalysis.sentiment,
    })
    .from(emailSentimentAnalysis)
    .leftJoin(crmContacts, eq(emailSentimentAnalysis.contactId, crmContacts.id))
    .where(and(
      eq(emailSentimentAnalysis.projectId, projectId),
      eq(emailSentimentAnalysis.sentiment, "negative")
    ))
    .orderBy(desc(emailSentimentAnalysis.createdAt))
    .limit(20);

  // 3. Buscar emails sem resposta por mais de 3 dias
  const unrepliedEmails = await db
    .select()
    .from(emailHistory)
    .where(and(
      eq(emailHistory.projectId, projectId),
      eq(emailHistory.status, "sent")
    ))
    .orderBy(desc(emailHistory.createdAt))
    .limit(20);

  // Usar IA para gerar ações recomendadas
  const aiPrompt = `
Você é um assistente de gestão de comunicações empresariais. Analise os seguintes dados e gere ações recomendadas para melhorar a comunicação e relacionamentos com clientes/fornecedores.

Emails com Sentimento Negativo:
${negativeSentimentEmails.map(e => `- ID: ${e.id}, Contato: ${e.contactId}, Sentimento: ${e.sentiment}, Data: ${e.createdAt}`).join('\n')}

Contatos com Sentimento Negativo Persistente:
${contactsWithNegativeSentiment.map(c => `- ${c.contactName} (${c.contactEmail}): Múltiplas comunicações negativas`).join('\n')}

Emails sem Resposta:
${unrepliedEmails.map(e => `- ID: ${e.id}, Para: ${e.recipient}, Assunto: ${e.subject}, Enviado: ${e.createdAt}`).join('\n')}

Gere uma lista de ações recomendadas em JSON com o seguinte formato:
[
  {
    "title": "Título da ação",
    "description": "Descrição detalhada",
    "priority": "high|medium|low",
    "category": "follow_up|meeting|support|relationship|analysis",
    "actionType": "email|call|meeting|task|review",
    "targetContactName": "Nome do contato (se aplicável)",
    "targetContactEmail": "Email do contato (se aplicável)",
    "suggestedTemplate": "Template sugerido para email (se aplicável)",
    "estimatedTime": "Tempo estimado (ex: 15 minutos)",
    "reasoning": "Motivo da recomendação"
  }
]

Retorne APENAS o JSON válido, sem explicações adicionais.
  `;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em gestão de comunicações empresariais. Retorne respostas em JSON válido.",
        },
        {
          role: "user",
          content: aiPrompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "[]";
    
    // Extrair JSON da resposta
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Não foi possível extrair JSON da resposta da IA");
      return actions;
    }

    const aiActions = JSON.parse(jsonMatch[0]);

    // Converter ações da IA para o formato esperado
    for (const aiAction of aiActions) {
      const action: RecommendedAction = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: aiAction.title || "Ação Recomendada",
        description: aiAction.description || "",
        priority: aiAction.priority || "medium",
        category: aiAction.category || "follow_up",
        actionType: aiAction.actionType || "email",
        targetContactName: aiAction.targetContactName,
        targetContactEmail: aiAction.targetContactEmail,
        suggestedTemplate: aiAction.suggestedTemplate,
        estimatedTime: aiAction.estimatedTime,
        reasoning: aiAction.reasoning || "",
        createdAt: new Date(),
      };

      actions.push(action);
    }
  } catch (error) {
    console.error("Erro ao gerar ações recomendadas com IA:", error);
  }

  // Se a IA não gerou ações, gerar ações padrão baseadas em regras
  if (actions.length === 0) {
    actions.push(...generateDefaultActions(
      negativeSentimentEmails,
      contactsWithNegativeSentiment,
      unrepliedEmails
    ));
  }

  return actions;
}

function generateDefaultActions(
  negativeSentimentEmails: any[],
  contactsWithNegativeSentiment: any[],
  unrepliedEmails: any[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // Ação 1: Acompanhamento para emails com sentimento negativo
  if (negativeSentimentEmails.length > 0) {
    actions.push({
      id: `action-negative-${Date.now()}`,
      title: "Acompanhamento de Comunicações Negativas",
      description: `Detectamos ${negativeSentimentEmails.length} comunicação(ões) com sentimento negativo. Recomenda-se entrar em contato para resolver possíveis problemas.`,
      priority: "high",
      category: "support",
      actionType: "call",
      suggestedTemplate: "Olá, gostaria de entender melhor a sua preocupação e como posso ajudar a resolver a situação.",
      estimatedTime: "20 minutos",
      reasoning: "Comunicações negativas indicam insatisfação que deve ser abordada rapidamente",
      createdAt: new Date(),
    });
  }

  // Ação 2: Reunião com contatos em risco
  if (contactsWithNegativeSentiment.length > 0) {
    const topContact = contactsWithNegativeSentiment[0];
    actions.push({
      id: `action-meeting-${Date.now()}`,
      title: `Agendar Reunião com ${topContact.contactName}`,
      description: `O contato ${topContact.contactName} apresenta padrão de comunicações negativas. Sugere-se agendar uma reunião para discutir e melhorar o relacionamento.`,
      priority: "high",
      category: "meeting",
      actionType: "meeting",
      targetContactName: topContact.contactName,
      targetContactEmail: topContact.contactEmail,
      estimatedTime: "1 hora",
      reasoning: "Relacionamento em risco - necessária intervenção pessoal",
      createdAt: new Date(),
    });
  }

  // Ação 3: Acompanhamento de emails sem resposta
  if (unrepliedEmails.length > 0) {
    actions.push({
      id: `action-followup-${Date.now()}`,
      title: "Acompanhamento de Emails Sem Resposta",
      description: `Existem ${unrepliedEmails.length} email(s) enviado(s) sem resposta. Recomenda-se enviar um email de acompanhamento educado.`,
      priority: "medium",
      category: "follow_up",
      actionType: "email",
      suggestedTemplate: "Apenas para confirmar que recebi seu email anterior. Poderia me informar o status?",
      estimatedTime: "10 minutos",
      reasoning: "Acompanhamento padrão para manter comunicação ativa",
      createdAt: new Date(),
    });
  }

  // Ação 4: Análise de tendências
  if (negativeSentimentEmails.length > 5) {
    actions.push({
      id: `action-analysis-${Date.now()}`,
      title: "Análise de Padrões de Comunicação",
      description: "Há um padrão elevado de comunicações negativas. Recomenda-se fazer uma análise profunda das causas raiz.",
      priority: "medium",
      category: "analysis",
      actionType: "review",
      estimatedTime: "30 minutos",
      reasoning: "Múltiplas comunicações negativas indicam possível problema sistêmico",
      createdAt: new Date(),
    });
  }

  return actions;
}

export async function getRecommendedActionsForContact(contactId: number): Promise<RecommendedAction[]> {
  const actions: RecommendedAction[] = [];
  const db = await getDb();
  
  if (!db) {
    console.warn("Database not available for getting recommended actions");
    return actions;
  }

  // Buscar histórico de comunicação do contato
  const communicationHistory = await db
    .select()
    .from(emailSentimentAnalysis)
    .where(eq(emailSentimentAnalysis.contactId, contactId))
    .orderBy(desc(emailSentimentAnalysis.createdAt))
    .limit(10);

  // Buscar informações do contato
  const contact = await db
    .select()
    .from(crmContacts)
    .where(eq(crmContacts.id, contactId))
    .limit(1);

  if (contact.length === 0) {
    return actions;
  }

  const contactInfo = contact[0];

  // Analisar sentimento
  const negativeSentimentCount = communicationHistory.filter(c => c.sentiment === "negative").length;
  const positiveSentimentCount = communicationHistory.filter(c => c.sentiment === "positive").length;

  // Gerar ações baseadas na análise
  if (negativeSentimentCount > positiveSentimentCount) {
    actions.push({
      id: `action-contact-negative-${Date.now()}`,
      title: "Melhorar Relacionamento",
      description: `O contato ${contactInfo.name} apresenta mais comunicações negativas que positivas. Recomenda-se uma abordagem proativa.`,
      priority: "high",
      category: "relationship",
      actionType: "call",
      targetContactName: contactInfo.name,
      targetContactEmail: contactInfo.email,
      suggestedTemplate: "Gostaria de entender como posso melhor atender às suas necessidades.",
      estimatedTime: "15 minutos",
      reasoning: "Relacionamento precisa de atenção",
      createdAt: new Date(),
    });
  }

  if (positiveSentimentCount > 0 && negativeSentimentCount === 0) {
    actions.push({
      id: `action-contact-positive-${Date.now()}`,
      title: "Fortalecer Relacionamento Positivo",
      description: `O contato ${contactInfo.name} tem um histórico positivo de comunicações. Recomenda-se manter este relacionamento e explorar oportunidades.`,
      priority: "medium",
      category: "relationship",
      actionType: "email",
      targetContactName: contactInfo.name,
      targetContactEmail: contactInfo.email,
      suggestedTemplate: "Agradeço o ótimo relacionamento que temos. Gostaria de explorar novas oportunidades juntos.",
      estimatedTime: "10 minutos",
      reasoning: "Relacionamento positivo - oportunidade de crescimento",
      createdAt: new Date(),
    });
  }

  return actions;
}

export async function getActionsByPriority(projectId: number, priority: "high" | "medium" | "low"): Promise<RecommendedAction[]> {
  const allActions = await generateRecommendedActions(projectId);
  return allActions.filter(action => action.priority === priority);
}

export async function getActionsByCategory(projectId: number, category: string): Promise<RecommendedAction[]> {
  const allActions = await generateRecommendedActions(projectId);
  return allActions.filter(action => action.category === category);
}
