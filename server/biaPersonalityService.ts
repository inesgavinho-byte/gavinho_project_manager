import { invokeLLM } from "./_core/llm";

// Tipos de análise BIA

/**
 * Serviço de Personalidade BIA
 * Gerencia a comunicação com a personalidade BIA, incluindo:
 * - Geração de mensagens com tom BIA
 * - Análise de contexto e detecção de bloqueios
 * - Sugestões proativas
 * - Relatórios diários
 */

export const BIA_SYSTEM_PROMPT = `Tu és a Bia, assistente de gestão de projetos da GAVINHO Group.

## Tua Personalidade
- Nome: Bia
- Função: Assistente de Gestão de Projetos
- Voz: Feminina, júnior entusiasta
- Tom: Amigável, entusiasta, proativa, organizada

## Como Comunicas
- Trata a equipa por "tu"
- Usa 1-2 emojis por mensagem, máximo
- Frases curtas e claras
- Amigável e profissional como uma colega simpática
- Evita jargão técnico desnecessário

## Teu Humor
- Leve e inteligente, nunca sarcástico
- Autodepreciativo sobre ser IA/organizada
- Observacional sobre vida de escritório criativo
- Trocadilhos suaves sobre construção/design
- Celebras conquistas com entusiasmo

## Quando Comunicas
- Entusiasta com progresso dos projetos
- Acolhedora e aproximas-te como colega
- Proativa - ofereces ajuda sem ser pedida
- Direta quando necessário mas empática
- Não és autoritária, controladora ou fria

## Exemplos do Teu Tom

**Cumprimento:**
"Bom dia! Como está a correr a semana? 😊"

**Verificar progresso (suave):**
"Olá! Passa-se alguma coisa com o projeto? Vi que não há updates há uns dias. Precisas de ajuda?"

**Oferecer apoio:**
"Reparei que tens várias tarefas em paralelo. Queres que te ajude a priorizar?"

**Detectar bloqueio:**
"Ei, está tudo bem? Se houver algum bloqueio, diz-me — às vezes só precisamos de uma segunda cabeça."

**Inatividade prolongada:**
"Olá! Queria só perceber como posso ajudar — não tenho visto movimento e quero garantir que tens apoio."

**Celebrar:**
"Tarefa fechada! 🎉 Mais uma para o livro. Bom trabalho!"

## Frases de Assinatura
- "Estou aqui se precisares! 😊"
- "Qualquer coisa, chama."
- "Vamos a isso! 💪"
- "Conto contigo!"
- "Bom trabalho — continua assim 🌟"

Responde sempre mantendo esta personalidade. Sê genuína, empática e proativa.`;

interface BiaMessageContext {
  projectName: string;
  teamMember: string;
  recentActivity?: string;
  taskStatus?: string;
  blockers?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

interface BiaAnalysisResult {
  hasBlocker: boolean;
  blockerDescription?: string;
  sentiment: "positive" | "neutral" | "negative";
  suggestedAction?: string;
  priority: "low" | "medium" | "high" | "critical";
}

/**
 * Gera uma mensagem com a personalidade BIA
 */
export async function generateBiaMessage(
  context: BiaMessageContext,
  messageType: "greeting" | "check-in" | "blocker-alert" | "celebration" | "support"
): Promise<string> {
  const prompts: Record<string, string> = {
    greeting: `Cria uma mensagem de bom dia para ${context.teamMember} sobre o projeto "${context.projectName}". 
    Contexto: ${context.recentActivity || "sem updates recentes"}
    Mantém o tom amigável e entusiasta. Máximo 2 frases.`,
    
    "check-in": `Faz um check-in amigável com ${context.teamMember} sobre o projeto "${context.projectName}".
    Status atual: ${context.taskStatus || "não especificado"}
    Oferece apoio de forma proativa. Máximo 3 frases.`,
    
    "blocker-alert": `Alerta ${context.teamMember} sobre um possível bloqueio no projeto "${context.projectName}".
    Bloqueios: ${context.blockers?.join(", ") || "não especificado"}
    Sê empática mas direta. Oferece ajuda. Máximo 4 frases.`,
    
    celebration: `Celebra o progresso de ${context.teamMember} no projeto "${context.projectName}".
    Progresso: ${context.recentActivity || "tarefa concluída"}
    Sê entusiasta e genuína. Máximo 2 frases.`,
    
    support: `Oferece apoio a ${context.teamMember} para o projeto "${context.projectName}".
    Contexto: ${context.recentActivity || "sem contexto"}
    Sê acolhedora e proativa. Máximo 3 frases.`,
  };

  const userPrompt = prompts[messageType];

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: BIA_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Erro ao gerar mensagem BIA:", error);
    return "Olá! Estou aqui para ajudar. 😊";
  }
}

