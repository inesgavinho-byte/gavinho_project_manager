import { invokeLLM } from "./_core/llm";
import type { Project } from "../drizzle/schema";

export interface ScenarioParameters {
  budgetAdjustment?: number; // absolute amount
  budgetPercentage?: number; // percentage change
  teamSizeAdjustment?: number; // +/- team members
  timelineAdjustment?: number; // +/- days
  resourceAllocation?: Record<string, number>; // resource: amount
}

export interface ScenarioImpact {
  predictedDuration: number; // days
  predictedCost: number;
  predictedDelayDays: number;
  costVariance: number;
  feasibilityScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  impactSummary: string;
  recommendations: string[];
  tradeoffs: Array<{
    aspect: string;
    positive: string;
    negative: string;
  }>;
}

export interface ProjectContext {
  project: Project;
  currentBudget: number;
  currentTeamSize: number;
  currentDuration: number; // days
  currentProgress: number; // percentage
  tasksCount: number;
  ordersCount: number;
}

/**
 * Simulate what-if scenario using AI analysis
 */
export async function simulateScenario(
  context: ProjectContext,
  parameters: ScenarioParameters
): Promise<ScenarioImpact> {
  const { project, currentBudget, currentTeamSize, currentDuration } = context;

  // Calculate adjusted values
  const adjustedBudget = parameters.budgetAdjustment
    ? currentBudget + parameters.budgetAdjustment
    : parameters.budgetPercentage
    ? currentBudget * (1 + parameters.budgetPercentage / 100)
    : currentBudget;

  const adjustedTeamSize = currentTeamSize + (parameters.teamSizeAdjustment || 0);
  const adjustedTimeline = currentDuration + (parameters.timelineAdjustment || 0);

  // Basic calculations for fallback
  const budgetChange = ((adjustedBudget - currentBudget) / currentBudget) * 100;
  const teamChange = adjustedTeamSize - currentTeamSize;
  const timelineChange = adjustedTimeline - currentDuration;

  // Estimate impact using rules (fallback)
  let durationImpact = 0;
  let costImpact = 0;

  // Team size impact on duration (more team = faster, but diminishing returns)
  if (teamChange > 0) {
    durationImpact -= Math.floor(teamChange * 3 * (1 - teamChange * 0.05)); // diminishing returns
  } else if (teamChange < 0) {
    durationImpact += Math.abs(teamChange) * 5; // slower with fewer people
  }

  // Timeline adjustment direct impact
  durationImpact += timelineChange;

  // Budget impact on cost
  costImpact = adjustedBudget - currentBudget;

  // Team size impact on cost
  if (teamChange !== 0) {
    const avgSalaryPerDay = 200; // estimate
    costImpact += teamChange * currentDuration * avgSalaryPerDay;
  }

  const aiPrompt = `Analyze this construction project what-if scenario:

**Current Project State:**
- Project: ${project.name}
- Current Budget: €${currentBudget.toLocaleString()}
- Current Team Size: ${currentTeamSize} members
- Current Duration: ${currentDuration} days
- Current Progress: ${context.currentProgress}%
- Tasks: ${context.tasksCount}
- Orders: ${context.ordersCount}
- Priority: ${project.priority}

**Proposed Changes:**
${parameters.budgetAdjustment ? `- Budget Adjustment: €${parameters.budgetAdjustment > 0 ? '+' : ''}${parameters.budgetAdjustment.toLocaleString()}` : ''}
${parameters.budgetPercentage ? `- Budget Change: ${parameters.budgetPercentage > 0 ? '+' : ''}${parameters.budgetPercentage}%` : ''}
${parameters.teamSizeAdjustment ? `- Team Size Change: ${parameters.teamSizeAdjustment > 0 ? '+' : ''}${parameters.teamSizeAdjustment} members` : ''}
${parameters.timelineAdjustment ? `- Timeline Change: ${parameters.timelineAdjustment > 0 ? '+' : ''}${parameters.timelineAdjustment} days` : ''}
${parameters.resourceAllocation ? `- Resource Allocation: ${JSON.stringify(parameters.resourceAllocation)}` : ''}

**Adjusted Values:**
- New Budget: €${adjustedBudget.toLocaleString()}
- New Team Size: ${adjustedTeamSize} members
- New Timeline: ${adjustedTimeline} days

Provide a JSON response with:
1. predictedDuration: estimated total duration in days with these changes
2. predictedCost: estimated total cost in euros
3. predictedDelayDays: estimated delay compared to original deadline (0 if on time, negative if early)
4. costVariance: difference from original budget (positive = over, negative = under)
5. feasibilityScore: how feasible is this scenario (0-100, consider resources, timeline, budget)
6. riskLevel: "low", "medium", "high", or "critical"
7. impactSummary: 2-3 sentence summary of the overall impact
8. recommendations: array of 3-5 specific recommendations for this scenario
9. tradeoffs: array of 2-3 objects with {aspect, positive, negative} describing trade-offs

Consider:
- Team productivity (more people ≠ proportionally faster, Brooks's Law)
- Resource constraints and availability
- Budget efficiency and diminishing returns
- Quality vs speed vs cost trade-offs
- Risk factors (tight deadlines, budget constraints, team capacity)`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert construction project manager specializing in resource allocation optimization and scenario planning. Provide realistic, data-driven assessments.",
        },
        { role: "user", content: aiPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "scenario_impact",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictedDuration: { type: "integer" },
              predictedCost: { type: "number" },
              predictedDelayDays: { type: "integer" },
              costVariance: { type: "number" },
              feasibilityScore: { type: "integer" },
              riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
              impactSummary: { type: "string" },
              recommendations: { type: "array", items: { type: "string" } },
              tradeoffs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    aspect: { type: "string" },
                    positive: { type: "string" },
                    negative: { type: "string" },
                  },
                  required: ["aspect", "positive", "negative"],
                  additionalProperties: false,
                },
              },
            },
            required: [
              "predictedDuration",
              "predictedCost",
              "predictedDelayDays",
              "costVariance",
              "feasibilityScore",
              "riskLevel",
              "impactSummary",
              "recommendations",
              "tradeoffs",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    const aiResult = JSON.parse(typeof content === "string" ? content : "{}");

    return {
      predictedDuration: aiResult.predictedDuration,
      predictedCost: aiResult.predictedCost,
      predictedDelayDays: aiResult.predictedDelayDays,
      costVariance: aiResult.costVariance,
      feasibilityScore: aiResult.feasibilityScore,
      riskLevel: aiResult.riskLevel,
      impactSummary: aiResult.impactSummary,
      recommendations: aiResult.recommendations,
      tradeoffs: aiResult.tradeoffs,
    };
  } catch (error) {
    console.error("AI simulation failed, using fallback:", error);

    // Fallback to rule-based simulation
    const predictedDuration = Math.max(1, currentDuration + durationImpact);
    const predictedCost = currentBudget + costImpact;
    const predictedDelayDays = Math.max(0, predictedDuration - currentDuration);
    const costVariance = predictedCost - currentBudget;

    // Calculate feasibility score
    let feasibilityScore = 100;
    if (adjustedBudget < currentBudget * 0.8) feasibilityScore -= 30; // too little budget
    if (adjustedTeamSize < 2) feasibilityScore -= 40; // too few people
    if (adjustedTimeline < currentDuration * 0.5) feasibilityScore -= 50; // unrealistic timeline
    feasibilityScore = Math.max(0, Math.min(100, feasibilityScore));

    const riskLevel: "low" | "medium" | "high" | "critical" =
      feasibilityScore < 40 ? "critical" :
      feasibilityScore < 60 ? "high" :
      feasibilityScore < 80 ? "medium" : "low";

    const tradeoffs: Array<{ aspect: string; positive: string; negative: string }> = [];

    if (teamChange > 0) {
      tradeoffs.push({
        aspect: "Tamanho da Equipe",
        positive: "Mais recursos disponíveis para executar tarefas em paralelo",
        negative: "Aumento de custos com salários e possível sobrecarga de comunicação",
      });
    }

    if (budgetChange > 0) {
      tradeoffs.push({
        aspect: "Orçamento",
        positive: "Mais flexibilidade para contratar recursos e adquirir materiais de qualidade",
        negative: "Maior pressão para justificar ROI e risco de desperdício",
      });
    }

    if (timelineChange < 0) {
      tradeoffs.push({
        aspect: "Prazo",
        positive: "Entrega mais rápida e possível redução de custos indiretos",
        negative: "Maior pressão sobre a equipe e risco de comprometer qualidade",
      });
    }

    return {
      predictedDuration,
      predictedCost,
      predictedDelayDays,
      costVariance,
      feasibilityScore,
      riskLevel,
      impactSummary: `Com as alterações propostas, o projeto levará aproximadamente ${predictedDuration} dias e custará €${predictedCost.toLocaleString()}. ${costVariance > 0 ? `Haverá um estouro de orçamento de €${costVariance.toLocaleString()}.` : `Ficará dentro do orçamento com economia de €${Math.abs(costVariance).toLocaleString()}.`}`,
      recommendations: [
        "Revisar a alocação de recursos para otimizar eficiência",
        "Monitorar de perto o progresso nas primeiras semanas",
        "Estabelecer checkpoints regulares para ajustes",
        "Considerar riscos de dependências entre tarefas",
      ],
      tradeoffs,
    };
  }
}

