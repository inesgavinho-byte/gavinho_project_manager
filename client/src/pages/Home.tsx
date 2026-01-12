import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardFilterBar, DashboardFilters } from "@/components/DashboardFilterBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>({});

  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: users = [] } = trpc.userManagement.list.useQuery();

  // Filter projects based on selected filters
  const filteredProjects = useMemo(() => {
    let result = projects;

    if (filters.status) {
      result = result.filter((p: any) => p.status === filters.status);
    }

    if (filters.responsible) {
      result = result.filter((p: any) => p.responsibleId === parseInt(filters.responsible));
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p: any) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (filters.period && filters.period !== "all") {
      const now = new Date();
      const daysAgo = filters.period === "7d" ? 7 : filters.period === "30d" ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      result = result.filter((p: any) => {
        const projectDate = new Date(p.createdAt);
        return projectDate >= startDate && projectDate <= now;
      });
    }

    return result;
  }, [projects, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: filteredProjects.length,
      inProgress: filteredProjects.filter((p: any) => p.status === "in_progress").length,
      completed: filteredProjects.filter((p: any) => p.status === "completed").length,
      delayed: filteredProjects.filter((p: any) => {
        const dueDate = new Date(p.dueDate);
        return dueDate < new Date() && p.status !== "completed";
      }).length,
    };
  }, [filteredProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Planeamento";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluído";
      case "on_hold":
        return "Suspenso";
      default:
        return status;
    }
  };

  const getResponsibleName = (responsibleId: number) => {
    return users.find((u: any) => u.id === responsibleId)?.name || "Desconhecido";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A882] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F2F0E7] to-[#E8E5DC]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bem-vindo ao Gavinho Project Manager</CardTitle>
            <CardDescription>
              Faça login para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-[#C9A882] hover:bg-[#B8956B] text-white">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#5F5C59]">
          Bem-vindo, {user?.name || "Usuário"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Aqui está um resumo dos seus projetos
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#5F5C59]">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total} projeto{stats.total !== 1 ? "s" : ""} no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
            <p className="text-xs text-gray-500 mt-1">
              Projetos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-gray-500 mt-1">
              Projetos finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.delayed}</div>
            <p className="text-xs text-gray-500 mt-1">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DashboardFilterBar
        onFiltersChange={setFilters}
        responsibleOptions={users.map((u: any) => ({
          value: u.id.toString(),
          label: u.name,
        }))}
        showSearch
        showStatus
        showPeriod
        showResponsible
      />

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project: any) => {
            const isDelayed = new Date(project.dueDate) < new Date() && project.status !== "completed";
            const progress = project.progress || 0;

            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {project.description && project.description.substring(0, 60)}...
                      </CardDescription>
                    </div>
                    {isDelayed && (
                      <AlertCircle className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {progress}% concluído
                    </span>
                  </div>

                  <div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Responsável</p>
                      <p className="font-medium text-[#5F5C59]">
                        {getResponsibleName(project.responsibleId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Prazo</p>
                      <p className={`font-medium ${isDelayed ? "text-red-600" : "text-[#5F5C59]"}`}>
                        {format(new Date(project.dueDate), "dd MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[#C9A882] border-[#C9A882] hover:bg-[#F2F0E7]"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">Nenhum projeto encontrado com os filtros selecionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
