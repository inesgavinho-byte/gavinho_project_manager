import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// Brand colors GAVINHO
const BRAND_COLORS = {
  dark: '#7a7667',
  medium: '#8b8670',
  light: '#adaa96',
  cream: '#f2f0e7',
  white: '#ffffff',
};

const CHART_COLORS = ['#7a7667', '#8b8670', '#adaa96', '#c4c0ad', '#d9d7ce'];

interface ExecutiveDashboardProps {
  onProjectSelect?: (projectId: string) => void;
}

export function ExecutiveDashboard({ onProjectSelect }: ExecutiveDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'progress' | 'priority' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Queries
  const { data: kpis, isLoading: kpisLoading } = trpc.executiveDashboard.getKPIs.useQuery();
  const { data: availableFilters } = trpc.executiveDashboard.getAvailableFilters.useQuery();
  const { data: searchResults, isLoading: searchLoading } = trpc.executiveDashboard.searchProjects.useQuery({
    searchQuery: searchQuery || undefined,
    status: selectedStatus.length > 0 ? selectedStatus : undefined,
    priority: selectedPriority.length > 0 ? selectedPriority : undefined,
    sortBy,
    sortOrder,
    limit: 50,
  });

  // Preparar dados para gráficos
  const statusChartData = useMemo(() => {
    if (!kpis?.projectsByStatus) return [];
    return Object.entries(kpis.projectsByStatus).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [kpis?.projectsByStatus]);

  const priorityChartData = useMemo(() => {
    if (!kpis?.projectsByPriority) return [];
    return Object.entries(kpis.projectsByPriority).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
    }));
  }, [kpis?.projectsByPriority]);

  const phaseChartData = useMemo(() => {
    if (!kpis?.projectsByPhase) return [];
    return Object.entries(kpis.projectsByPhase).map(([phase, count]) => ({
      name: phase.charAt(0).toUpperCase() + phase.slice(1),
      value: count,
    }));
  }, [kpis?.projectsByPhase]);

  // Status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      planning: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Priority badge color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-full space-y-6 p-6" style={{ backgroundColor: BRAND_COLORS.cream }}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" style={{ color: BRAND_COLORS.dark }}>
          Dashboard Executivo
        </h1>
        <p className="text-gray-600">Visão consolidada de todos os projetos e métricas de desempenho</p>
      </div>

      {/* KPIs Grid */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projects */}
          <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${BRAND_COLORS.dark}` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: BRAND_COLORS.dark }}>
                {kpis.totalProjects}
              </div>
              <p className="text-xs text-gray-500 mt-1">{kpis.activeProjects} ativos</p>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${BRAND_COLORS.medium}` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Projetos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: BRAND_COLORS.medium }}>
                {kpis.activeProjects}
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round((kpis.activeProjects / kpis.totalProjects) * 100)}% do total</p>
            </CardContent>
          </Card>

          {/* Overdue Projects */}
          <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid #dc2626` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Projetos Atrasados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{kpis.overdueProjects}</div>
              <p className="text-xs text-gray-500 mt-1">Requerem atenção imediata</p>
            </CardContent>
          </Card>

          {/* Average Progress */}
          <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${BRAND_COLORS.light}` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Progresso Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: BRAND_COLORS.light }}>
                {kpis.averageProgress}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Todos os projetos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3" style={{ backgroundColor: BRAND_COLORS.light }}>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Projetos */}
        <TabsContent value="projects" className="space-y-4">
          {/* Filtros */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Buscar Projeto</label>
                  <Input
                    placeholder="Nome, descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                  <Select
                    value={selectedStatus[0] || ''}
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setSelectedStatus([]);
                      } else {
                        setSelectedStatus([value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {availableFilters?.statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Prioridade</label>
                  <Select
                    value={selectedPriority[0] || ''}
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setSelectedPriority([]);
                      } else {
                        setSelectedPriority([value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as prioridades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as prioridades</SelectItem>
                      {availableFilters?.priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Ordenar por</label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="dueDate">Data de Vencimento</SelectItem>
                      <SelectItem value="progress">Progresso</SelectItem>
                      <SelectItem value="priority">Prioridade</SelectItem>
                      <SelectItem value="createdAt">Data de Criação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projetos List */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Projetos ({searchResults?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Carregando projetos...</div>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                            <Badge className={getPriorityColor(project.priority)}>
                              {project.priority}
                            </Badge>
                            {project.overdueCount > 0 && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {project.overdueCount} atrasados
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold" style={{ color: BRAND_COLORS.dark }}>
                            {project.progress}%
                          </div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${project.progress}%`,
                                backgroundColor: BRAND_COLORS.medium,
                              }}
                            />
                          </div>
                          {project.dueDate && (
                            <p className="text-xs text-gray-500 mt-2">
                              Vence: {new Date(project.dueDate).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Nenhum projeto encontrado</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análise */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Distribution */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                {priorityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={BRAND_COLORS.medium} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase Distribution */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Fase</CardTitle>
              </CardHeader>
              <CardContent>
                {phaseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={phaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={BRAND_COLORS.light} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Alertas e Avisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kpis && (
                <div className="space-y-3">
                  {kpis.overdueProjects > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-900">Projetos Atrasados</h4>
                      <p className="text-sm text-red-700 mt-1">
                        {kpis.overdueProjects} projeto(s) com marcos vencidos requerem atenção imediata.
                      </p>
                    </div>
                  )}

                  {kpis.upcomingDeadlines > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-900">Prazos Próximos</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {kpis.upcomingDeadlines} projeto(s) com vencimento nos próximos 7 dias.
                      </p>
                    </div>
                  )}

                  {kpis.completedProjects === kpis.totalProjects && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900">Todos os Projetos Concluídos</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Parabéns! Todos os {kpis.totalProjects} projetos foram completados com sucesso.
                      </p>
                    </div>
                  )}

                  {kpis.overdueProjects === 0 && kpis.upcomingDeadlines === 0 && kpis.completedProjects < kpis.totalProjects && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Status Normal</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Todos os projetos estão dentro dos prazos. Progresso médio: {kpis.averageProgress}%.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