/**
 * Analisa uma mensagem ou conversa para detectar bloqueios e contexto
 */
export async function analyzeBiaContext(
  conversationText: string,
  projectContext: string
): Promise<BiaAnalysisResult> {
  const analysisPrompt = `Analisa o seguinte texto de conversa de projeto e identifica:
1. Se há algum bloqueio ou obstáculo mencionado
2. O sentimento geral (positivo, neutro, negativo)
3. Uma ação sugerida se houver bloqueio

Contexto do projeto: ${projectContext}

Texto: "${conversationText}"

Responde em JSON com: { hasBlocker: boolean, blockerDescription?: string, sentiment: "positive"|"neutral"|"negative", suggestedAction?: string, priority: "low"|"medium"|"high"|"critical" }`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Tu és um analisador de contexto de projetos. Responde sempre em JSON válido." },
        { role: "user", content: analysisPrompt },
      ],
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    return {
      hasBlocker: result.hasBlocker || false,
      blockerDescription: result.blockerDescription,
      sentiment: result.sentiment || "neutral",
      suggestedAction: result.suggestedAction,
      priority: result.priority || "medium",
    };
  } catch (error) {
    console.error("Erro ao analisar contexto BIA:", error);
    return {
      hasBlocker: false,
      sentiment: "neutral",
      priority: "low",
    };
  }
}

/**
 * Gera relatório diário de bloqueios para Inês (Direção Criativa)
 */
export async function generateDailyReport(
  blockers: Array<{ project: string; blocker: string; impact: string; responsible: string }>,
  warnings: string[],
  wins: string[],
  date: Date
): Promise<string> {
  const dateStr = date.toLocaleDateString("pt-PT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reportPrompt = `Gera um e-mail de relatório diário da Bia para Inês (Direção Criativa).

Data: ${dateStr}

BLOQUEIOS:
${blockers.map((b) => `- Projeto: ${b.project}\n  Bloqueio: ${b.blocker}\n  Impacto: ${b.impact}\n  Responsável: ${b.responsible}`).join("\n\n")}

ATENÇÕES (não urgente mas a monitorizar):
${warnings.map((w) => `• ${w}`).join("\n")}

WINS DO DIA:
${wins.map((w) => `• ${w}`).join("\n")}

Formato do e-mail:
- Assunto: 📋 Bia — Ponto de Situação | [Dia, Data]
- Tom: Profissional mas amigável
- Estrutura: Bloqueios → Atenções → Wins
- Assinatura: Bia 🌟

Gera o e-mail completo em português.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: BIA_SYSTEM_PROMPT },
        { role: "user", content: reportPrompt },
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Erro ao gerar relatório BIA:", error);
    return `Relatório de ${dateStr}\n\nBloqueios: ${blockers.length}\nWins: ${wins.length}`;
  }
}

/**
 * Gera sugestão proativa baseada em contexto
 */
export async function generateProactiveSuggestion(
  teamMemberName: string,
  projectName: string,
  inactivityDays: number,
  lastActivity: string
): Promise<string> {
  const suggestionPrompt = `Gera uma mensagem proativa da Bia para ${teamMemberName} sobre o projeto "${projectName}".

Contexto:
- Inatividade: ${inactivityDays} dias
- Última atividade: ${lastActivity}

A mensagem deve:
1. Ser empática e não acusadora
2. Oferecer apoio específico
3. Sugerir próximas ações
4. Manter o tom amigável e entusiasta

Máximo 4 frases.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: BIA_SYSTEM_PROMPT },
        { role: "user", content: suggestionPrompt },
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Erro ao gerar sugestão BIA:", error);
    return "Olá! Como posso ajudar? 😊";
  }
}
