import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FolderKanban, AlertCircle, CheckCircle2, Clock, PauseCircle, Plus } from "lucide-react";
import { Link } from "wouter";
import NewProjectModal from "@/components/NewProjectModal";
import ProjectCard from "@/components/ProjectCard";
import ConstructionCard from "@/components/ConstructionCard";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: constructions, isLoading: constructionsLoading } = trpc.constructions.list.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery({ unreadOnly: true });

  // Apply filters
  const filteredProjects = projects?.filter(project => {
    // Status filter
    if (statusFilter !== "all" && project.status !== statusFilter) {
      return false;
    }
    
    // Period filter
    if (periodFilter !== "all" && project.createdAt) {
      const projectDate = new Date(project.createdAt);
      const now = new Date();
      
      if (periodFilter === "last_month") {
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
        if (projectDate < lastMonth) return false;
      } else if (periodFilter === "last_quarter") {
        const lastQuarter = new Date(now.setMonth(now.getMonth() - 3));
        if (projectDate < lastQuarter) return false;
      } else if (periodFilter === "last_year") {
        const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));
        if (projectDate < lastYear) return false;
      }
    }
    
    return true;
  }) || [];
  
  const recentProjects = filteredProjects.slice(0, 5);
  const recentConstructions = constructions?.slice(0, 5) || [];
  const urgentNotifications = notifications?.slice(0, 3) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "on_hold":
        return <PauseCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <FolderKanban className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: "Planejamento",
      in_progress: "Em Andamento",
      on_hold: "Pausado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getPriorityClass = (priority: string) => {
    const classes: Record<string, string> = {
      low: "priority-low",
      medium: "priority-medium",
      high: "priority-high",
      urgent: "priority-urgent",
    };
    return classes[priority] || "priority-medium";
  };

  return (
    <div className="space-y-6 min-h-screen animate-in fade-in duration-500" style={{ backgroundColor: 'var(--soft-cream)' }}>
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluídos</option>
              <option value="on_hold">Pausados</option>
              <option value="planning">Planejamento</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Período:</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos</option>
              <option value="last_month">Último Mês</option>
              <option value="last_quarter">Último Trimestre</option>
              <option value="last_year">Último Ano</option>
            </select>
          </div>
          
          {(statusFilter !== "all" || periodFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setPeriodFilter("all");
              }}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-700 delay-150">
        <Card className="card-shadow col-span-full md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
              <CardDescription className="text-xs">Criar novo projeto ou obra</CardDescription>
            </div>
            <NewProjectModal />
          </CardHeader>
        </Card>
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os projetos ativos</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statsLoading ? "..." : stats?.inProgress || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Projetos em execução</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : stats?.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Projetos finalizados</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{notifications?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Notificações pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects & Notifications */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card className="card-shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Projetos Recentes
            </CardTitle>
            <CardDescription>Últimos projetos criados ou atualizados</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum projeto encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    clientName={project.clientName}
                    description={project.description}
                    location={project.location}
                    startDate={project.startDate}
                    endDate={project.endDate}
                    progress={project.progress}
                    status={project.status}
                    priority={project.priority}
                    budget={project.budget}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="card-shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Notificações Urgentes
            </CardTitle>
            <CardDescription>Alertas e ações pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            {urgentNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma notificação pendente
              </div>
            ) : (
              <div className="space-y-4">
                {urgentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Constructions */}
        <Card className="card-shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Obras Recentes
            </CardTitle>
            <CardDescription>Últimas obras criadas ou atualizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {constructionsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : recentConstructions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma obra encontrada
              </div>
            ) : (
              <div className="space-y-3">
                {recentConstructions.map((construction) => (
                  <ConstructionCard
                    key={construction.id}
                    id={construction.id}
                    code={construction.code}
                    name={construction.name}
                    projectName={construction.projectName}
                    location={construction.location}
                    startDate={construction.startDate}
                    endDate={construction.endDate}
                    progress={construction.progress}
                    status={construction.status}
                    priority={construction.priority}
                    budget={construction.budget?.toString()}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
