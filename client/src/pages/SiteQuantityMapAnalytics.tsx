import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  ArrowLeft,
} from "lucide-react";
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

export default function SiteQuantityMapAnalytics() {
  const [, params] = useRoute("/site-management/:id/quantity-map-analytics");
  const constructionId = parseInt(params?.id || "0");

  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  // Calculate date range based on period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    if (period === "week") {
      start.setDate(end.getDate() - 7);
    } else if (period === "month") {
      start.setMonth(end.getMonth() - 1);
    } else {
      start.setMonth(end.getMonth() - 3);
    }
    
    return { startDate: start, endDate: end };
  };

  const { startDate, endDate } = getDateRange();

  // Queries
  const { data: summary } = trpc.siteManagement.analytics.summary.useQuery({
    constructionId,
    startDate,
    endDate,
  }, { enabled: constructionId > 0 });

  const { data: productivityData = [] } = trpc.siteManagement.analytics.productivityByWorker.useQuery({
    constructionId,
    startDate,
    endDate,
  }, { enabled: constructionId > 0 });

  const { data: evolutionData = [] } = trpc.siteManagement.analytics.temporalEvolution.useQuery({
    constructionId,
    groupBy,
    startDate,
    endDate,
  }, { enabled: constructionId > 0 });

  const { data: categoryData = [] } = trpc.siteManagement.analytics.categoryComparison.useQuery({
    constructionId,
    startDate,
    endDate,
  }, { enabled: constructionId > 0 });

  // Chart colors
  const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899"];

  if (constructionId === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
        <p className="text-[#5F5C59]">Obra não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#5F5C59]">
                Análise de Produtividade MQT
              </h1>
              <p className="text-[#5F5C59]/60 mt-1">
                Dashboard de métricas e desempenho
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-[#C3BAAF] rounded-md bg-white text-[#5F5C59]"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="quarter">Últimos 3 Meses</option>
            </select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/60 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Quantidade Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#5F5C59]">
                  {summary.totalQuantity}
                </div>
                <p className="text-xs text-[#5F5C59]/60 mt-1">
                  {summary.totalMarcations} marcações
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/60 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Média Diária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#5F5C59]">
                  {summary.avgDailyQuantity}
                </div>
                <p className="text-xs text-[#5F5C59]/60 mt-1">
                  {summary.activeDays} dias ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/60 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Mais Produtivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-[#5F5C59] truncate">
                  {summary.topWorkerName}
                </div>
                <p className="text-xs text-[#5F5C59]/60 mt-1">
                  {summary.topWorkerQuantity} unidades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/60 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Taxa de Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#5F5C59]">
                  {summary.totalMarcations > 0
                    ? ((summary.approvedMarcations / summary.totalMarcations) * 100).toFixed(1)
                    : "0.0"}%
                </div>
                <p className="text-xs text-[#5F5C59]/60 mt-1">
                  {summary.approvedMarcations} aprovadas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Productivity by Worker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-[#5F5C59]">
                Produtividade por Trabalhador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C3BAAF" />
                  <XAxis
                    dataKey="workerName"
                    tick={{ fill: "#5F5C59", fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: "#5F5C59", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF8F6",
                      border: "1px solid #C3BAAF",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="totalQuantity" fill="#F59E0B" name="Quantidade Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Temporal Evolution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium text-[#5F5C59]">
                Evolução Temporal
              </CardTitle>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-3 py-1 border border-[#C3BAAF] rounded-md bg-white text-sm text-[#5F5C59]"
              >
                <option value="day">Diário</option>
                <option value="week">Semanal</option>
                <option value="month">Mensal</option>
              </select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C3BAAF" />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "#5F5C59", fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: "#5F5C59", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF8F6",
                      border: "1px solid #C3BAAF",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalQuantity"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Quantidade"
                    dot={{ fill: "#10B981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="marcationsCount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Marcações"
                    dot={{ fill: "#3B82F6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-[#5F5C59]">
                Distribuição por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: ${entry.totalQuantity.toFixed(0)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalQuantity"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF8F6",
                      border: "1px solid #C3BAAF",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Approval Rate by Worker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-[#5F5C59]">
                Taxa de Aprovação por Trabalhador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#C3BAAF" />
                  <XAxis type="number" tick={{ fill: "#5F5C59", fontSize: 12 }} />
                  <YAxis
                    dataKey="workerName"
                    type="category"
                    tick={{ fill: "#5F5C59", fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF8F6",
                      border: "1px solid #C3BAAF",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="approvalRate" fill="#10B981" name="Taxa de Aprovação (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Worker Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-[#5F5C59]">
              Ranking de Trabalhadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#C3BAAF]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#5F5C59]">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#5F5C59]">
                      Trabalhador
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#5F5C59]">
                      Quantidade Total
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#5F5C59]">
                      Marcações
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#5F5C59]">
                      Taxa Aprovação
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#5F5C59]">
                      Média Diária
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#5F5C59]">
                      Dias Ativos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productivityData
                    .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
                    .map((worker: any, index: number) => (
                      <tr
                        key={worker.workerId}
                        className="border-b border-[#C3BAAF]/30 hover:bg-[#C3BAAF]/10"
                      >
                        <td className="py-3 px-4 text-sm text-[#5F5C59]">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-[#5F5C59]">
                          {worker.workerName}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#5F5C59] text-right">
                          {worker.totalQuantity.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#5F5C59] text-right">
                          {worker.totalMarcations}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#5F5C59] text-right">
                          {worker.approvalRate}%
                        </td>
                        <td className="py-3 px-4 text-sm text-[#5F5C59] text-right">
                          {worker.avgDailyQuantity}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#5F5C59] text-right">
                          {worker.activeDays}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
