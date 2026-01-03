import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Clock, Target, Lightbulb, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Predictions() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: criticalPredictions } = trpc.predictions.getCriticalPredictions.useQuery();
  const { data: projectPredictions, refetch: refetchPredictions } = trpc.predictions.getProjectPredictions.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const analyzeMutation = trpc.predictions.analyzeProject.useMutation({
    onSuccess: () => {
      toast.success("Análise preditiva concluída");
      refetchPredictions();
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
    },
  });

  const handleAnalyze = () => {
    if (!selectedProjectId) {
      toast.error("Selecione um projeto");
      return;
    }
    analyzeMutation.mutate({ projectId: selectedProjectId });
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      low: { variant: "secondary", className: "bg-green-100 text-green-800" },
      medium: { variant: "secondary", className: "bg-yellow-100 text-yellow-800" },
      high: { variant: "secondary", className: "bg-orange-100 text-orange-800" },
      critical: { variant: "destructive", className: "" },
    };
    const config = variants[riskLevel] || variants.medium;
    return (
      <Badge variant={config.variant} className={config.className}>
        {riskLevel.toUpperCase()}
      </Badge>
    );
  };

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const delayPrediction = projectPredictions?.find(p => p.predictionType === "delay");
  const costPrediction = projectPredictions?.find(p => p.predictionType === "cost");
  const riskPrediction = projectPredictions?.find(p => p.predictionType === "risk");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análise Preditiva</h1>
          <p className="text-muted-foreground mt-1">Previsão de atrasos e custos finais com IA</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalPredictions && criticalPredictions.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Alertas Críticos</CardTitle>
            </div>
            <CardDescription>Projetos com alto risco identificado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalPredictions.slice(0, 3).map((prediction) => (
                <div key={prediction.id} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Projeto #{prediction.projectId}</div>
                      <div className="text-sm text-muted-foreground">
                        {prediction.predictionType === "delay" && "Previsão de Atraso"}
                        {prediction.predictionType === "cost" && "Previsão de Custo"}
                        {prediction.predictionType === "risk" && "Análise de Risco"}
                      </div>
                    </div>
                    {getRiskBadge(prediction.riskLevel)}
                  </div>
                  {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Fatores de Risco:</span>
                      <ul className="list-disc list-inside mt-1 text-muted-foreground">
                        {prediction.riskFactors.slice(0, 2).map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Analisar Projeto</CardTitle>
          <CardDescription>Selecione um projeto para análise preditiva detalhada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select
              value={selectedProjectId?.toString()}
              onValueChange={(value) => setSelectedProjectId(parseInt(value))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAnalyze}
              disabled={!selectedProjectId || analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? "Analisando..." : "Analisar"}
            </Button>
          </div>

          {selectedProject && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Progresso</div>
                <div className="text-2xl font-bold">{selectedProject.progress || 0}%</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-2xl font-bold capitalize">{selectedProject.status}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Prioridade</div>
                <div className="text-2xl font-bold capitalize">{selectedProject.priority}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predictions Results */}
      {projectPredictions && projectPredictions.length > 0 && (
        <>
          {/* Delay Prediction */}
          {delayPrediction && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <CardTitle>Previsão de Atrasos</CardTitle>
                  </div>
                  {getRiskBadge(delayPrediction.riskLevel)}
                </div>
                <CardDescription>
                  Análise realizada em {new Date(delayPrediction.analysisDate).toLocaleString("pt-PT")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Atraso Previsto
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {delayPrediction.predictedDelayDays || 0} dias
                      </div>
                      {delayPrediction.predictedCompletionDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Nova data: {new Date(delayPrediction.predictedCompletionDate).toLocaleDateString("pt-PT")}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Probabilidade de Atraso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {delayPrediction.delayProbability || 0}%
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-orange-600"
                          style={{ width: `${delayPrediction.delayProbability || 0}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Confiança da Previsão
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {delayPrediction.confidence || 0}%
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${delayPrediction.confidence || 0}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {delayPrediction.riskFactors && delayPrediction.riskFactors.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Fatores de Risco Identificados
                    </h3>
                    <ul className="space-y-2">
                      {delayPrediction.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {delayPrediction.recommendations && delayPrediction.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      Recomendações
                    </h3>
                    <ul className="space-y-2">
                      {delayPrediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cost Prediction */}
          {costPrediction && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <CardTitle>Previsão de Custos</CardTitle>
                  </div>
                  {getRiskBadge(costPrediction.riskLevel)}
                </div>
                <CardDescription>
                  Estimativa de custo final do projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Custo Final Previsto
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        €{parseFloat(costPrediction.predictedFinalCost?.toString() || "0").toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Variação do Orçamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${parseFloat(costPrediction.estimatedCostVariance?.toString() || "0") > 0 ? "text-red-600" : "text-green-600"}`}>
                        {parseFloat(costPrediction.estimatedCostVariance?.toString() || "0") > 0 ? "+" : ""}
                        €{Math.abs(parseFloat(costPrediction.estimatedCostVariance?.toString() || "0")).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm">
                        {parseFloat(costPrediction.estimatedCostVariance?.toString() || "0") > 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">Acima do orçamento</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Dentro do orçamento</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Prob. de Estouro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {costPrediction.costOverrunProbability || 0}%
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-red-600"
                          style={{ width: `${costPrediction.costOverrunProbability || 0}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {costPrediction.riskFactors && costPrediction.riskFactors.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Fatores de Risco de Custo
                    </h3>
                    <ul className="space-y-2">
                      {costPrediction.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {costPrediction.recommendations && costPrediction.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      Recomendações de Controle de Custos
                    </h3>
                    <ul className="space-y-2">
                      {costPrediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Risk Analysis */}
          {riskPrediction && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <CardTitle>Análise de Risco Geral</CardTitle>
                  </div>
                  {getRiskBadge(riskPrediction.riskLevel)}
                </div>
                <CardDescription>
                  Avaliação consolidada de riscos do projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {riskPrediction.riskFactors && riskPrediction.riskFactors.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Riscos Críticos
                    </h3>
                    <ul className="space-y-2">
                      {riskPrediction.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-red-600 mt-1">⚠</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {riskPrediction.recommendations && riskPrediction.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      Estratégias de Mitigação
                    </h3>
                    <ul className="space-y-2">
                      {riskPrediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-blue-600 mt-1">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!projectPredictions && selectedProjectId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Clique em "Analisar" para gerar predições para este projeto
          </CardContent>
        </Card>
      )}
    </div>
  );
}
