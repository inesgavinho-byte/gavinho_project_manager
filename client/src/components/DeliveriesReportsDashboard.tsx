import React from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface DeliveriesReportsDashboardProps {
  projectId: number;
  phaseId?: number;
}

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"];

export function DeliveriesReportsDashboard({ projectId, phaseId }: DeliveriesReportsDashboardProps) {
  const metricsQuery = trpc.deliveries.metrics.calculate.useQuery({ projectId, phaseId });
  const reportsQuery = trpc.deliveries.metrics.reports.useQuery({ projectId, phaseId });

  const metrics = metricsQuery.data;
  const reports = reportsQuery.data || [];

  // Prepare data for charts
  const statusData = metrics ? [
    { name: "Aprovadas", value: metrics.approved, fill: "#10b981" },
    { name: "Pendentes", value: metrics.pending, fill: "#f59e0b" },
    { name: "Em Revisão", value: metrics.inReview, fill: "#3b82f6" },
    { name: "Rejeitadas", value: metrics.rejected, fill: "#ef4444" },
  ] : [];

  const complianceData = reports.map((report: any) => ({
    date: new Date(report.reportDate).toLocaleDateString("pt-PT"),
    conformidade: report.complianceRate,
    aceitacao: report.acceptanceRate,
  }));

  const delayAnalysisData = metrics ? [
    { name: "No Prazo", value: metrics.onTime },
    { name: "Atrasadas", value: metrics.late },
  ] : [];

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.complianceRate}%</div>
              <p className="text-xs text-gray-500 mt-1">{metrics.onTime} de {metrics.total} no prazo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Taxa de Aceitação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics.acceptanceRate}%</div>
              <p className="text-xs text-gray-500 mt-1">{metrics.approved} aprovadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Rejeitadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics.rejected}</div>
              <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{metrics.late}</div>
              <p className="text-xs text-gray-500 mt-1">Dias em atraso</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Entregas por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Delay Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Atrasos</CardTitle>
            <CardDescription>Entregas no prazo vs atrasadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={delayAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trend */}
      {complianceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Conformidade</CardTitle>
            <CardDescription>Evolução da conformidade e aceitação ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="conformidade"
                  stroke="#10b981"
                  name="Conformidade (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="aceitacao"
                  stroke="#3b82f6"
                  name="Aceitação (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics Table */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas Detalhadas</CardTitle>
            <CardDescription>Resumo completo de indicadores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium">Métrica</th>
                    <th className="text-right py-2 px-4 font-medium">Valor</th>
                    <th className="text-right py-2 px-4 font-medium">Percentagem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">Total de Entregas</td>
                    <td className="text-right py-2 px-4 font-medium">{metrics.total}</td>
                    <td className="text-right py-2 px-4">100%</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">Aprovadas</td>
                    <td className="text-right py-2 px-4 font-medium text-green-600">{metrics.approved}</td>
                    <td className="text-right py-2 px-4 text-green-600">{metrics.acceptanceRate}%</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">Rejeitadas</td>
                    <td className="text-right py-2 px-4 font-medium text-red-600">{metrics.rejected}</td>
                    <td className="text-right py-2 px-4 text-red-600">
                      {metrics.total > 0 ? Math.round((metrics.rejected / metrics.total) * 100) : 0}%
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">No Prazo</td>
                    <td className="text-right py-2 px-4 font-medium text-green-600">{metrics.onTime}</td>
                    <td className="text-right py-2 px-4 text-green-600">{metrics.complianceRate}%</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">Atrasadas</td>
                    <td className="text-right py-2 px-4 font-medium text-orange-600">{metrics.late}</td>
                    <td className="text-right py-2 px-4 text-orange-600">
                      {metrics.total > 0 ? Math.round((metrics.late / metrics.total) * 100) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 px-4">Pendentes</td>
                    <td className="text-right py-2 px-4 font-medium text-blue-600">{metrics.pending}</td>
                    <td className="text-right py-2 px-4 text-blue-600">
                      {metrics.total > 0 ? Math.round((metrics.pending / metrics.total) * 100) : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
