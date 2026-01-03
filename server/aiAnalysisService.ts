import { invokeLLM } from "./_core/llm";
import type { Project, Task, Order, Budget, Email } from "../drizzle/schema";

export interface ProjectRiskAnalysis {
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

export interface ResourceOptimization {
  type: "resource_optimization";
  title: string;
  description: string;
  reasoning: string;
  suggestedAction: string;
  impact: "low" | "medium" | "high";
  confidence: number;
}

export interface NextActionSuggestion {
  type: "next_action";
  title: string;
  description: string;
  reasoning: string;
  suggestedAction: string;
  priority: "low" | "medium" | "high" | "critical";
  confidence: number;
}

export class AIAnalysisService {
  /**
   * Analyze project risk based on multiple factors
   */
  async analyzeProjectRisk(
    project: Project,
    tasks: Task[],
    orders: Order[],
    budgets: Budget[]
  ): Promise<ProjectRiskAnalysis> {
    const now = new Date();
    const daysUntilDeadline = project.endDate
      ? Math.ceil((new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budgetedAmount), 0);
    const totalActual = budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount), 0);
    const budgetUtilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "ordered").length;

    const prompt = `Você é um especialista em gestão de projetos de construção civil. Analise o seguinte projeto e identifique riscos:

**Projeto:** ${project.name}
**Status:** ${project.status}
**Progresso:** ${project.progress}%
**Prazo:** ${daysUntilDeadline !== null ? `${daysUntilDeadline} dias restantes` : "Não definido"}

**Métricas:**
- Taxa de conclusão de tarefas: ${taskCompletionRate.toFixed(1)}% (${completedTasks}/${totalTasks})
- Utilização do orçamento: ${budgetUtilization.toFixed(1)}%
- Encomendas pendentes: ${pendingOrders}
- Orçamento total: €${totalBudget.toFixed(2)}
- Gasto atual: €${totalActual.toFixed(2)}

Analise os riscos e forneça recomendações específicas.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em gestão de projetos de construção. Analise riscos e forneça recomendações práticas. Sempre responda em JSON válido.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "project_risk_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                riskLevel: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "Nível de risco geral do projeto",
                },
                riskFactors: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de fatores de risco identificados",
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                  description: "Recomendações específicas para mitigar riscos",
                },
                confidence: {
                  type: "number",
                  description: "Confiança da análise (0-1)",
                },
              },
              required: ["riskLevel", "riskFactors", "recommendations", "confidence"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("No response from AI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("[AIAnalysisService] Error analyzing project risk:", error);
      return this.fallbackRiskAnalysis(project, daysUntilDeadline, taskCompletionRate, budgetUtilization);
    }
  }

  /**
   * Fallback risk analysis using rule-based logic
   */
  private fallbackRiskAnalysis(
    project: Project,
    daysUntilDeadline: number | null,
    taskCompletionRate: number,
    budgetUtilization: number
  ): ProjectRiskAnalysis {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Deadline risk
    if (daysUntilDeadline !== null && daysUntilDeadline < 7 && project.progress < 90) {
      riskFactors.push("Prazo próximo com progresso insuficiente");
      riskScore += 3;
    } else if (daysUntilDeadline !== null && daysUntilDeadline < 30 && project.progress < 70) {
      riskFactors.push("Prazo apertado");
      riskScore += 2;
    }

    // Task completion risk
    if (taskCompletionRate < 50 && project.progress > 50) {
      riskFactors.push("Taxa de conclusão de tarefas baixa em relação ao progresso");
      riskScore += 2;
    }

    // Budget risk
    if (budgetUtilization > 90 && project.progress < 90) {
      riskFactors.push("Orçamento quase esgotado com projeto incompleto");
      riskScore += 3;
    } else if (budgetUtilization > 100) {
      riskFactors.push("Orçamento excedido");
      riskScore += 4;
    }

    // Status risk
    if (project.status === "on_hold") {
      riskFactors.push("Projeto em pausa");
      riskScore += 2;
    }

    const riskLevel: ProjectRiskAnalysis["riskLevel"] =
      riskScore >= 6 ? "critical" : riskScore >= 4 ? "high" : riskScore >= 2 ? "medium" : "low";

    const recommendations: string[] = [];
    if (riskFactors.length === 0) {
      recommendations.push("Projeto em bom andamento, continue monitorando");
    } else {
      if (budgetUtilization > 90) {
        recommendations.push("Revisar orçamento e identificar áreas de economia");
      }
      if (daysUntilDeadline !== null && daysUntilDeadline < 30) {
        recommendations.push("Priorizar tarefas críticas e aumentar recursos se necessário");
      }
      if (taskCompletionRate < 60) {
        recommendations.push("Revisar impedimentos nas tarefas e realocar recursos");
      }
    }

    return {
      riskLevel,
      riskFactors: riskFactors.length > 0 ? riskFactors : ["Nenhum risco significativo identificado"],
      recommendations,
      confidence: 0.75,
    };
  }

  /**
   * Generate resource optimization suggestions
   */
  async generateResourceOptimization(
    project: Project,
    tasks: Task[],
    orders: Order[]
  ): Promise<ResourceOptimization[]> {
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
    );
    const highPriorityTasks = tasks.filter((t) => t.priority === "urgent" || t.priority === "high");
    const pendingOrders = orders.filter((o) => o.status === "pending");

    const prompt = `Analise a alocação de recursos do projeto "${project.name}":

