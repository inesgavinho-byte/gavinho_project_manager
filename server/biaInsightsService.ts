import { db } from "./db";
import { chatMessages, chatTopics, projects } from "../drizzle/schema";
import { sql } from "drizzle-orm";

/**
 * Serviço de Análise de Insights BIA
 * Fornece dados agregados sobre sentimento da equipa, bloqueios e recomendações
 */

export interface TeamSentimentAnalysis {
  overallSentiment: "positive" | "neutral" | "negative";
  sentimentScore: number; // -1 a 1
  positiveMessages: number;
  neutralMessages: number;
  negativeMessages: number;
  trendDirection: "improving" | "stable" | "declining";
}

export interface BlockerTrend {
  category: string;
  count: number;
  severity: "low" | "medium" | "high" | "critical";
  affectedProjects: string[];
  lastOccurrence: Date;
}

export interface ProjectRecommendation {
  projectId: string;
  projectName: string;
  recommendation: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedImpact: string;
  suggestedAction: string;
}

export interface BiaInsights {
  teamSentiment: TeamSentimentAnalysis;
  topBlockers: BlockerTrend[];
  projectRecommendations: ProjectRecommendation[];
  teamActivity: {
    activeMembers: number;
    inactiveMembers: number;
    averageMessagesPerDay: number;
  };
  weeklyTrend: Array<{
    date: string;
    sentimentScore: number;
    messageCount: number;
    blockerCount: number;
  }>;
}

/**
 * Calcula análise de sentimento da equipa baseada em mensagens
 */
export async function analyzeTeamSentiment(): Promise<TeamSentimentAnalysis> {
  // Simular análise de sentimento
  // Em produção, isso viria de análise real de mensagens
  const totalMessages = 150;
  const positiveMessages = 85;
  const neutralMessages = 45;
  const negativeMessages = 20;

  const sentimentScore = (positiveMessages - negativeMessages) / totalMessages;
  const trendDirection: "improving" | "stable" | "declining" = sentimentScore > 0.4 ? "improving" : sentimentScore > 0 ? "stable" : "declining";

  return {
    overallSentiment: sentimentScore > 0.3 ? "positive" : sentimentScore > -0.3 ? "neutral" : "negative",
    sentimentScore,
    positiveMessages,
    neutralMessages,
    negativeMessages,
    trendDirection,
  };
}

/**
 * Identifica tendências de bloqueios
 */
export async function identifyBlockerTrends(): Promise<BlockerTrend[]> {
  // Simular análise de bloqueios
  // Em produção, isso viria de análise de conversas e dados de projeto
  const blockers: BlockerTrend[] = [
    {
      category: "Aprovações de Cliente",
      count: 5,
      severity: "high",
      affectedProjects: ["GA00489", "GA00492"],
      lastOccurrence: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      category: "Fornecedores",
      count: 3,
      severity: "medium",
      affectedProjects: ["GA00491"],
      lastOccurrence: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      category: "Recursos",
      count: 2,
      severity: "medium",
      affectedProjects: ["GA00466"],
      lastOccurrence: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  return blockers.sort((a, b) => b.count - a.count);
}

/**
 * Gera recomendações por projeto
 */
export async function generateProjectRecommendations(): Promise<ProjectRecommendation[]> {
  // Simular recomendações
  // Em produção, isso viria de análise de dados de projeto e conversas
  const recommendations: ProjectRecommendation[] = [
    {
      projectId: "GA00489",
      projectName: "AS HOUSE",
      recommendation: "Atrasos em aprovações de cliente - considerar reunião de alinhamento",
      priority: "high",
      estimatedImpact: "Reduzir atrasos em 1-2 semanas",
      suggestedAction: "Agendar reunião com cliente para clarificar requisitos pendentes",
    },
    {
      projectId: "GA00492",
      projectName: "CASTILHO 3",
      recommendation: "Equipa está com carga de trabalho elevada - distribuir tarefas",
      priority: "medium",
      estimatedImpact: "Melhorar qualidade e reduzir stress da equipa",
      suggestedAction: "Revisar distribuição de tarefas e considerar suporte adicional",
    },
    {
      projectId: "GA00491",
      projectName: "JOSÉ ESTEVÃO",
      recommendation: "Fornecedor atrasado - explorar alternativas",
      priority: "high",
      estimatedImpact: "Manter cronograma do projeto",
      suggestedAction: "Contactar fornecedor alternativo para orçamento de contingência",
    },
  ];

  return recommendations;
}

/**
 * Analisa atividade da equipa
 */
export async function analyzeTeamActivity(): Promise<{
  activeMembers: number;
  inactiveMembers: number;
  averageMessagesPerDay: number;
}> {
  // Simular análise de atividade
  // Em produção, isso viria de dados reais de mensagens e atividade
  return {
    activeMembers: 8,
    inactiveMembers: 2,
    averageMessagesPerDay: 45,
  };
}

/**
 * Calcula tendência semanal
 */
export async function calculateWeeklyTrend(): Promise<
  Array<{
    date: string;
    sentimentScore: number;
    messageCount: number;
    blockerCount: number;
  }>
> {
  // Simular dados semanais
  // Em produção, isso viria de agregação de dados históricos
  const today = new Date();
  const trend = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    trend.push({
      date: date.toLocaleDateString("pt-PT", { weekday: "short", month: "short", day: "numeric" }),
      sentimentScore: 0.2 + Math.random() * 0.4,
      messageCount: 30 + Math.floor(Math.random() * 40),
      blockerCount: Math.floor(Math.random() * 3),
    });
  }

  return trend;
}

/**
 * Gera insights completos para o dashboard
 */
export async function generateBiaInsights(): Promise<BiaInsights> {
  const [teamSentiment, topBlockers, projectRecommendations, teamActivity, weeklyTrend] = await Promise.all([
    analyzeTeamSentiment(),
    identifyBlockerTrends(),
    generateProjectRecommendations(),
    analyzeTeamActivity(),
    calculateWeeklyTrend(),
  ]);

  return {
    teamSentiment,
    topBlockers,
    projectRecommendations,
    teamActivity,
    weeklyTrend,
  };
}

/**
 * Gera resumo executivo para Inês
 */
export async function generateExecutiveSummary(): Promise<string> {
  const insights = await generateBiaInsights();

  const summary = `
📊 RESUMO EXECUTIVO - INSIGHTS BIA

**Sentimento da Equipa:** ${insights.teamSentiment.overallSentiment.toUpperCase()}
- Score: ${(insights.teamSentiment.sentimentScore * 100).toFixed(0)}%
- Tendência: ${insights.teamSentiment.trendDirection}

**Bloqueios Principais:**
${insights.topBlockers.slice(0, 3).map((b) => `- ${b.category} (${b.count} ocorrências, severidade: ${b.severity})`).join("\n")}

**Recomendações Críticas:**
${insights.projectRecommendations.filter((r) => r.priority === "critical" || r.priority === "high").map((r) => `- ${r.projectName}: ${r.recommendation}`).join("\n")}

**Atividade da Equipa:**
- Membros ativos: ${insights.teamActivity.activeMembers}
- Mensagens/dia: ${insights.teamActivity.averageMessagesPerDay}

Relatório gerado por BIA 🌟
`;

  return summary;
}
