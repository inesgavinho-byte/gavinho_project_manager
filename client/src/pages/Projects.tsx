import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, MapPin, TrendingUp, FolderOpen } from "lucide-react";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  // Filter projects
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-[#C9A882]/10 text-[#C9A882] border-[#C9A882]/20",
      in_progress: "bg-[#C3BAAF]/10 text-[#5F5C59] border-[#C3BAAF]/20",
      on_hold: "bg-amber-50 text-amber-700 border-amber-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-50 text-blue-700 border-blue-200",
      medium: "bg-[#C9A882]/10 text-[#C9A882] border-[#C9A882]/20",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      urgent: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[priority] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: "Planeamento",
      in_progress: "Em Andamento",
      on_hold: "Em Espera",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority] || priority;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#C9A882] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#5F5C59]/60">A carregar projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl text-[#5F5C59] mb-2">Projetos</h1>
          <p className="text-[#5F5C59]/60">Gestão completa de projetos de design & build</p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-white border-[#C3BAAF]/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F5C59]/40" />
              <Input
                placeholder="Procurar por nome, cliente ou localização..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#C3BAAF]/20 focus:border-[#C9A882]"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="planning">Planeamento</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="on_hold">Em Espera</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Projects Grid */}
      {filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-[#C3BAAF]/20 hover:border-[#C9A882]/40 bg-white group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-serif text-xl text-[#5F5C59] mb-1 group-hover:text-[#C9A882] transition-colors">
                      {project.name}
                    </h3>
                    {project.clientName && (
                      <p className="text-sm text-[#5F5C59]/60">{project.clientName}</p>
                    )}
                  </div>
                  <Badge className={`${getPriorityColor(project.priority)} border`}>
                    {getPriorityLabel(project.priority)}
                  </Badge>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-[#5F5C59]/70 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Info */}
                <div className="space-y-2 mb-4">
                  {project.location && (
                    <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
                      <MapPin className="w-4 h-4" />
                      <span>{project.location}</span>
                    </div>
                  )}
                  {project.startDate && (
                    <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(project.startDate).toLocaleDateString('pt-PT')}
                        {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('pt-PT')}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#5F5C59]/60">Progresso</span>
                    <span className="font-medium text-[#5F5C59]">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-[#EEEAE5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C9A882] transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[#C3BAAF]/10">
                  <Badge className={`${getStatusColor(project.status)} border`}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  {project.budget && (
                    <div className="flex items-center gap-1 text-sm text-[#5F5C59]/60">
                      <TrendingUp className="w-4 h-4" />
                      <span>€{parseFloat(project.budget).toLocaleString('pt-PT')}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-[#C3BAAF]/20 bg-white">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-[#EEEAE5] rounded-full flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8 text-[#C9A882]" />
            </div>
            <h3 className="font-serif text-2xl text-[#5F5C59]">Nenhum projeto encontrado</h3>
            <p className="text-[#5F5C59]/60">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "Tente ajustar os filtros de pesquisa."
                : "Comece por criar o seu primeiro projeto."}
            </p>
            {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
              <Link href="/projects/new">
                <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
