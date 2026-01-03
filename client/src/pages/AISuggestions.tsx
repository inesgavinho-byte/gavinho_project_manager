import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Sparkles,
  Brain,
  Target,
  DollarSign,
  Calendar,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export default function AISuggestions() {
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: suggestions = [], isLoading, refetch } = trpc.aiSuggestions.list.useQuery(
    selectedProject ? { projectId: selectedProject } : undefined
  );
  const { data: criticalSuggestions = [] } = trpc.aiSuggestions.critical.useQuery();
  const { data: stats = [] } = trpc.aiSuggestions.stats.useQuery(
    selectedProject ? { projectId: selectedProject } : undefined
  );

  const analyzeMutation = trpc.aiSuggestions.analyze.useMutation({
    onSuccess: () => {
      toast.success("Análise de IA concluída com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.aiSuggestions.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      refetch();
    },
  });

  const deleteMutation = trpc.aiSuggestions.delete.useMutation({
    onSuccess: () => {
      toast.success("Sugestão removida");
      refetch();
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "risk_alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "resource_optimization":
        return <TrendingUp className="h-4 w-4" />;
      case "next_action":
        return <Target className="h-4 w-4" />;
      case "budget_warning":
        return <DollarSign className="h-4 w-4" />;
      case "deadline_alert":
        return <Calendar className="h-4 w-4" />;
      case "efficiency_tip":
        return <Zap className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      risk_alert: "Alerta de Risco",
      resource_optimization: "Otimização de Recursos",
      next_action: "Próxima Ação",
      budget_warning: "Alerta de Orçamento",
      deadline_alert: "Alerta de Prazo",
      efficiency_tip: "Dica de Eficiência",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      risk_alert: "bg-red-500/10 text-red-700 border-red-200",
      resource_optimization: "bg-blue-500/10 text-blue-700 border-blue-200",
      next_action: "bg-green-500/10 text-green-700 border-green-200",
      budget_warning: "bg-orange-500/10 text-orange-700 border-orange-200",
      deadline_alert: "bg-purple-500/10 text-purple-700 border-purple-200",
      efficiency_tip: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
    };
    return colors[type] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-600 text-white",
      high: "bg-orange-600 text-white",
      medium: "bg-yellow-600 text-white",
      low: "bg-gray-600 text-white",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredSuggestions = suggestions.filter((s: any) => {
    if (selectedType !== "all" && s.type !== selectedType) {
      return false;
    }
    return true;
  });

  const pendingSuggestions = filteredSuggestions.filter((s: any) => s.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Sugestões de IA
          </h1>
          <p className="text-gray-600 mt-1">
            Análise inteligente e recomendações para otimizar seus projetos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject?.toString() || "all"} onValueChange={(v) => setSelectedProject(v === "all" ? undefined : parseInt(v))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProject && (
            <Button
              onClick={() => analyzeMutation.mutate({ projectId: selectedProject })}
              disabled={analyzeMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {analyzeMutation.isPending ? "Analisando..." : "Analisar Projeto"}
            </Button>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalSuggestions.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticos
            </CardTitle>
            <CardDescription className="text-red-700">
              {criticalSuggestions.length} sugestões críticas requerem atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalSuggestions.slice(0, 3).map((suggestion: any) => (
                <div key={suggestion.id} className="bg-white p-3 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-red-900">{suggestion.title}</p>
                      <p className="text-sm text-red-700 mt-1">{suggestion.description}</p>
                    </div>
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sugestões</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suggestions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSuggestions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aceitas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suggestions.filter((s: any) => s.status === "accepted").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suggestions.filter((s: any) => s.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="risk_alert">Alertas de Risco</SelectItem>
            <SelectItem value="resource_optimization">Otimização de Recursos</SelectItem>
            <SelectItem value="next_action">Próximas Ações</SelectItem>
            <SelectItem value="budget_warning">Alertas de Orçamento</SelectItem>
            <SelectItem value="deadline_alert">Alertas de Prazo</SelectItem>
            <SelectItem value="efficiency_tip">Dicas de Eficiência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suggestions List */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingSuggestions.length})</TabsTrigger>
          <TabsTrigger value="all">Todas ({filteredSuggestions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhuma sugestão pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendingSuggestions.map((suggestion: any) => (
              <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          <Badge className={getTypeColor(suggestion.type)}>
                            {getTypeLabel(suggestion.type)}
                          </Badge>
                        </div>
                        <CardDescription>{suggestion.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {suggestion.reasoning && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Análise</h4>
                      <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                    </div>
                  )}
                  {suggestion.suggestedAction && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Ação Sugerida</h4>
                      <p className="text-sm text-gray-600">{suggestion.suggestedAction}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {suggestion.impact && (
                      <Badge variant="outline">Impacto: {suggestion.impact}</Badge>
                    )}
                    {suggestion.confidence && (
                      <Badge variant="outline">
                        Confiança: {(parseFloat(suggestion.confidence) * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: suggestion.id, status: "accepted" })
                      }
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: suggestion.id, status: "rejected" })
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate({ id: suggestion.id })}
                    >
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {filteredSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhuma sugestão encontrada</p>
                {selectedProject && (
                  <Button
                    className="mt-4"
                    onClick={() => analyzeMutation.mutate({ projectId: selectedProject })}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Sugestões
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredSuggestions.map((suggestion: any) => (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          <Badge className={getTypeColor(suggestion.type)}>
                            {getTypeLabel(suggestion.type)}
                          </Badge>
                          {getStatusIcon(suggestion.status)}
                        </div>
                        <CardDescription>{suggestion.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {suggestion.reasoning && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Análise:</strong> {suggestion.reasoning}
                    </p>
                  )}
                  {suggestion.suggestedAction && (
                    <p className="text-sm text-gray-600">
                      <strong>Ação Sugerida:</strong> {suggestion.suggestedAction}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
