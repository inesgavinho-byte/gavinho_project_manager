import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, CheckCircle, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const COLORS = {
  excellent: '#10b981',
  good: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
  onTime: '#10b981',
  late: '#f59e0b',
  overdue: '#ef4444',
};

export function ComplianceDashboard() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() });

  // Queries
  const { data: allMetrics } = trpc.compliance.getAllProjectsCompliance.useQuery();
  const { data: stats } = trpc.compliance.getComplianceStats.useQuery();
  const { data: projectsAtRisk } = trpc.compliance.getProjectsAtRisk.useQuery({ threshold: 50 });
  const { data: distribution } = trpc.compliance.getMilestoneDistribution.useQuery({
    projectId: selectedProject || undefined,
  });
  const { data: trends } = trpc.compliance.getComplianceTrends.useQuery(
    selectedProject
      ? {
          projectId: selectedProject,
          startDate: dateRange.start,
          endDate: dateRange.end,
          periodDays: 7,
        }
      : undefined,
    { enabled: !!selectedProject }
  );

  const exportCSV = trpc.compliance.exportComplianceCSV.useMutation({
    onSuccess: (result) => {
      if (result.data) {
        const element = document.createElement('a');
        const file = new Blob([result.data], { type: 'text/csv' });
        element.href = URL.createObjectURL(file);
        element.download = `conformidade_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success('Relatório exportado com sucesso');
      }
    },
  });

  // Dados para gráficos
  const complianceData = useMemo(() => {
    if (!allMetrics?.data) return [];
    return allMetrics.data.map((m) => ({
      name: m.projectName,
      compliance: Math.round(m.complianceRate),
      status: m.status,
    }));
  }, [allMetrics]);

  const statusDistribution = useMemo(() => {
    if (!allMetrics?.data) return [];
    const dist = {
      excellent: 0,
      good: 0,
      warning: 0,
      critical: 0,
    };
    allMetrics.data.forEach((m) => {
      dist[m.status]++;
    });
    return [
      { name: 'Excelente', value: dist.excellent, color: COLORS.excellent },
      { name: 'Bom', value: dist.good, color: COLORS.good },
      { name: 'Aviso', value: dist.warning, color: COLORS.warning },
      { name: 'Crítico', value: dist.critical, color: COLORS.critical },
    ];
  }, [allMetrics]);

  const distributionData = useMemo(() => {
    if (!distribution?.data) return [];
    return [
      { name: 'Concluído', value: distribution.data.completed, color: COLORS.onTime },
      { name: 'Pendente', value: distribution.data.pending, color: '#e5e7eb' },
      { name: 'Em Risco', value: distribution.data.atRisk, color: COLORS.warning },
      { name: 'Vencido', value: distribution.data.overdue, color: COLORS.overdue },
    ];
  }, [distribution]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Conformidade</h1>
          <p className="text-gray-600 mt-1">Análise de taxa de cumprimento de prazos e performance por projeto</p>
        </div>
        <Button onClick={() => exportCSV.mutate()} disabled={exportCSV.isPending} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs */}
      {stats?.data && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conformidade Média</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.data.averageCompliance.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projetos em Risco</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.data.projectsAtRisk}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Marcos Vencidos</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.data.totalOverdue}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Marcos Concluídos</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.data.totalOnTime}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Taxa de Conformidade por Projeto */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Conformidade por Projeto</h2>
          {complianceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="compliance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
          )}
        </Card>

        {/* Distribuição de Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Status</h2>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
          )}
        </Card>

        {/* Distribuição de Marcos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Marcos</h2>
          {distributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
          )}
        </Card>

        {/* Tendências de Conformidade */}
        {selectedProject && trends?.data && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendências de Conformidade</h2>
            {trends.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="complianceRate" stroke="#3b82f6" name="Taxa de Conformidade (%)" />
                  <Line type="monotone" dataKey="overdueCount" stroke="#ef4444" name="Marcos Vencidos" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </Card>
        )}
      </div>

      {/* Projetos em Risco */}
      {projectsAtRisk?.data && projectsAtRisk.data.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Projetos em Risco (Conformidade &lt; 50%)
          </h2>
          <div className="space-y-3">
            {projectsAtRisk.data.map((project) => (
              <div
                key={project.projectId}
                className="p-4 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                onClick={() => setSelectedProject(project.projectId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{project.projectName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.completedOnTime} no prazo, {project.completedLate} atrasado, {project.overdue} vencido
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{project.complianceRate.toFixed(1)}%</p>
                    <Badge variant="destructive" className="mt-2">
                      {project.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de Projetos */}
      {allMetrics?.data && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Todos os Projetos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Projeto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Conformidade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">No Prazo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Atrasado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vencido</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allMetrics.data.map((project) => (
                  <tr key={project.projectId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedProject(project.projectId)}>
                    <td className="px-4 py-3 text-sm text-gray-900">{project.projectName}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${project.complianceRate}%`,
                              backgroundColor: project.complianceRate >= 90 ? '#10b981' : project.complianceRate >= 75 ? '#3b82f6' : project.complianceRate >= 50 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{project.complianceRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{project.completedOnTime}</td>
                    <td className="px-4 py-3 text-sm text-orange-600 font-medium">{project.completedLate}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{project.overdue}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={project.status === 'excellent' ? 'default' : project.status === 'good' ? 'secondary' : 'destructive'}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