**Tarefas atrasadas:** ${overdueTasks.length}
**Tarefas de alta prioridade:** ${highPriorityTasks.length}
**Encomendas pendentes:** ${pendingOrders.length}
**Total de tarefas:** ${tasks.length}

Sugira otimizações de recursos e priorização.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em otimização de recursos em projetos de construção. Forneça sugestões práticas e acionáveis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resource_optimization",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      reasoning: { type: "string" },
                      suggestedAction: { type: "string" },
                      impact: { type: "string", enum: ["low", "medium", "high"] },
                      confidence: { type: "number" },
                    },
                    required: ["title", "description", "reasoning", "suggestedAction", "impact", "confidence"],
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

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(content);
      return parsed.suggestions.map((s: any) => ({
        type: "resource_optimization" as const,
        ...s,
      }));
    } catch (error) {
      console.error("[AIAnalysisService] Error generating resource optimization:", error);
      return this.fallbackResourceOptimization(overdueTasks.length, highPriorityTasks.length, pendingOrders.length);
    }
  }

  /**
   * Fallback resource optimization
   */
  private fallbackResourceOptimization(
    overdueTasks: number,
    highPriorityTasks: number,
    pendingOrders: number
  ): ResourceOptimization[] {
    const suggestions: ResourceOptimization[] = [];

    if (overdueTasks > 0) {
      suggestions.push({
        type: "resource_optimization",
        title: "Resolver tarefas atrasadas",
        description: `Existem ${overdueTasks} tarefas atrasadas que precisam de atenção imediata`,
        reasoning: "Tarefas atrasadas podem impactar o cronograma geral do projeto",
        suggestedAction: "Realocar recursos para concluir tarefas atrasadas prioritariamente",
        impact: "high",
        confidence: 0.9,
      });
    }

    if (highPriorityTasks > 3) {
      suggestions.push({
        type: "resource_optimization",
        title: "Priorizar tarefas críticas",
        description: `${highPriorityTasks} tarefas de alta prioridade requerem atenção`,
        reasoning: "Concentrar esforços em tarefas críticas garante progresso eficiente",
        suggestedAction: "Revisar e priorizar tarefas urgentes, delegando tarefas de menor prioridade",
        impact: "medium",
        confidence: 0.85,
      });
    }

    if (pendingOrders > 5) {
      suggestions.push({
        type: "resource_optimization",
        title: "Processar encomendas pendentes",
        description: `${pendingOrders} encomendas aguardam processamento`,
        reasoning: "Encomendas pendentes podem causar atrasos na execução",
        suggestedAction: "Revisar e aprovar encomendas pendentes para evitar gargalos",
        impact: "medium",
        confidence: 0.8,
      });
    }

    return suggestions;
  }

  /**
   * Generate next action suggestions
   */
  async generateNextActions(
    project: Project,
    tasks: Task[],
    orders: Order[],
    emails: Email[]
  ): Promise<NextActionSuggestion[]> {
    const todoTasks = tasks.filter((t) => t.status === "todo").slice(0, 5);
    const recentEmails = emails.filter((e) => e.category === "order" || e.category === "adjudication").slice(0, 3);

    const prompt = `Com base no projeto "${project.name}" (progresso: ${project.progress}%), sugira as próximas ações prioritárias:

**Tarefas pendentes:** ${todoTasks.length}
**E-mails recentes relevantes:** ${recentEmails.length}
**Status do projeto:** ${project.status}

Sugira 2-3 próximas ações concretas e prioritárias.`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um assistente de gestão de projetos. Sugira ações específicas e acionáveis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "next_actions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      reasoning: { type: "string" },
                      suggestedAction: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      confidence: { type: "number" },
                    },
                    required: ["title", "description", "reasoning", "suggestedAction", "priority", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["actions"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(content);
      return parsed.actions.map((a: any) => ({
        type: "next_action" as const,
        ...a,
      }));
    } catch (error) {
      console.error("[AIAnalysisService] Error generating next actions:", error);
      return this.fallbackNextActions(project, todoTasks.length);
    }
  }

  /**
   * Fallback next actions
   */
  private fallbackNextActions(project: Project, todoTasks: number): NextActionSuggestion[] {
    const suggestions: NextActionSuggestion[] = [];

    if (project.progress < 10) {
      suggestions.push({
        type: "next_action",
        title: "Iniciar execução do projeto",
        description: "O projeto está em fase inicial",
        reasoning: "Progresso ainda muito baixo, é importante começar a executar tarefas",
        suggestedAction: "Revisar plano de trabalho e iniciar primeiras tarefas prioritárias",
        priority: "high",
        confidence: 0.9,
      });
    }

    if (todoTasks > 0) {
      suggestions.push({
        type: "next_action",
        title: "Avançar com tarefas pendentes",
        description: `Existem ${todoTasks} tarefas aguardando início`,
        reasoning: "Tarefas pendentes precisam ser iniciadas para manter o progresso",
        suggestedAction: "Selecionar e iniciar próximas tarefas prioritárias",
        priority: "medium",
        confidence: 0.85,
      });
    }

    if (project.progress > 80 && project.progress < 100) {
      suggestions.push({
        type: "next_action",
        title: "Finalizar projeto",
        description: "Projeto próximo da conclusão",
        reasoning: "Com mais de 80% concluído, é hora de focar na finalização",
        suggestedAction: "Revisar pendências e preparar entrega final",
        priority: "high",
        confidence: 0.9,
      });
    }

    return suggestions;
  }
}

export const aiAnalysisService = new AIAnalysisService();
