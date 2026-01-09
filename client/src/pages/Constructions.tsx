import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Search, Filter, LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ConstructionCard from "@/components/ConstructionCard";
import ConstructionsTable from "@/components/ConstructionsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Constructions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: constructions, isLoading } = trpc.constructions.list.useQuery();

  const filteredConstructions = constructions?.filter((construction) => {
    const matchesSearch =
      construction.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      construction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      construction.client?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || construction.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || construction.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "progress_asc":
        return (a.progress || 0) - (b.progress || 0);
      case "progress_desc":
        return (b.progress || 0) - (a.progress || 0);
      case "priority_high":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case "date_asc":
        return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
      case "date_desc":
      default:
        return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
    }
  });

  // Funções auxiliares movidas para ConstructionCard.tsx

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--soft-cream)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#C3BAAF" }}>
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: "Cormorant Garamond, serif", color: "#5F5C59" }}
              >
                Obras
              </h1>
              <p className="text-lg" style={{ color: "#5F5C59" }}>
                Gestão de obras em curso (GB)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/constructions/compare">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  style={{
                    borderColor: "#C9A882",
                    color: "#5F5C59",
                  }}
                >
                  <LayoutGrid className="h-5 w-5" />
                  Comparar
                </Button>
              </Link>
              <Link href="/constructions/new">
                <Button
                  size="lg"
                  className="gap-2"
                  style={{
                    backgroundColor: "#C9A882",
                    color: "#5F5C59",
                    borderColor: "#C9A882",
                  }}
                >
                  <Plus className="h-5 w-5" />
                  Nova Obra
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por código, nome ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="not_started">Não Iniciado</SelectItem>
                <SelectItem value="in_progress">Em Curso</SelectItem>
                <SelectItem value="on_hold">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Mais recentes</SelectItem>
                <SelectItem value="date_asc">Mais antigos</SelectItem>
                <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="progress_desc">Maior progresso</SelectItem>
                <SelectItem value="progress_asc">Menor progresso</SelectItem>
                <SelectItem value="priority_high">Prioridade alta</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border" style={{ borderColor: "#C3BAAF" }}>
              <button
                onClick={() => setViewMode("cards")}
                className="p-2 transition-colors"
                style={{
                  backgroundColor: viewMode === "cards" ? "#C9A882" : "transparent",
                  color: viewMode === "cards" ? "white" : "#5F5C59",
                }}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className="p-2 transition-colors"
                style={{
                  backgroundColor: viewMode === "table" ? "#C9A882" : "transparent",
                  color: viewMode === "table" ? "white" : "#5F5C59",
                }}
              >
                <Table className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters (Chips) */}
      {(statusFilter !== "all" || priorityFilter !== "all") && (
        <div className="container py-4">
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
                  not_started: "Não Iniciado",
                  in_progress: "Em Curso",
                  on_hold: "Pausado",
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
        </div>
      )}

      {/* Construction Cards */}
      <div className="container py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p style={{ color: "#5F5C59" }}>A carregar obras...</p>
          </div>
        ) : filteredConstructions && filteredConstructions.length > 0 ? (
          viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConstructions.map((construction) => (
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
              />
              ))}
            </div>
          ) : (
            <Card className="p-6 bg-white" style={{ borderColor: "#C3BAAF" }}>
              <ConstructionsTable constructions={filteredConstructions} />
            </Card>
          )
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4" style={{ color: "#C3BAAF" }} />
            <p className="text-lg mb-2" style={{ color: "#5F5C59" }}>
              Nenhuma obra encontrada
            </p>
            <p className="text-sm mb-6" style={{ color: "#5F5C59" }}>
              Crie a sua primeira obra para começar
            </p>
            <Link href="/constructions/new">
              <Button style={{ backgroundColor: "#C9A882", color: "#5F5C59" }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Obra
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
