import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Search, Plus, Filter, Grid, List } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import ProjectCard from './ProjectCard';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';

export function ProjectsDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'date'>('name');

  // Fetch projects
  const { data: projectsData, isLoading } = trpc.projectManagement.listProjects.useQuery({
    status: filterStatus === 'all' ? undefined : filterStatus,
    limit: 100,
  });

  const projects = projectsData?.data || [];

  // Filtrar e ordenar projetos
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de prioridade
    if (filterPriority !== 'all') {
      filtered = filtered.filter(p => p.priority === filterPriority);
    }

    // Ordenação
    switch (sortBy) {
      case 'progress':
        filtered.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
      case 'date':
        filtered.sort((a, b) => {
          const dateA = new Date(a.endDate || 0).getTime();
          const dateB = new Date(b.endDate || 0).getTime();
          return dateA - dateB;
        });
        break;
      case 'name':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [projects, searchTerm, filterPriority, sortBy]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = projects.length;
    const byStatus = {
      planning: projects.filter(p => p.status === 'planning').length,
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      on_hold: projects.filter(p => p.status === 'on_hold').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
    };

    const byPriority = {
      low: projects.filter(p => p.priority === 'low').length,
      medium: projects.filter(p => p.priority === 'medium').length,
      high: projects.filter(p => p.priority === 'high').length,
      urgent: projects.filter(p => p.priority === 'urgent').length,
    };

    const avgProgress = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;

    return {
      total,
      byStatus,
      byPriority,
      avgProgress,
    };
  }, [projects]);

  // Dados para gráficos
  const statusChartData = [
    { name: 'Planeamento', value: stats.byStatus.planning },
    { name: 'Em Progresso', value: stats.byStatus.in_progress },
    { name: 'Concluído', value: stats.byStatus.completed },
    { name: 'Suspenso', value: stats.byStatus.on_hold },
    { name: 'Cancelado', value: stats.byStatus.cancelled },
  ].filter(d => d.value > 0);

  const priorityChartData = [
    { name: 'Baixa', value: stats.byPriority.low },
    { name: 'Média', value: stats.byPriority.medium },
    { name: 'Alta', value: stats.byPriority.high },
    { name: 'Urgente', value: stats.byPriority.urgent },
  ].filter(d => d.value > 0);

  const COLORS = ['#8b8670', '#adaa96', '#c9a882', '#d4c4b0', '#e5ddd0'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-600 mt-1">Gerencie e acompanhe todos os seus projetos</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600 mt-1">Total de Projetos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.byStatus.in_progress}</p>
              <p className="text-sm text-gray-600 mt-1">Em Progresso</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.byStatus.completed}</p>
              <p className="text-sm text-gray-600 mt-1">Concluídos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.avgProgress}%</p>
              <p className="text-sm text-gray-600 mt-1">Progresso Médio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum projeto para exibir</p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b8670" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum projeto para exibir</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Projetos</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Procurar por nome ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planning">Planeamento</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="on_hold">Suspenso</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as FilterPriority)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
                <SelectItem value="date">Data de Conclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultados */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando projetos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  clientName={project.clientName}
                  description={project.description}
                  location={project.location}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  progress={project.progress || 0}
                  status={project.status}
                  priority={project.priority}
                  budget={project.budget?.toString()}
                  variant={viewMode === 'list' ? 'compact' : 'default'}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
