import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Star, Trash2, Target, AlertCircle, Shield, Share2, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import ScenarioSharingDialog from "@/components/ScenarioSharingDialog";
import ScenarioCommentsDialog from "@/components/ScenarioCommentsDialog";

export default function WhatIfSimulation() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [budgetPercentage, setBudgetPercentage] = useState(0);
  const [teamSizeAdjustment, setTeamSizeAdjustment] = useState(0);
  const [timelineAdjustment, setTimelineAdjustment] = useState(0);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedScenarioForShare, setSelectedScenarioForShare] = useState<number | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [selectedScenarioForComments, setSelectedScenarioForComments] = useState<number | null>(null);

  const { data: projects } = trpc.projects.list.useQuery();
  const simulateMutation = trpc.whatIf.simulate.useMutation();
  const { data: savedScenarios, refetch: refetchScenarios } = trpc.whatIf.getScenarios.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const toggleFavoriteMutation = trpc.whatIf.toggleFavorite.useMutation();
  const deleteScenarioMutation = trpc.whatIf.deleteScenario.useMutation();

  const handleSimulate = async (saveScenario: boolean = false) => {
    if (!selectedProjectId) {
      toast.error("Selecione um projeto");
      return;
    }

    if (saveScenario && !scenarioName.trim()) {
      toast.error("Digite um nome para o cenário");
      return;
    }

    try {
      const result = await simulateMutation.mutateAsync({
        projectId: selectedProjectId,
        scenarioName: scenarioName || "Simulação Rápida",
        budgetPercentage,
        teamSizeAdjustment,
        timelineAdjustment,
        saveScenario,
      });

      setSimulationResult(result);
      
      if (saveScenario) {
        toast.success("Cenário salvo com sucesso!");
        refetchScenarios();
      }
    } catch (error) {
      toast.error("Erro ao simular cenário");
      console.error(error);
    }
  };

  const handleToggleFavorite = async (id: number, isFavorite: boolean) => {
    try {
      await toggleFavoriteMutation.mutateAsync({ id, isFavorite: !isFavorite });
      toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
      refetchScenarios();
    } catch (error) {
      toast.error("Erro ao atualizar favorito");
    }
  };

  const handleDeleteScenario = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este cenário?")) return;

    try {
      await deleteScenarioMutation.mutateAsync({ id });
      toast.success("Cenário excluído");
      refetchScenarios();
    } catch (error) {
      toast.error("Erro ao excluir cenário");
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "text-green-600 bg-green-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "critical": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "Baixo";
      case "medium": return "Médio";
      case "high": return "Alto";
      case "critical": return "Crítico";
      default: return riskLevel;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Simulação What-If</h1>
        <p className="text-muted-foreground mt-2">
          Teste diferentes cenários de alocação de recursos e visualize o impacto nos prazos e custos
        </p>
      </div>

      <Tabs defaultValue="simulate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="simulate">Nova Simulação</TabsTrigger>
          <TabsTrigger value="saved">Cenários Salvos</TabsTrigger>
        </TabsList>

        <TabsContent value="simulate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Cenário</CardTitle>
              <CardDescription>
                Ajuste os parâmetros para simular diferentes alocações de recursos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select
                  value={selectedProjectId?.toString()}
                  onValueChange={(value) => setSelectedProjectId(parseInt(value))}
                >
                  <SelectTrigger>
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
              </div>

              {/* Scenario Name */}
              <div className="space-y-2">
                <Label>Nome do Cenário (opcional)</Label>
                <Input
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Ex: Aumento de Equipe 20%"
                />
              </div>

              {/* Budget Adjustment */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Ajuste de Orçamento</Label>
                  <span className="text-sm font-medium">
                    {budgetPercentage > 0 ? "+" : ""}{budgetPercentage}%
                  </span>
                </div>
                <Slider
                  value={[budgetPercentage]}
                  onValueChange={(value) => setBudgetPercentage(value[0] || 0)}
                  min={-50}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Ajuste o orçamento disponível para o projeto
                </p>
              </div>

              {/* Team Size Adjustment */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Ajuste de Tamanho da Equipe</Label>
                  <span className="text-sm font-medium">
                    {teamSizeAdjustment > 0 ? "+" : ""}{teamSizeAdjustment} membros
                  </span>
                </div>
                <Slider
                  value={[teamSizeAdjustment]}
                  onValueChange={(value) => setTeamSizeAdjustment(value[0] || 0)}
                  min={-5}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Adicione ou remova membros da equipe
                </p>
              </div>

              {/* Timeline Adjustment */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Ajuste de Prazo</Label>
                  <span className="text-sm font-medium">
                    {timelineAdjustment > 0 ? "+" : ""}{timelineAdjustment} dias
                  </span>
                </div>
                <Slider
                  value={[timelineAdjustment]}
                  onValueChange={(value) => setTimelineAdjustment(value[0] || 0)}
                  min={-30}
                  max={60}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Estenda ou reduza o prazo do projeto
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleSimulate(false)}
                  disabled={!selectedProjectId || simulateMutation.isPending}
                  className="flex-1"
                >
                  {simulateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simular
                </Button>
                <Button
                  onClick={() => handleSimulate(true)}
                  disabled={!selectedProjectId || simulateMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  Simular e Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Simulation Results */}
          {simulationResult && (
            <div className="space-y-6">
              {/* Success Probability Banner */}
              {simulationResult.successProbability !== undefined && (
                <Card className={`border-2 ${
                  simulationResult.successProbability >= 75 ? 'border-green-500 bg-green-50' :
                  simulationResult.successProbability >= 50 ? 'border-yellow-500 bg-yellow-50' :
                  'border-red-500 bg-red-50'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Probabilidade de Sucesso</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Nível de confiança: <span className="font-medium">{simulationResult.confidenceLevel === 'high' ? 'Alto' : simulationResult.confidenceLevel === 'medium' ? 'Médio' : 'Baixo'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-bold">{simulationResult.successProbability}%</div>
                        <Badge className={getRiskColor(simulationResult.riskLevel)} variant="outline">
                          {getRiskLabel(simulationResult.riskLevel)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {/* Impact Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resumo do Impacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {simulationResult.impactSummary}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duração Prevista</p>
                      <p className="text-2xl font-bold">{simulationResult.predictedDuration} dias</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Previsto</p>
                      <p className="text-2xl font-bold">
                        €{simulationResult.predictedCost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Atraso Previsto</p>
                      <p className={`text-2xl font-bold ${simulationResult.predictedDelayDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {simulationResult.predictedDelayDays > 0 ? '+' : ''}{simulationResult.predictedDelayDays} dias
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Variação de Custo</p>
                      <p className={`text-2xl font-bold ${simulationResult.costVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {simulationResult.costVariance > 0 ? '+' : ''}€{Math.abs(simulationResult.costVariance).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Viabilidade</p>
                      <p className="text-lg font-semibold">{simulationResult.feasibilityScore}/100</p>
                    </div>
                    <Badge className={getRiskColor(simulationResult.riskLevel)}>
                      {getRiskLabel(simulationResult.riskLevel)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {simulationResult.recommendations?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Trade-offs */}
              {simulationResult.tradeoffs && simulationResult.tradeoffs.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Trade-offs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {simulationResult.tradeoffs.map((tradeoff: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold">{tradeoff.aspect}</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{tradeoff.positive}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{tradeoff.negative}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Critical Success Factors */}
              {simulationResult.criticalFactors && simulationResult.criticalFactors.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Fatores Críticos de Sucesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-2 md:grid-cols-2">
                      {simulationResult.criticalFactors.map((factor: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Risk Factors */}
              {simulationResult.riskFactors && simulationResult.riskFactors.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Fatores de Risco
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {simulationResult.riskFactors.map((risk: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Mitigation Strategies */}
              {simulationResult.mitigationStrategies && simulationResult.mitigationStrategies.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Estratégias de Mitigação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-2 md:grid-cols-2">
                      {simulationResult.mitigationStrategies.map((strategy: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {!selectedProjectId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Selecione um projeto na aba "Nova Simulação" para ver os cenários salvos
                </p>
              </CardContent>
            </Card>
          ) : savedScenarios && savedScenarios.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {savedScenarios.map((scenario: any) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{scenario.scenarioName}</CardTitle>
                        {scenario.description && (
                          <CardDescription>{scenario.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedScenarioForShare(scenario.id);
                            setShareDialogOpen(true);
                          }}
                          title="Compartilhar"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedScenarioForComments(scenario.id);
                            setCommentsDialogOpen(true);
                          }}
                          title="Comentários"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleFavorite(scenario.id, scenario.isFavorite === 1)}
                          title="Favorito"
                        >
                          <Star
                            className={`h-4 w-4 ${scenario.isFavorite === 1 ? 'fill-yellow-400 text-yellow-400' : ''}`}
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteScenario(scenario.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Duração</p>
                        <p className="font-semibold">{scenario.predictedDuration} dias</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Custo</p>
                        <p className="font-semibold">€{parseFloat(scenario.predictedCost).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Viabilidade</p>
                        <p className="font-semibold">{scenario.feasibilityScore}/100</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Risco</p>
                        <Badge className={getRiskColor(scenario.riskLevel)}>
                          {getRiskLabel(scenario.riskLevel)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {scenario.impactSummary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum cenário salvo para este projeto
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Sharing Dialog */}
      {selectedScenarioForShare && (
        <ScenarioSharingDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          scenarioId={selectedScenarioForShare}
          scenarioName={
            savedScenarios?.find((s: any) => s.id === selectedScenarioForShare)?.scenarioName || "Cenário"
          }
        />
      )}

      {/* Comments Dialog */}
      {selectedScenarioForComments && (
        <ScenarioCommentsDialog
          open={commentsDialogOpen}
          onOpenChange={setCommentsDialogOpen}
          scenarioId={selectedScenarioForComments}
          scenarioName={
            savedScenarios?.find((s: any) => s.id === selectedScenarioForComments)?.scenarioName || "Cenário"
          }
        />
      )}
    </div>
  );
}
