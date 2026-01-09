import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Plus, Save, Trash2, Eye, Download, FileText, BarChart3, PieChart, Table } from "lucide-react";
import { useToast } from "../hooks/use-toast";

type MetricType = "totalProjects" | "totalBudget" | "totalSpent" | "completedProjects" | "activeProjects" | "overrunProjects";
type ChartType = "line" | "bar" | "pie" | "area" | "table";

interface SelectedMetric {
  id: string;
  label: string;
  chartType: ChartType;
}

export default function ReportBuilder() {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [reportType, setReportType] = useState<"progress" | "financial" | "resources" | "timeline" | "custom">("financial");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetric[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Query templates
  const { data: templates, isLoading: loadingTemplates, refetch: refetchTemplates } = trpc.customReports.getTemplates.useQuery();

  // Mutations
  const createTemplateMutation = trpc.customReports.createTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template criado",
        description: "O template de relatório foi criado com sucesso.",
      });
      refetchTemplates();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = trpc.customReports.deleteTemplate.useMutation({
    onSuccess: () => {
      toast({
        title: "Template eliminado",
        description: "O template foi eliminado com sucesso.",
      });
      refetchTemplates();
    },
    onError: (error) => {
      toast({
        title: "Erro ao eliminar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const availableMetrics = [
    { id: "totalProjects", label: "Total de Projetos", category: "Geral" },
    { id: "totalBudget", label: "Orçamento Total", category: "Financeiro" },
    { id: "totalSpent", label: "Total Gasto", category: "Financeiro" },
    { id: "completedProjects", label: "Projetos Concluídos", category: "Progresso" },
    { id: "activeProjects", label: "Projetos Ativos", category: "Progresso" },
    { id: "overrunProjects", label: "Projetos com Estouro", category: "Financeiro" },
  ];

  const chartTypes: { value: ChartType; label: string; icon: any }[] = [
    { value: "bar", label: "Gráfico de Barras", icon: BarChart3 },
    { value: "line", label: "Gráfico de Linhas", icon: BarChart3 },
    { value: "pie", label: "Gráfico Circular", icon: PieChart },
    { value: "table", label: "Tabela", icon: Table },
  ];

  const handleAddMetric = (metricId: string, metricLabel: string) => {
    if (selectedMetrics.find((m) => m.id === metricId)) {
      toast({
        title: "Métrica já adicionada",
        description: "Esta métrica já está no relatório.",
        variant: "destructive",
      });
      return;
    }

    setSelectedMetrics([
      ...selectedMetrics,
      {
        id: metricId,
        label: metricLabel,
        chartType: "bar",
      },
    ]);
  };

  const handleRemoveMetric = (metricId: string) => {
    setSelectedMetrics(selectedMetrics.filter((m) => m.id !== metricId));
  };

  const handleChangeChartType = (metricId: string, chartType: ChartType) => {
    setSelectedMetrics(
      selectedMetrics.map((m) => (m.id === metricId ? { ...m, chartType } : m))
    );
  };

  const handleSaveTemplate = () => {
    if (!templateName) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o template.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMetrics.length === 0) {
      toast({
        title: "Métricas obrigatórias",
        description: "Por favor, adicione pelo menos uma métrica ao relatório.",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate({
      name: templateName,
      description: templateDescription,
      isPublic,
      reportType,
      metrics: selectedMetrics.map((m) => m.id),
      chartTypes: selectedMetrics.map((m) => ({ metricId: m.id, chartType: m.chartType })),
      filters: {},
      layout: {
        sections: selectedMetrics.map((m, index) => ({
          id: m.id,
          type: "chart" as const,
          order: index,
          config: { chartType: m.chartType },
        })),
      },
    });
  };

  const handleDeleteTemplate = (templateId: number) => {
    if (confirm("Tem a certeza que deseja eliminar este template?")) {
      deleteTemplateMutation.mutate({ templateId });
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateDescription("");
    setReportType("financial");
    setIsPublic(false);
    setSelectedMetrics([]);
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F0E7" }}>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5F5C59" }}>
            Builder de Relatórios Personalizáveis
          </h1>
          <p className="text-gray-600">Crie templates de relatórios customizados com métricas e visualizações à sua escolha</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Builder Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Info */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
                Informações do Template
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ex: Relatório Financeiro Mensal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A882]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Descreva o propósito deste relatório..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A882]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A882]"
                    >
                      <option value="financial">Financeiro</option>
                      <option value="progress">Progresso</option>
                      <option value="resources">Recursos</option>
                      <option value="timeline">Timeline</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#C9A882] focus:ring-[#C9A882]"
                      />
                      <span className="text-sm text-gray-700">Template Público</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Selection */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
                Selecionar Métricas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {availableMetrics.map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => handleAddMetric(metric.id, metric.label)}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-[#C9A882] hover:bg-gray-50 transition-colors text-left"
                  >
                    <Plus className="w-4 h-4" style={{ color: "#C9A882" }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#5F5C59" }}>
                        {metric.label}
                      </p>
                      <p className="text-xs text-gray-500">{metric.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Metrics */}
            {selectedMetrics.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
                  Métricas Selecionadas ({selectedMetrics.length})
                </h3>
                <div className="space-y-3">
                  {selectedMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium mb-2" style={{ color: "#5F5C59" }}>
                          {metric.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Visualização:</label>
                          <select
                            value={metric.chartType}
                            onChange={(e) => handleChangeChartType(metric.id, e.target.value as ChartType)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#C9A882]"
                          >
                            {chartTypes.map((ct) => (
                              <option key={ct.value} value={ct.value}>
                                {ct.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMetric(metric.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveTemplate}
                disabled={createTemplateMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: "#C9A882", color: "#FFFFFF" }}
              >
                <Save className="w-4 h-4" />
                {createTemplateMutation.isPending ? "A guardar..." : "Guardar Template"}
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                style={{ color: "#5F5C59" }}
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "Ocultar Preview" : "Ver Preview"}
              </button>
            </div>
          </div>

          {/* Templates List */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
                Templates Salvos
              </h3>
              {loadingTemplates ? (
                <p className="text-gray-500 text-sm">A carregar...</p>
              ) : templates && templates.length > 0 ? (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:border-[#C9A882] transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1" style={{ color: "#5F5C59" }}>
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-500">{template.reportType}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span>{template.createdByName || "Você"}</span>
                        {template.isPublic === 1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Público</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum template salvo ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && selectedMetrics.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#5F5C59" }}>
              Preview do Relatório
            </h3>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5F5C59" }}>
                  {templateName || "Relatório Sem Nome"}
                </h2>
                <p className="text-gray-600">{templateDescription || "Sem descrição"}</p>
              </div>
              {selectedMetrics.map((metric) => (
                <div key={metric.id} className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3" style={{ color: "#5F5C59" }}>
                    {metric.label}
                  </h4>
                  <div className="flex items-center justify-center h-48 bg-white rounded border border-gray-200">
                    <div className="text-center text-gray-400">
                      {metric.chartType === "bar" && <BarChart3 className="w-12 h-12 mx-auto mb-2" />}
                      {metric.chartType === "pie" && <PieChart className="w-12 h-12 mx-auto mb-2" />}
                      {metric.chartType === "table" && <Table className="w-12 h-12 mx-auto mb-2" />}
                      <p className="text-sm">Visualização: {chartTypes.find((ct) => ct.value === metric.chartType)?.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
