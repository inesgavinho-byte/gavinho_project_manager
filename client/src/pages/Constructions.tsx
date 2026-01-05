import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Search, Filter, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const { data: constructions, isLoading } = trpc.constructions.list.useQuery();

  const filteredConstructions = constructions?.filter((construction) => {
    const matchesSearch =
      construction.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      construction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      construction.client?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || construction.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || construction.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Não Iniciado",
      in_progress: "Em Curso",
      on_hold: "Pausado",
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EEEAE5" }}>
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
          </div>
        </div>
      </div>

      {/* Construction Cards */}
      <div className="container py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p style={{ color: "#5F5C59" }}>A carregar obras...</p>
          </div>
        ) : filteredConstructions && filteredConstructions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConstructions.map((construction) => (
              <Link key={construction.id} href={`/constructions/${construction.id}`}>
                <Card
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "#EEEAE5" }}
                      >
                        <Building2 className="h-6 w-6" style={{ color: "#C9A882" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#C9A882" }}>
                          {construction.code}
                        </p>
                        <h3
                          className="text-lg font-semibold"
                          style={{ fontFamily: "Cormorant Garamond, serif", color: "#5F5C59" }}
                        >
                          {construction.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {construction.client && (
                    <p className="text-sm mb-2" style={{ color: "#5F5C59" }}>
                      <strong>Cliente:</strong> {construction.client}
                    </p>
                  )}

                  {construction.location && (
                    <p className="text-sm mb-4" style={{ color: "#5F5C59" }}>
                      <strong>Localização:</strong> {construction.location}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getStatusColor(construction.status)}>
                      {getStatusLabel(construction.status)}
                    </Badge>
                    <Badge className={getPriorityColor(construction.priority)}>
                      {getPriorityLabel(construction.priority)}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: "#5F5C59" }}>
                        Progresso
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "#C9A882" }}>
                        {construction.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${construction.progress}%`,
                          backgroundColor: "#C9A882",
                        }}
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  {construction.budget && (
                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#C3BAAF" }}>
                      <span className="text-sm" style={{ color: "#5F5C59" }}>
                        Orçamento
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "#5F5C59" }}>
                        €{parseFloat(construction.budget.toString()).toLocaleString("pt-PT")}
                      </span>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
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
