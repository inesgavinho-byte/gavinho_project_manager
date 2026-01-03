import { invokeLLM } from "./_core/llm";
import type { Project } from "../drizzle/schema";

export interface DelayPrediction {
  predictedDelayDays: number;
  delayProbability: number; // 0-100
  predictedCompletionDate: Date;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  confidence: number; // 0-100
  recommendations: string[];
}

export interface CostPrediction {
  predictedFinalCost: number;
  costOverrunProbability: number; // 0-100
  estimatedCostVariance: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  confidence: number; // 0-100
  recommendations: string[];
}

export interface ProjectAnalysisContext {
  project: Project;
  currentProgress: number;
  daysElapsed: number;
  daysRemaining: number;
  budgetUsed: number;
  budgetRemaining: number;
  tasksCompleted: number;
  tasksTotal: number;
  ordersCompleted: number;
  ordersTotal: number;
  averageTaskCompletionTime: number;
  historicalSimilarProjects?: Array<{
    duration: number;
    finalCost: number;
    delayDays: number;
    complexity: string;
  }>;
}

/**
 * Predict project delays using AI analysis
 */
export async function predictProjectDelay(
  context: ProjectAnalysisContext
): Promise<DelayPrediction> {
  const { project, currentProgress, daysElapsed, daysRemaining, tasksCompleted, tasksTotal } = context;

  // Calculate velocity
  const progressVelocity = daysElapsed > 0 ? currentProgress / daysElapsed : 0;
  const remainingProgress = 100 - currentProgress;
  const estimatedDaysNeeded = progressVelocity > 0 ? remainingProgress / progressVelocity : daysRemaining * 2;

  // Basic prediction using velocity
  const basicPredictedDelay = Math.max(0, Math.round(estimatedDaysNeeded - daysRemaining));

  // Prepare context for AI analysis
  const aiPrompt = `Analyze this construction project and predict potential delays:

Project: ${project.name}
Current Progress: ${currentProgress}%
Days Elapsed: ${daysElapsed}
Days Remaining: ${daysRemaining}
Tasks Completed: ${tasksCompleted}/${tasksTotal}
Priority: ${project.priority}
Status: ${project.status}

Budget Used: €${context.budgetUsed.toLocaleString()}
Budget Remaining: €${context.budgetRemaining.toLocaleString()}
Orders Completed: ${context.ordersCompleted}/${context.ordersTotal}

Based on the current progress velocity and project status, provide a JSON response with:
1. predictedDelayDays: estimated delay in days (0 if on track)
2. delayProbability: probability of delay (0-100)
3. riskLevel: "low", "medium", "high", or "critical"
4. riskFactors: array of specific risk factors identified
5. confidence: confidence level in prediction (0-100)
6. recommendations: array of 3-5 specific actionable recommendations to prevent/mitigate delays

Consider factors like:
- Progress velocity vs remaining time
- Budget consumption rate
- Task completion rate
- Project priority and complexity
- Resource allocation patterns`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert construction project analyst specializing in delay prediction and risk assessment. Provide accurate, data-driven predictions." },
        { role: "user", content: aiPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "delay_prediction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictedDelayDays: { type: "integer", description: "Estimated delay in days" },
              delayProbability: { type: "integer", description: "Probability of delay 0-100" },
              riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
              riskFactors: { type: "array", items: { type: "string" } },
              confidence: { type: "integer", description: "Confidence level 0-100" },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["predictedDelayDays", "delayProbability", "riskLevel", "riskFactors", "confidence", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    const aiPrediction = JSON.parse(typeof content === 'string' ? content : "{}");

    const predictedCompletionDate = project.endDate ? new Date(project.endDate) : new Date();
    predictedCompletionDate.setDate(predictedCompletionDate.getDate() + aiPrediction.predictedDelayDays);

    return {
      predictedDelayDays: aiPrediction.predictedDelayDays,
      delayProbability: aiPrediction.delayProbability,
      predictedCompletionDate,
      riskLevel: aiPrediction.riskLevel,
      riskFactors: aiPrediction.riskFactors,
      confidence: aiPrediction.confidence,
      recommendations: aiPrediction.recommendations,
    };
  } catch (error) {
    console.error("AI prediction failed, using fallback:", error);

    // Fallback to rule-based prediction
    const riskFactors: string[] = [];
    let delayProbability = 0;

    if (progressVelocity < (currentProgress / daysElapsed) * 0.8) {
      riskFactors.push("Velocidade de progresso abaixo do esperado");
      delayProbability += 30;
    }

    if (context.budgetUsed / (context.budgetUsed + context.budgetRemaining) > currentProgress / 100) {
      riskFactors.push("Orçamento sendo consumido mais rápido que o progresso");
      delayProbability += 25;
    }

    if (tasksCompleted / tasksTotal < currentProgress / 100) {
      riskFactors.push("Taxa de conclusão de tarefas abaixo do progresso geral");
      delayProbability += 20;
    }

    if (project.priority === "urgent" || project.priority === "high") {
      riskFactors.push("Projeto de alta prioridade com margem reduzida");
      delayProbability += 15;
    }

    delayProbability = Math.min(100, delayProbability);

    const riskLevel: "low" | "medium" | "high" | "critical" =
      delayProbability > 75 ? "critical" :
      delayProbability > 50 ? "high" :
      delayProbability > 25 ? "medium" : "low";

    const predictedCompletionDate = project.endDate ? new Date(project.endDate) : new Date();
    predictedCompletionDate.setDate(predictedCompletionDate.getDate() + basicPredictedDelay);

    return {
      predictedDelayDays: basicPredictedDelay,
      delayProbability,
      predictedCompletionDate,
      riskLevel,
      riskFactors,
      confidence: 65,
      recommendations: [
        "Revisar alocação de recursos e prioridades de tarefas",
        "Aumentar frequência de reuniões de acompanhamento",
        "Identificar e remover bloqueadores críticos",
        "Considerar recursos adicionais para tarefas críticas",
      ],
    };
  }
}

/**
 * Predict final project cost using AI analysis
 */
export async function predictFinalCost(
  context: ProjectAnalysisContext
): Promise<CostPrediction> {
  const { project, currentProgress, budgetUsed, budgetRemaining } = context;

  const totalBudget = budgetUsed + budgetRemaining;
  const burnRate = currentProgress > 0 ? budgetUsed / currentProgress : 0;
  const projectedTotalCost = burnRate * 100;
  const basicCostVariance = projectedTotalCost - totalBudget;

  const aiPrompt = `Analyze this construction project and predict final costs:

Project: ${project.name}
Current Progress: ${currentProgress}%
Budget Used: €${budgetUsed.toLocaleString()}
Budget Remaining: €${budgetRemaining.toLocaleString()}
Total Budget: €${totalBudget.toLocaleString()}

Tasks Completed: ${context.tasksCompleted}/${context.tasksTotal}
Orders Completed: ${context.ordersCompleted}/${context.ordersTotal}
Priority: ${project.priority}

Based on the current burn rate and project status, provide a JSON response with:
1. predictedFinalCost: estimated final cost in euros
2. costOverrunProbability: probability of cost overrun (0-100)
3. estimatedCostVariance: difference from budget (positive = overrun, negative = underrun)
4. riskLevel: "low", "medium", "high", or "critical"
5. riskFactors: array of specific cost risk factors
6. confidence: confidence level in prediction (0-100)
7. recommendations: array of 3-5 specific actions to control costs

Consider:
- Current burn rate vs progress
- Remaining work complexity
- Historical patterns
- Resource efficiency
- Market conditions`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert construction cost analyst specializing in budget forecasting and cost control." },
        { role: "user", content: aiPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cost_prediction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictedFinalCost: { type: "number", description: "Estimated final cost" },
              costOverrunProbability: { type: "integer", description: "Probability of overrun 0-100" },
              estimatedCostVariance: { type: "number", description: "Variance from budget" },
              riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
              riskFactors: { type: "array", items: { type: "string" } },
              confidence: { type: "integer", description: "Confidence level 0-100" },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["predictedFinalCost", "costOverrunProbability", "estimatedCostVariance", "riskLevel", "riskFactors", "confidence", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    const aiPrediction = JSON.parse(typeof content === 'string' ? content : "{}");

    return {
      predictedFinalCost: aiPrediction.predictedFinalCost,
      costOverrunProbability: aiPrediction.costOverrunProbability,
      estimatedCostVariance: aiPrediction.estimatedCostVariance,
      riskLevel: aiPrediction.riskLevel,
      riskFactors: aiPrediction.riskFactors,
      confidence: aiPrediction.confidence,
      recommendations: aiPrediction.recommendations,
    };
  } catch (error) {
    console.error("AI cost prediction failed, using fallback:", error);

    // Fallback to rule-based prediction
    const riskFactors: string[] = [];
    let costOverrunProbability = 0;

    const budgetConsumptionRate = budgetUsed / totalBudget;
    const progressRate = currentProgress / 100;

    if (budgetConsumptionRate > progressRate * 1.1) {
      riskFactors.push("Orçamento sendo consumido mais rápido que o progresso");
      costOverrunProbability += 40;
    }

    if (burnRate > totalBudget / 100 * 1.2) {
      riskFactors.push("Taxa de queima de orçamento acima do planejado");
      costOverrunProbability += 30;
    }

    if (context.ordersCompleted < context.ordersTotal * 0.7 && currentProgress > 70) {
      riskFactors.push("Muitas encomendas pendentes para fase avançada do projeto");
      costOverrunProbability += 20;
    }

    costOverrunProbability = Math.min(100, costOverrunProbability);

    const riskLevel: "low" | "medium" | "high" | "critical" =
      costOverrunProbability > 75 ? "critical" :
      costOverrunProbability > 50 ? "high" :
      costOverrunProbability > 25 ? "medium" : "low";

    return {
      predictedFinalCost: projectedTotalCost,
      costOverrunProbability,
      estimatedCostVariance: basicCostVariance,
      riskLevel,
      riskFactors,
      confidence: 70,
      recommendations: [
        "Revisar e otimizar processos de compra",
        "Negociar melhores preços com fornecedores",
        "Identificar oportunidades de redução de custos",
        "Implementar controles de orçamento mais rigorosos",
      ],
    };
  }
}

/**
 * Generate comprehensive project risk analysis
 */
export async function analyzeProjectRisks(
  context: ProjectAnalysisContext
): Promise<{
  overallRiskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number; // 0-100
  criticalRisks: string[];
  mitigationStrategies: string[];
  confidence: number;
}> {
  const delayPrediction = await predictProjectDelay(context);
  const costPrediction = await predictFinalCost(context);

  // Combine risk assessments
  const riskScore = Math.round(
    (delayPrediction.delayProbability * 0.5) +
    (costPrediction.costOverrunProbability * 0.5)
  );

  const overallRiskLevel: "low" | "medium" | "high" | "critical" =
    riskScore > 75 ? "critical" :
    riskScore > 50 ? "high" :
    riskScore > 25 ? "medium" : "low";

  const criticalRisks = [
    ...delayPrediction.riskFactors,
    ...costPrediction.riskFactors,
  ].filter((risk, index, self) => self.indexOf(risk) === index);

  const mitigationStrategies = [
    ...delayPrediction.recommendations,
    ...costPrediction.recommendations,
  ].filter((rec, index, self) => self.indexOf(rec) === index);

  const confidence = Math.round(
    (delayPrediction.confidence + costPrediction.confidence) / 2
  );

  return {
    overallRiskLevel,
    riskScore,
    criticalRisks,
    mitigationStrategies,
    confidence,
  };
}
