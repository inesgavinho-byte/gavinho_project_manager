import { useState } from "react";
import { trpc } from "../lib/trpc";
import { AlertTriangle, TrendingUp, Target, Brain, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function CostPredictionDashboard() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Query all projects
  const { data: allProjects, isLoading: loadingProjects } = trpc.projects.list.useQuery();

  // Query high risk projects
  const { data: highRiskProjects, isLoading: loadingHighRisk, refetch: refetchHighRisk } = trpc.financial.getHighRiskProjects.useQuery();

  // Query prediction for selected project
  const { data: latestPrediction, refetch: refetchPrediction } = trpc.financial.getLatestCostPrediction.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  // Query similar projects
  const { data: similarProjects } = trpc.financial.findSimilarProjects.useQuery(
    { projectId: selectedProjectId!, limit: 5 },
    { enabled: !!selectedProjectId }
  );

  // Mutation to generate prediction
  const predictMutation = trpc.financial.predictProjectCosts.useMutation({
    onSuccess: () => {
      toast({
        title: "Previsão gerada",
        description: "A previsão de custos foi gerada com sucesso.",
      });
      refetchPrediction();
      refetchHighRisk();
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar previsão",
        description: error.message,
        variant: "destructive",
      });
      setIsAnalyzing(false);
    },
  });

  const handleAnalyzeProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setIsAnalyzing(true);
    predictMutation.mutate({ projectId });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "#10B981";
      case "medium":
        return "#F59E0B";
      case "high":
        return "#EF4444";
      case "critical":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low":
        return "Baixo";
      case "medium":
        return "Médio";
      case "high":
        return "Alto";
      case "critical":
        return "Crítico";
      default:
        return "Desconhecido";
    }
  };

  const getConfidenceLabel = (level: string) => {
    switch (level) {
      case "low":
        return "Baixa";
      case "medium":
        return "Média";
      case "high":
        return "Alta";
      default:
        return "Desconhecida";
    }
  };

  // Prepare chart data
  const riskDistributionData = highRiskProjects
    ? [
        { name: "Baixo", value: highRiskProjects.filter((p) => p.overrunRisk === "low").length, color: "#10B981" },
        { name: "Médio", value: highRiskProjects.filter((p) => p.overrunRisk === "medium").length, color: "#F59E0B" },
        { name: "Alto", value: highRiskProjects.filter((p) => p.overrunRisk === "high").length, color: "#EF4444" },
        { name: "Crítico", value: highRiskProjects.filter((p) => p.overrunRisk === "critical").length, color: "#DC2626" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F0E7" }}>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5F5C59" }}>
            Previsão de Custos com IA
          </h1>
          <p className="text-gray-600">Análise preditiva baseada em histórico de projetos similares</p>
        </div>

        {/* High Risk Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="font-semibold text-lg" style={{ color: "#5F5C59" }}>
                Projetos em Risco
              </h3>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: "#C9A882" }}>
              {loadingHighRisk ? "..." : highRiskProjects?.length || 0}
            </p>
            <p className="text-sm text-gray-600">Projetos com risco alto ou crítico</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6" style={{ color: "#C9A882" }} />
              <h3 className="font-semibold text-lg" style={{ color: "#5F5C59" }}>
                Análises Realizadas
              </h3>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: "#C9A882" }}>
              {loadingProjects ? "..." : allProjects?.length || 0}
            </p>
            <p className="text-sm text-gray-600">Total de projetos analisáveis</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-green-500" />
              <h3 className="font-semibold text-lg" style={{ color: "#5F5C59" }}>
                Precisão Média
              </h3>
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: "#C9A882" }}>
              {latestPrediction ? `${latestPrediction.confidenceScore}%` : "N/A"}
            </p>
            <p className="text-sm text-gray-600">Baseado em projetos históricos</p>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        {riskDistributionData.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
              Distribuição de Risco
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Project Selection */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
          <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
            Analisar Projeto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingProjects ? (
              <p className="text-gray-500">A carregar projetos...</p>
            ) : allProjects && allProjects.length > 0 ? (
              allProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleAnalyzeProject(project.id)}
                  disabled={isAnalyzing}
                  className="text-left p-4 rounded-lg border border-gray-200 hover:border-[#C9A882] transition-colors"
                >
                  <h4 className="font-semibold mb-2" style={{ color: "#5F5C59" }}>
                    {project.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Orçamento: €{Number(project.budget || 0).toLocaleString("pt-PT")}
                  </p>
                  <p className="text-sm text-gray-600">Progresso: {project.progress}%</p>
                </button>
              ))
            ) : (
              <p className="text-gray-500">Nenhum projeto disponível</p>
            )}
          </div>
        </div>

        {/* Prediction Results */}
        {latestPrediction && selectedProjectId && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Custo Previsto</p>
                <p className="text-2xl font-bold" style={{ color: "#C9A882" }}>
                  €{Number(latestPrediction.predictedCost).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Nível de Confiança</p>
                <p className="text-2xl font-bold" style={{ color: "#C9A882" }}>
                  {getConfidenceLabel(latestPrediction.confidenceLevel)} ({latestPrediction.confidenceScore}%)
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Risco de Estouro</p>
                <p className="text-2xl font-bold" style={{ color: getRiskColor(latestPrediction.overrunRisk) }}>
                  {getRiskLabel(latestPrediction.overrunRisk)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Probabilidade</p>
                <p className="text-2xl font-bold" style={{ color: getRiskColor(latestPrediction.overrunRisk) }}>
                  {latestPrediction.overrunProbability}%
                </p>
              </div>
            </div>

            {/* Factors */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
                Fatores de Análise
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Complexidade</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${latestPrediction.factors.complexity}%`,
                          backgroundColor: "#C9A882",
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{latestPrediction.factors.complexity}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Duração</p>
                  <p className="font-semibold">{latestPrediction.factors.duration} dias</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tamanho da Equipa</p>
                  <p className="font-semibold">{latestPrediction.factors.teamSize} pessoas</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Localização</p>
                  <p className="font-semibold">{latestPrediction.factors.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo de Projeto</p>
                  <p className="font-semibold">{latestPrediction.factors.projectType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Precisão Histórica</p>
                  <p className="font-semibold">{latestPrediction.factors.historicalAccuracy}%</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6" style={{ color: "#C9A882" }} />
                <h3 className="font-semibold text-lg" style={{ color: "#5F5C59" }}>
                  Recomendações da IA
                </h3>
              </div>
              <ul className="space-y-3">
                {latestPrediction.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A882" }}>
                      <span className="text-white text-sm font-semibold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{rec}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Similar Projects */}
            {similarProjects && similarProjects.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
                  Projetos Similares Analisados
                </h3>
                <div className="space-y-3">
                  {similarProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold" style={{ color: "#5F5C59" }}>
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Orçamento: €{project.budget.toLocaleString("pt-PT")} | Real: €{project.actualCost.toLocaleString("pt-PT")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${project.variance >= 0 ? "text-red-500" : "text-green-500"}`}>
                          {project.variancePercentage >= 0 ? "+" : ""}
                          {project.variancePercentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">variação</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "#C9A882" }} />
            <p className="text-lg font-semibold mb-2" style={{ color: "#5F5C59" }}>
              A analisar projeto...
            </p>
            <p className="text-gray-600">A IA está a processar dados históricos e a gerar previsões</p>
          </div>
        )}
      </div>
    </div>
  );
}
