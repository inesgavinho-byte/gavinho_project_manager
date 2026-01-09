import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: number;
  name: string;
  clientName: string | null;
  location: string | null;
  status: string;
  priority: string;
  progress: number | null;
  budget: number | null;
  createdAt: Date | null;
}

interface ProjectsTableProps {
  projects: Project[];
}

export default function ProjectsTable({ projects }: ProjectsTableProps) {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-blue-100 text-blue-800",
      in_progress: "bg-amber-100 text-amber-800",
      on_hold: "bg-gray-100 text-gray-800",
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
            <th className="px-4 py-3 text-left text-sm font-bold">Projeto</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Cliente</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Localização</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Estado</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Prioridade</th>
            <th className="px-4 py-3 text-right text-sm font-bold">Progresso</th>
            <th className="px-4 py-3 text-right text-sm font-bold">Orçamento</th>
            <th className="px-4 py-3 text-left text-sm font-bold">Data</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr
              key={project.id}
              className="border-b hover:bg-[var(--soft-cream)] transition-colors cursor-pointer"
              style={{
                backgroundColor: index % 2 === 0 ? "white" : "var(--soft-cream)",
                borderColor: "var(--border-light)",
              }}
            >
              <td className="px-4 py-3">
                <Link href={`/projects/${project.id}`}>
                  <a className="font-medium hover:underline" style={{ color: "var(--text-dark)" }}>
                    {project.name}
                  </a>
                </Link>
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {project.clientName || "—"}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {project.location || "—"}
              </td>
              <td className="px-4 py-3">
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </td>
              <td className="px-4 py-3">{getPriorityBadge(project.priority)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--progress-bg)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${project.progress || 0}%`,
                        backgroundColor: "var(--olive-gray)",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-dark)" }}>
                    {project.progress || 0}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: "var(--text-dark)" }}>
                {formatCurrency(project.budget)}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                {formatDate(project.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
