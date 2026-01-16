'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, RefreshCw, Filter, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  actionType: string;
  actionName: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  userId?: string;
  projectId?: string;
  milestoneId?: string;
  config: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  duration: number;
  executedAt: Date;
  completedAt?: Date;
}

const statusColors: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  executing: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  success: 'Sucesso',
  failed: 'Falha',
  pending: 'Pendente',
  executing: 'Executando',
};

export function ActionAuditDashboard() {
  const [filters, setFilters] = useState({
    actionType: '',
    status: '',
    projectId: '',
    searchTerm: '',
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    endDate: new Date(),
  });

  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Queries
  const auditLogsQuery = trpc.audit.getAuditLogs.useQuery({
    actionType: filters.actionType || undefined,
    status: (filters.status as any) || undefined,
    projectId: filters.projectId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit,
    offset: currentPage * limit,
  });

  const auditStatsQuery = trpc.audit.getAuditStats.useQuery({
    projectId: filters.projectId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const actionsByHourQuery = trpc.audit.getActionsByHour.useQuery({
    hours: 24,
  });

  const successRateQuery = trpc.audit.getSuccessRateByActionType.useQuery();

  const exportMutation = trpc.audit.exportToCSV.useMutation();

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        actionType: filters.actionType || undefined,
        status: (filters.status as any) || undefined,
        projectId: filters.projectId || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      if (result.success && result.data) {
        // Criar e baixar arquivo CSV
        const element = document.createElement('a');
        const file = new Blob([result.data], { type: 'text/csv' });
        element.href = URL.createObjectURL(file);
        element.download = result.filename || 'audit-export.csv';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const stats = auditStatsQuery.data?.data;
  const logs = auditLogsQuery.data?.data || [];
  const hourlyData = actionsByHourQuery.data?.data || [];
  const successRates = successRateQuery.data?.data || {};

  const chartData = Object.entries(successRates).map(([type, data]: [string, any]) => ({
    name: type,
    successRate: Math.round(data.rate),
    total: data.total,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Auditoria de Ações</h1>
          <p className="text-gray-600 mt-1">Histórico completo de todas as ações executadas</p>
        </div>
        <Button onClick={() => auditLogsQuery.refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bem-sucedidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successfulActions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Falhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedActions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Duração Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageDuration)}ms</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ações por Hora */}
        <Card>
          <CardHeader>
            <CardTitle>Ações por Hora (Últimas 24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b8670" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Taxa de Sucesso por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Sucesso por Tipo de Ação</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successRate" fill="#8b8670" name="Taxa de Sucesso (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Ação</label>
              <Input
                placeholder="Filtrar por tipo..."
                value={filters.actionType}
                onChange={(e) => {
                  setFilters({ ...filters, actionType: e.target.value });
                  setCurrentPage(0);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => {
                setFilters({ ...filters, status: value });
                setCurrentPage(0);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="executing">Executando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Projeto</label>
              <Input
                placeholder="Filtrar por projeto..."
                value={filters.projectId}
                onChange={(e) => {
                  setFilters({ ...filters, projectId: e.target.value });
                  setCurrentPage(0);
                }}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleExport} disabled={exportMutation.isPending} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Data Range */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  setDateRange({ ...dateRange, startDate: new Date(e.target.value) });
                  setCurrentPage(0);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  setDateRange({ ...dateRange, endDate: new Date(e.target.value) });
                  setCurrentPage(0);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações</CardTitle>
          <CardDescription>Últimas ações executadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">ID</th>
                  <th className="text-left py-2 px-4">Tipo</th>
                  <th className="text-left py-2 px-4">Nome</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Duração</th>
                  <th className="text-left py-2 px-4">Executado em</th>
                  <th className="text-left py-2 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AuditLog) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 text-xs font-mono">{log.id.substring(0, 12)}...</td>
                    <td className="py-2 px-4">{log.actionType}</td>
                    <td className="py-2 px-4">{log.actionName}</td>
                    <td className="py-2 px-4">
                      <Badge className={statusColors[log.status]}>
                        {statusLabels[log.status]}
                      </Badge>
                    </td>
                    <td className="py-2 px-4">{log.duration}ms</td>
                    <td className="py-2 px-4 text-xs">
                      {new Date(log.executedAt).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-2 px-4">
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Página {currentPage + 1} • Mostrando {logs.length} de {stats?.totalActions || 0} ações
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={logs.length < limit}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
