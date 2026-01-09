import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FolderOpen } from "lucide-react";
import NewProjectModal from "@/components/NewProjectModal";
import ProjectCard from "@/components/ProjectCard";

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

  // Funções auxiliares de cores e labels movidas para ProjectCard.tsx

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
    <div className="space-y-8 min-h-screen" style={{ backgroundColor: 'var(--soft-cream)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-dark)' }}>Projetos</h1>
          <p className="gavinho-text-meta">Gestão completa de projetos de design & build</p>
        </div>
        <NewProjectModal />
      </div>

      {/* Filters */}
      <Card className="p-6 bg-white" style={{ borderColor: 'var(--border-light)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F5C59]/40" />
              <Input
                placeholder="Procurar por nome, cliente ou localização..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 gavinho-input"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="gavinho-select">
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
            <SelectTrigger className="gavinho-select">
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

      {/* Quick Filters (Chips) */}
      {(statusFilter !== "all" || priorityFilter !== "all") && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-[#5F5C59]/60">Filtros ativos:</span>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--warm-beige)',
                color: 'white',
                border: '1px solid var(--warm-beige)'
              }}
            >
              Estado: {{
                planning: "Planeamento",
                in_progress: "Em Andamento",
                on_hold: "Em Espera",
                completed: "Concluído",
                cancelled: "Cancelado"
              }[statusFilter]}
              <span className="text-white/80">×</span>
            </button>
          )}
          {priorityFilter !== "all" && (
            <button
              onClick={() => setPriorityFilter("all")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--warm-beige)',
                color: 'white',
                border: '1px solid var(--warm-beige)'
              }}
            >
              Prioridade: {{
                low: "Baixa",
                medium: "Média",
                high: "Alta",
                urgent: "Urgente"
              }[priorityFilter]}
              <span className="text-white/80">×</span>
            </button>
          )}
          <button
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
            className="text-xs text-[#5F5C59]/60 hover:text-[#5F5C59] underline"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              progress={project.progress}
              status={project.status}
              priority={project.priority}
              budget={project.budget}
            />
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
