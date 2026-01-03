import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FolderKanban, AlertCircle, CheckCircle2, Clock, PauseCircle, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery({ unreadOnly: true });

  const recentProjects = projects?.slice(0, 5) || [];
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1">Visão geral dos projetos e atividades</p>
        </div>
        <Link href="/projects">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(project.status)}
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.clientName || "Sem cliente"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityClass(project.priority)}`}>
                          {project.priority}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {project.progress}% concluído
                        </span>
                      </div>
                    </div>
                  </Link>
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
      </div>
    </div>
  );
}
