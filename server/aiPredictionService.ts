import { invokeLLM } from "./_core/llm";

/**
 * AI Prediction Service
 * Uses LLM to analyze project data and predict costs
 */

interface ProjectData {
  id: number;
  name: string;
  budget: number;
  actualCost: number;
  progress: number;
  startDate: Date;
  endDate: Date;
  status: string;
  priority: string;
  location: string;
  clientName: string;
}

interface SimilarProject {
  id: number;
  name: string;
  budget: number;
  actualCost: number;
  variance: number;
  variancePercentage: number;
}

interface CostPredictionResult {
  predictedCost: number;
  confidenceLevel: "low" | "medium" | "high";
  confidenceScore: number;
  overrunRisk: "low" | "medium" | "high" | "critical";
  overrunProbability: number;
  basedOnProjects: number[];
  factors: {
    complexity: number;
    duration: number;
    teamSize: number;
    location: string;
    projectType: string;
    historicalAccuracy: number;
  };
  recommendations: string[];
}

/**
 * Analyze similar projects to predict costs
 */
export async function predictProjectCosts(
  currentProject: ProjectData,
  similarProjects: SimilarProject[]
): Promise<CostPredictionResult> {
  try {
    // Calculate project duration in days
    const duration = Math.ceil(
      (new Date(currentProject.endDate).getTime() - new Date(currentProject.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Prepare data for LLM analysis
    const prompt = `Você é um especialista em gestão de projetos de arquitetura e construção. Analise os dados fornecidos e preveja o custo final do projeto atual.

**Projeto Atual:**
- Nome: ${currentProject.name}
- Orçamento: €${currentProject.budget.toLocaleString("pt-PT")}
- Custo Atual: €${currentProject.actualCost.toLocaleString("pt-PT")}
- Progresso: ${currentProject.progress}%
- Duração: ${duration} dias
- Status: ${currentProject.status}
- Prioridade: ${currentProject.priority}
- Localização: ${currentProject.location}
- Cliente: ${currentProject.clientName}

**Projetos Similares (Histórico):**
${similarProjects
  .map(
    (p, i) => `
${i + 1}. ${p.name}
   - Orçamento: €${p.budget.toLocaleString("pt-PT")}
   - Custo Real: €${p.actualCost.toLocaleString("pt-PT")}
   - Variação: €${p.variance.toLocaleString("pt-PT")} (${p.variancePercentage.toFixed(1)}%)
`
  )
  .join("\n")}

**Análise Solicitada:**
1. Preveja o custo final do projeto atual baseado no histórico de projetos similares
2. Calcule a probabilidade de estouro de orçamento (0-100%)
3. Avalie o nível de risco (low, medium, high, critical)
4. Determine o nível de confiança da previsão (low, medium, high) e score (0-100)
5. Forneça 3-5 recomendações práticas para mitigar riscos

**Fatores a Considerar:**
- Complexidade do projeto (baseado em orçamento e duração)
- Padrões históricos de variação de custos
- Progresso atual vs custos incorridos
- Prioridade e status do projeto
- Localização e tipo de cliente

Responda APENAS com um JSON válido no seguinte formato:
{
  "predictedCost": number,
  "confidenceLevel": "low" | "medium" | "high",
  "confidenceScore": number (0-100),
  "overrunRisk": "low" | "medium" | "high" | "critical",
  "overrunProbability": number (0-100),
  "factors": {
    "complexity": number (0-100),
    "duration": number (dias),
    "teamSize": number (estimado),
    "location": string,
    "projectType": string,
    "historicalAccuracy": number (0-100)
  },
  "recommendations": [string, string, string]
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em gestão de projetos de arquitetura e construção com 20 anos de experiência em análise financeira e previsão de custos. Responda sempre em português de Portugal e forneça análises precisas baseadas em dados históricos.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cost_prediction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictedCost: { type: "number", description: "Custo final previsto em euros" },
              confidenceLevel: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Nível de confiança da previsão",
              },
              confidenceScore: {
                type: "number",
                description: "Score de confiança de 0 a 100",
              },
              overrunRisk: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "Nível de risco de estouro de orçamento",
              },
              overrunProbability: {
                type: "number",
                description: "Probabilidade de estouro de orçamento (0-100)",
              },
              factors: {
                type: "object",
                properties: {
                  complexity: { type: "number", description: "Complexidade do projeto (0-100)" },
                  duration: { type: "number", description: "Duração em dias" },
                  teamSize: { type: "number", description: "Tamanho estimado da equipa" },
                  location: { type: "string", description: "Localização do projeto" },
                  projectType: { type: "string", description: "Tipo de projeto" },
                  historicalAccuracy: {
                    type: "number",
                    description: "Precisão histórica (0-100)",
                  },
                },
                required: [
                  "complexity",
                  "duration",
                  "teamSize",
                  "location",
                  "projectType",
                  "historicalAccuracy",
                ],
                additionalProperties: false,
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Lista de recomendações práticas",
              },
            },
            required: [
              "predictedCost",
              "confidenceLevel",
              "confidenceScore",
              "overrunRisk",
              "overrunProbability",
              "factors",
              "recommendations",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const prediction = JSON.parse(content);

    return {
      ...prediction,
      basedOnProjects: similarProjects.map((p) => p.id),
    };
  } catch (error) {
    console.error("[AIPredictionService] Error predicting costs:", error);

    // Fallback to rule-based prediction if LLM fails
    return fallbackPrediction(currentProject, similarProjects);
  }
}

/**
 * Fallback rule-based prediction when LLM is unavailable
 */
function fallbackPrediction(
  currentProject: ProjectData,
  similarProjects: SimilarProject[]
): CostPredictionResult {
  // Calculate average variance from similar projects
  const avgVariancePercentage =
    similarProjects.reduce((sum, p) => sum + p.variancePercentage, 0) / similarProjects.length;

  // Estimate remaining cost based on progress
  const remainingProgress = 100 - currentProject.progress;
  const costPerProgress = currentProject.actualCost / currentProject.progress;
  const estimatedRemainingCost = costPerProgress * remainingProgress;

  // Apply historical variance to prediction
  const predictedCost = currentProject.actualCost + estimatedRemainingCost * (1 + avgVariancePercentage / 100);

  // Calculate overrun probability
  const overrunAmount = predictedCost - currentProject.budget;
  const overrunPercentage = (overrunAmount / currentProject.budget) * 100;

  let overrunRisk: "low" | "medium" | "high" | "critical";
  let overrunProbability: number;

  if (overrunPercentage < 5) {
    overrunRisk = "low";
    overrunProbability = 20;
  } else if (overrunPercentage < 10) {
    overrunRisk = "medium";
    overrunProbability = 50;
  } else if (overrunPercentage < 20) {
    overrunRisk = "high";
    overrunProbability = 75;
  } else {
    overrunRisk = "critical";
    overrunProbability = 90;
  }

  // Determine confidence level based on number of similar projects
  let confidenceLevel: "low" | "medium" | "high";
  let confidenceScore: number;

  if (similarProjects.length < 3) {
    confidenceLevel = "low";
    confidenceScore = 40;
  } else if (similarProjects.length < 7) {
    confidenceLevel = "medium";
    confidenceScore = 65;
  } else {
    confidenceLevel = "high";
    confidenceScore = 85;
  }

  const duration = Math.ceil(
    (new Date(currentProject.endDate).getTime() - new Date(currentProject.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return {
    predictedCost: Math.round(predictedCost * 100) / 100,
    confidenceLevel,
    confidenceScore,
    overrunRisk,
    overrunProbability,
    basedOnProjects: similarProjects.map((p) => p.id),
    factors: {
      complexity: Math.min(100, (currentProject.budget / 100000) * 10),
      duration,
      teamSize: Math.ceil(currentProject.budget / 50000),
      location: currentProject.location || "Unknown",
      projectType: "Architecture & Construction",
      historicalAccuracy: confidenceScore,
    },
    recommendations: [
      overrunRisk === "critical" || overrunRisk === "high"
        ? "Reveja imediatamente o orçamento e identifique áreas de redução de custos"
        : "Mantenha o controlo rigoroso de despesas nas próximas fases",
      "Implemente aprovações adicionais para gastos acima de €5.000",
      "Realize reuniões semanais de revisão financeira com a equipa",
      similarProjects.length < 5
        ? "Aumente a base de dados de projetos históricos para melhorar previsões futuras"
        : "Continue a documentar custos detalhadamente para análises futuras",
    ],
  };
}
