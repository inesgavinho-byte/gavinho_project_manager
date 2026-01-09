import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface Construction {
  id: number;
  code: string;
  name: string;
  projectName: string | null;
  location: string | null;
  status: string;
  priority: string;
  progress: number | null;
  budget: number | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface ConstructionsTableProps {
  constructions: Construction[];
}

export default function ConstructionsTable({ constructions }: ConstructionsTableProps) {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-amber-100 text-amber-800",
      on_hold: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      urgent: { bg: "#9A6B5B", text: "#FFFFFF" },
      high: { bg: "#C9A86C", text: "#FFFFFF" },
      medium: { bg: "#ADAA96", text: "#FFFFFF" },
      low: { bg: "#8B8670", text: "#FFFFFF" },
    };
    const style = styles[priority] || styles.medium;
    const labels: Record<string, string> = {
      urgent: "URGENTE",
      high: "ALTA",
      medium: "MÉDIA",
      low: "BAIXA",
    };
    return (
      <span
        className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {labels[priority] || priority}
      </span>
    );
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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: "var(--warm-beige)", color: "white" }}>
            <th className="px-4 py-3 text-left text-sm font-bold">Código</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Obra</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Projeto</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Localização</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Estado</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Prioridade</th>
            <th className="px-4 py-3 text-right text-sm font-bold">Progresso</th>
            <th className="px-4 py-3 text-right text-sm font-bold">Orçamento</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Início</th>
          </tr>
        </thead>
        <tbody>
          {constructions.map((construction, index) => (
            <tr
              key={construction.id}
              className="border-b hover:bg-[var(--soft-cream)] transition-colors cursor-pointer"
              style={{
                backgroundColor: index % 2 === 0 ? "white" : "var(--soft-cream)",
                borderColor: "var(--border-light)",
              }}
            >
              <td className="px-4 py-3">
                <Link href={`/constructions/${construction.id}`}>
                  <a className="font-bold hover:underline" style={{ color: "var(--text-dark)" }}>
                    {construction.code}
                  </a>
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link href={`/constructions/${construction.id}`}>
                  <a className="font-medium hover:underline" style={{ color: "var(--text-dark)" }}>
                    {construction.name}
                  </a>
                </Link>
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {construction.projectName || "—"}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {construction.location || "—"}
              </td>
              <td className="px-4 py-3">
                <Badge className={getStatusColor(construction.status)}>
                  {getStatusLabel(construction.status)}
                </Badge>
              </td>
              <td className="px-4 py-3">{getPriorityBadge(construction.priority)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--progress-bg)" }}>
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
              <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: "var(--text-dark)" }}>
                {formatCurrency(construction.budget)}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {formatDate(construction.startDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