/**
 * Compare multiple scenarios side by side
 */
export async function compareScenarios(
  context: ProjectContext,
  scenarios: Array<{ name: string; parameters: ScenarioParameters }>
): Promise<
  Array<{
    name: string;
    impact: ScenarioImpact;
    relativeCost: number; // percentage vs baseline
    relativeTime: number; // percentage vs baseline
  }>
> {
  const results = await Promise.all(
    scenarios.map(async (scenario) => {
      const impact = await simulateScenario(context, scenario.parameters);
      return {
        name: scenario.name,
        impact,
        relativeCost: ((impact.predictedCost - context.currentBudget) / context.currentBudget) * 100,
        relativeTime: ((impact.predictedDuration - context.currentDuration) / context.currentDuration) * 100,
      };
    })
  );

  return results;
}

/**
 * Find optimal scenario based on constraints
 */
export async function findOptimalScenario(
  context: ProjectContext,
  constraints: {
    maxBudget?: number;
    maxDuration?: number;
    minFeasibility?: number;
    maxRiskLevel?: "low" | "medium" | "high" | "critical";
  }
): Promise<{
  parameters: ScenarioParameters;
  impact: ScenarioImpact;
  score: number; // 0-100, how well it meets constraints
}> {
  // Generate candidate scenarios
  const candidates: ScenarioParameters[] = [
    // Baseline
    {},
    // Budget variations
    { budgetPercentage: 10 },
    { budgetPercentage: 20 },
    { budgetPercentage: -10 },
    // Team variations
    { teamSizeAdjustment: 2 },
    { teamSizeAdjustment: 5 },
    { teamSizeAdjustment: -1 },
    // Timeline variations
    { timelineAdjustment: -7 },
    { timelineAdjustment: -14 },
    { timelineAdjustment: 7 },
    // Combined
    { budgetPercentage: 15, teamSizeAdjustment: 3 },
    { budgetPercentage: 10, timelineAdjustment: -7 },
    { teamSizeAdjustment: 2, timelineAdjustment: -5 },
  ];

  const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 };
  const maxRiskValue = constraints.maxRiskLevel ? riskLevels[constraints.maxRiskLevel] : 4;

  let bestScenario: { parameters: ScenarioParameters; impact: ScenarioImpact; score: number } | null = null;

  for (const params of candidates) {
    const impact = await simulateScenario(context, params);

    // Check hard constraints
    if (constraints.maxBudget && impact.predictedCost > constraints.maxBudget) continue;
    if (constraints.maxDuration && impact.predictedDuration > constraints.maxDuration) continue;
    if (constraints.minFeasibility && impact.feasibilityScore < constraints.minFeasibility) continue;
    if (riskLevels[impact.riskLevel] > maxRiskValue) continue;

    // Calculate score (higher is better)
    let score = impact.feasibilityScore;
    score += (100 - Math.abs(impact.costVariance / context.currentBudget * 100)) * 0.5; // prefer staying close to budget
    score += (100 - Math.abs(impact.predictedDelayDays / context.currentDuration * 100)) * 0.5; // prefer on-time
    score -= riskLevels[impact.riskLevel] * 10; // penalize higher risk

    if (!bestScenario || score > bestScenario.score) {
      bestScenario = { parameters: params, impact, score };
    }
  }

  if (!bestScenario) {
    // No scenario meets constraints, return baseline
    const impact = await simulateScenario(context, {});
    return { parameters: {}, impact, score: 0 };
  }

  return bestScenario;
}
