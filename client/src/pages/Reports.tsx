import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FileText, Download, TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE"];

export default function Reports() {
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [reportType, setReportType] = useState<"project" | "comparison" | "executive">("executive");

  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: projectReport, isLoading: loadingProject } = trpc.reports.project.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject && reportType === "project" }
  );
  const { data: comparisonReport, isLoading: loadingComparison } = trpc.reports.comparison.useQuery(
    undefined,
    { enabled: reportType === "comparison" }
  );
  const { data: executiveSummary, isLoading: loadingExecutive } = trpc.reports.executive.useQuery(
    undefined,
    { enabled: reportType === "executive" }
  );

  const exportExcelMutation = trpc.reports.exportExcel.useMutation({
    onSuccess: (data: any) => {
      // Create download link
      const blob = new Blob([Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0))], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Relatório exportado com sucesso");
    },
    onError: (error: any) => {
      toast.error(`Erro ao exportar: ${error.message}`);
    },
  });

  const handleExport = () => {
    if (reportType === "project" && selectedProject) {
      exportExcelMutation.mutate({ type: "project", projectId: selectedProject });
    } else if (reportType === "comparison") {
      exportExcelMutation.mutate({ type: "comparison" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Relatórios e Análises
          </h1>
          <p className="text-gray-600 mt-1">
            Visualize métricas, tendências e exporte relatórios detalhados
          </p>
        </div>
        <div className="flex gap-2">
          {(reportType === "project" || reportType === "comparison") && (
            <Button
              onClick={handleExport}
              disabled={exportExcelMutation.isPending || (reportType === "project" && !selectedProject)}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportExcelMutation.isPending ? "Exportando..." : "Exportar Excel"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={reportType} onValueChange={(v) => setReportType(v as any)}>
        <TabsList>
          <TabsTrigger value="executive">
            <TrendingUp className="h-4 w-4 mr-2" />
            Resumo Executivo
          </TabsTrigger>
          <TabsTrigger value="project">
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatório de Projeto
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Comparação de Projetos
          </TabsTrigger>
        </TabsList>

        {/* Executive Summary */}
        <TabsContent value="executive" className="space-y-6 mt-6">
          {loadingExecutive ? (
            <div className="text-center py-12">Carregando...</div>
          ) : executiveSummary ? (
            <>
              {/* KPI Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{executiveSummary.totalProjects}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {executiveSummary.activeProjects}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {executiveSummary.completedProjects}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projetos Atrasados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {executiveSummary.delayedProjects}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Budget Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visão Geral do Orçamento</CardTitle>
                    <CardDescription>Orçamento total vs. gasto atual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          {
                            name: "Orçamento",
                            Total: executiveSummary.totalBudget,
                            Gasto: executiveSummary.totalSpent,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="Total" fill="#1E3A8A" />
                        <Bar dataKey="Gasto" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Utilização:{" "}
                        <span className="font-bold">
                          {((executiveSummary.totalSpent / executiveSummary.totalBudget) * 100).toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso Geral</CardTitle>
                    <CardDescription>Média de progresso de todos os projetos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[250px]">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-primary">
                          {executiveSummary.overallProgress.toFixed(0)}%
                        </div>
                        <p className="text-gray-600 mt-2">Progresso Médio</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Critical Issues */}
              {executiveSummary.criticalIssues.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900">Questões Críticas</CardTitle>
                    <CardDescription className="text-red-700">
                      Problemas que requerem atenção imediata
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {executiveSummary.criticalIssues.map((issue: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-red-900">
                          <span className="text-red-600 mt-1">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">Nenhum dado disponível</div>
          )}
        </TabsContent>

        {/* Project Report */}
        <TabsContent value="project" className="space-y-6 mt-6">
          <div className="flex gap-4">
            <Select
              value={selectedProject?.toString() || ""}
              onValueChange={(v) => setSelectedProject(parseInt(v))}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingProject ? (
            <div className="text-center py-12">Carregando...</div>
          ) : projectReport ? (
            <>
              {/* Project Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progresso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectReport.project.progress}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {projectReport.summary.completionRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilização de Orçamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {projectReport.summary.budgetUtilization.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dias Restantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {projectReport.summary.daysRemaining !== null
                        ? projectReport.summary.daysRemaining
                        : "N/A"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline de Progresso</CardTitle>
                    <CardDescription>Evolução do progresso ao longo do tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={projectReport.timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="progress" stroke="#1E3A8A" name="Progresso (%)" />
                        <Line
                          type="monotone"
                          dataKey="tasksCompleted"
                          stroke="#3B82F6"
                          name="Tarefas Concluídas"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Budget Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orçamento por Categoria</CardTitle>
                    <CardDescription>Orçado vs. Atual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectReport.budgetTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="budgeted" fill="#1E3A8A" name="Orçado" />
                        <Bar dataKey="actual" fill="#3B82F6" name="Atual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Status Alert */}
              {projectReport.summary.isDelayed && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900">⚠️ Projeto Atrasado</CardTitle>
                    <CardDescription className="text-red-700">
                      Este projeto está atrasado em relação ao cronograma esperado
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </>
          ) : selectedProject ? (
            <div className="text-center py-12 text-gray-500">Nenhum dado disponível</div>
          ) : (
            <div className="text-center py-12 text-gray-500">Selecione um projeto para visualizar o relatório</div>
          )}
        </TabsContent>

        {/* Comparison Report */}
        <TabsContent value="comparison" className="space-y-6 mt-6">
          {loadingComparison ? (
            <div className="text-center py-12">Carregando...</div>
          ) : comparisonReport ? (
            <>
              {/* Averages */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {comparisonReport.averages.avgProgress.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conclusão Média</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {comparisonReport.averages.avgCompletionRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilização de Orçamento Média</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {comparisonReport.averages.avgBudgetUtilization.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso por Projeto</CardTitle>
                    <CardDescription>Comparação de progresso entre projetos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonReport.projects}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="progress" fill="#1E3A8A" name="Progresso (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Utilização de Orçamento</CardTitle>
                    <CardDescription>Comparação de utilização de orçamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonReport.projects}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="budgetUtilization" fill="#3B82F6" name="Utilização (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Projects Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes de Todos os Projetos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Projeto</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-right p-2">Progresso</th>
                          <th className="text-right p-2">Taxa de Conclusão</th>
                          <th className="text-right p-2">Utilização de Orçamento</th>
                          <th className="text-right p-2">Dias Restantes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonReport.projects.map((project: any) => (
                          <tr key={project.id} className="border-b">
                            <td className="p-2">{project.name}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  project.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : project.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {project.status}
                              </span>
                            </td>
                            <td className="text-right p-2">{project.progress.toFixed(1)}%</td>
                            <td className="text-right p-2">{project.completionRate.toFixed(1)}%</td>
                            <td className="text-right p-2">{project.budgetUtilization.toFixed(1)}%</td>
                            <td className="text-right p-2">
                              {project.daysRemaining !== null ? project.daysRemaining : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">Nenhum dado disponível</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
