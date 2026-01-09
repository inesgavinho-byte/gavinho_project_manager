import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, X, Download, FileText } from "lucide-react";
import { exportConstructionsToExcel } from "@/lib/exportToExcel";
import { exportConstructionsToPDF } from "@/lib/exportToPDF";
import { ConstructionComparisonCharts } from "@/components/ComparisonCharts";

export default function ConstructionsCompare() {
  const [, setLocation] = useLocation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data: constructions } = trpc.constructions.list.useQuery();

  const selectedConstructions = constructions?.filter((c) => selectedIds.includes(c.id)) || [];

  const toggleConstruction = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
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
      urgent: "URGENTE",
      high: "ALTA",
      medium: "MÉDIA",
      low: "BAIXA",
    };
    return labels[priority] || priority;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-PT");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--soft-cream)" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "var(--border-light)" }}>
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/constructions")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 style={{ color: "var(--text-dark)" }}>Comparar Obras</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Selecione até 3 obras para comparação lado a lado
                </p>
              </div>
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--text-dark)" }}>
              {selectedIds.length}/3 selecionados
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-6">
        {/* Selection Area */}
        {selectedIds.length < 3 && (
          <Card className="p-6 bg-white" style={{ borderColor: "var(--border-light)" }}>
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-dark)" }}>
              Selecionar Obras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {constructions?.map((construction) => (
                <div
                  key={construction.id}
                  className="flex items-center gap-3 p-3 rounded border transition-colors cursor-pointer"
                  style={{
                    borderColor: selectedIds.includes(construction.id)
                      ? "var(--warm-beige)"
                      : "var(--border-light)",
                    backgroundColor: selectedIds.includes(construction.id)
                      ? "var(--soft-cream)"
                      : "white",
                  }}
                  onClick={() => toggleConstruction(construction.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(construction.id)}
                    disabled={!selectedIds.includes(construction.id) && selectedIds.length >= 3}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--text-dark)" }}>
                      {construction.code}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {construction.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Comparison Table */}
        {selectedConstructions.length > 0 && (
          <Card className="p-6 bg-white overflow-x-auto" style={{ borderColor: "var(--border-light)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "var(--text-dark)" }}>
                Comparação Detalhada
              </h3>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConstructionsToExcel(selectedConstructions)}
                      className="gap-2"
                      style={{ borderColor: "var(--warm-beige)", color: "var(--text-dark)" }}
                    >
                      <Download className="h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConstructionsToPDF(selectedConstructions)}
                      className="gap-2"
                      style={{ borderColor: "var(--warm-beige)", color: "var(--text-dark)" }}
                    >
                      <FileText className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar seleção
                    </Button>
                  </>
                )}
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th
                    className="px-4 py-3 text-left text-sm font-bold border-r"
                    style={{
                      backgroundColor: "var(--warm-beige)",
                      color: "white",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Métrica
                  </th>
                  {selectedConstructions.map((construction) => (
                    <th
                      key={construction.id}
                      className="px-4 py-3 text-left text-sm font-bold"
                      style={{ backgroundColor: "var(--warm-beige)", color: "white" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{construction.code}</span>
                        <button
                          onClick={() => setSelectedIds(selectedIds.filter((id) => id !== construction.id))}
                          className="hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Código */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Código
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3 font-bold" style={{ color: "var(--text-dark)" }}>
                      <Link href={`/constructions/${construction.id}`}>
                        <a className="hover:underline">{construction.code}</a>
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Nome */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Nome da Obra
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3" style={{ color: "var(--text-dark)" }}>
                      {construction.name}
                    </td>
                  ))}
                </tr>

                {/* Projeto Associado */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Projeto Associado
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {construction.projectName || "—"}
                    </td>
                  ))}
                </tr>

                {/* Localização */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Localização
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {construction.location || "—"}
                    </td>
                  ))}
                </tr>

                {/* Estado */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Estado
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: "var(--olive-gray)", color: "white" }}
                      >
                        {getStatusLabel(construction.status)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Prioridade */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Prioridade
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-bold uppercase"
                        style={{
                          backgroundColor:
                            construction.priority === "urgent"
                              ? "#9A6B5B"
                              : construction.priority === "high"
                              ? "#C9A86C"
                              : construction.priority === "medium"
                              ? "#ADAA96"
                              : "#8B8670",
                          color: "white",
                        }}
                      >
                        {getPriorityLabel(construction.priority)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Progresso */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Progresso
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--progress-bg)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${construction.progress || 0}%`,
                              backgroundColor: "var(--olive-gray)",
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--text-dark)" }}>
                          {construction.progress || 0}%
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Orçamento */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Orçamento
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3 font-semibold" style={{ color: "var(--text-dark)" }}>
                      {formatCurrency(construction.budget)}
                    </td>
                  ))}
                </tr>

                {/* Data de Início */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Data de Início
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {formatDate(construction.startDate)}
                    </td>
                  ))}
                </tr>

                {/* Data de Fim */}
                <tr className="border-b" style={{ borderColor: "var(--border-light)" }}>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Data de Fim Prevista
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {formatDate(construction.endDate)}
                    </td>
                  ))}
                </tr>

                {/* Cliente */}
                <tr>
                  <td
                    className="px-4 py-3 font-medium border-r"
                    style={{
                      backgroundColor: "var(--soft-cream)",
                      color: "var(--text-dark)",
                      borderColor: "var(--border-light)",
                    }}
                  >
                    Cliente
                  </td>
                  {selectedConstructions.map((construction) => (
                    <td key={construction.id} className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                      {construction.client || "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Card>
        )}

        {/* Gráficos de Comparação */}
        {selectedConstructions.length > 0 && (
          <ConstructionComparisonCharts constructions={selectedConstructions} />
        )}

        {selectedConstructions.length === 0 && (
          <Card className="p-12 text-center bg-white" style={{ borderColor: "var(--border-light)" }}>
            <p className="text-lg" style={{ color: "var(--text-muted)" }}>
              Selecione obras acima para começar a comparação
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}