import { invokeLLM } from "./server/_core/llm";
import { db } from "./db";
import { chatMessages, projectKnowledgeBase, aiContextHistory } from "../drizzle/chatSchema";
import { eq, and } from "drizzle-orm";

interface ChatContext {
  projectName: string;
  projectCode: string;
  recentMessages: Array<{ userName: string; content: string; timestamp: string }>;
  knowledgeBase: Record<string, string[]>;
  decisions: string[];
  constraints: string[];
}

/**
 * Analisa contexto do projeto baseado em conversas
 */
export async function analyzeProjectContext(projectId: string): Promise<ChatContext> {
  // Buscar últimas 50 mensagens
  const recentMessages = await db
    .select({
      userName: chatMessages.userName,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.projectId, projectId))
    .orderBy((t) => t.createdAt)
    .limit(50);

  // Buscar knowledge base do projeto
  const knowledge = await db
    .select()
    .from(projectKnowledgeBase)
    .where(eq(projectKnowledgeBase.projectId, projectId));

  // Organizar knowledge base por categoria
  const knowledgeBase: Record<string, string[]> = {};
  knowledge.forEach((item) => {
    if (!knowledgeBase[item.category]) {
      knowledgeBase[item.category] = [];
    }
    knowledgeBase[item.category].push(`${item.key}: ${item.value}`);
  });

  // Extrair decisões e restrições
  const decisions = knowledge
    .filter((k) => k.category === "design_decisions")
    .map((k) => k.value);

  const constraints = knowledge
    .filter((k) => k.category === "constraints")
    .map((k) => k.value);

  return {
    projectName: "Projeto GAVINHO",
    projectCode: projectId,
    recentMessages: recentMessages.map((m) => ({
      userName: m.userName,
      content: m.content,
      timestamp: m.createdAt?.toISOString() || "",
    })),
    knowledgeBase,
    decisions,
    constraints,
  };
}

/**
 * Gera sugestões baseadas em conversas usando IA
 */
export async function generateAISuggestions(
  projectId: string,
  topicId: string,
  messageContent: string
): Promise<Array<{
  type: "action" | "decision" | "alert" | "insight" | "recommendation";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  context: Record<string, unknown>;
}>> {
  const context = await analyzeProjectContext(projectId);

  const systemPrompt = `Você é um assistente de gestão de projetos de construção/design para a empresa GAVINHO. 
Sua tarefa é analisar conversas da equipa e gerar sugestões inteligentes que ajudem a melhorar o projeto.

Contexto do Projeto:
- Nome: ${context.projectName}
- Código: ${context.projectCode}
- Decisões Tomadas: ${context.decisions.join("; ")}
- Restrições: ${context.constraints.join("; ")}
- Knowledge Base: ${JSON.stringify(context.knowledgeBase)}

Gere sugestões APENAS se houver algo relevante. Cada sugestão deve ter:
1. Tipo: action (ação a tomar), decision (decisão a tomar), alert (alerta), insight (insight), recommendation (recomendação)
2. Título claro e conciso
3. Descrição detalhada
4. Prioridade: low, medium, high, critical
5. Contexto relevante

Responda em JSON com array de sugestões.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Mensagem da equipa: "${messageContent}"\n\nÚltimas mensagens do tópico:\n${context.recentMessages
          .slice(-10)
          .map((m) => `${m.userName}: ${m.content}`)
          .join("\n")}\n\nGere sugestões relevantes em JSON.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ai_suggestions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["action", "decision", "alert", "insight", "recommendation"],
                  },
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                  context: { type: "object" },
                },
                required: ["type", "title", "description", "priority"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return parsed.suggestions || [];
    }
  } catch (error) {
    console.error("Erro ao parsear sugestões da IA:", error);
  }

  return [];
}

/**
 * Extrai informações importantes de uma mensagem para a Knowledge Base
 */
export async function extractKnowledgeFromMessage(
  projectId: string,
  messageContent: string,
  messageId: string
): Promise<Array<{
  category: string;
  key: string;
  value: string;
}>> {
  const systemPrompt = `Você é um especialista em extrair informações importantes de conversas de projeto.
Analise a mensagem e extraia informações estruturadas que devem ser adicionadas à Knowledge Base do projeto.

Categorias possíveis:
- design_decisions: Decisões de design tomadas
- budget_constraints: Restrições orçamentárias
- timeline_constraints: Restrições de cronograma
- team_roles: Papéis e responsabilidades
- technical_specs: Especificações técnicas
- constraints: Restrições gerais
- risks: Riscos identificados
- dependencies: Dependências entre tarefas

Para cada informação, forneça: categoria, chave (identificador único), valor (descrição).
Responda em JSON.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Extraia informações importantes desta mensagem:\n\n"${messageContent}"\n\nResponda em JSON com array de informações.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "knowledge_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            knowledge: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  key: { type: "string" },
                  value: { type: "string" },
                },
                required: ["category", "key", "value"],
                additionalProperties: false,
              },
            },
          },
          required: ["knowledge"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return parsed.knowledge || [];
    }
  } catch (error) {
    console.error("Erro ao extrair conhecimento:", error);
  }

  return [];
}

/**
 * Salva contexto na história para melhorar aprendizado futuro
 */
export async function saveContextSnapshot(
  projectId: string,
  topicId: string,
  context: ChatContext
): Promise<void> {
  await db.insert(aiContextHistory).values({
    projectId,
    topicId,
    contextSnapshot: context as unknown as Record<string, unknown>,
  });
}
