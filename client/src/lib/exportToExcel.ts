import * as XLSX from "xlsx";

interface ProjectExportData {
  id: number;
  name: string;
  clientName: string | null;
  location: string | null;
  status: string;
  priority: string;
  progress: number | null;
  budget: number | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
}

interface ConstructionExportData {
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
  client: string | null;
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    planning: "Planeamento",
    in_progress: "Em Andamento",
    on_hold: "Em Espera",
    completed: "Concluído",
    cancelled: "Cancelado",
    not_started: "Não Iniciado",
    in_course: "Em Curso",
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

export function exportProjectsToExcel(projects: ProjectExportData[], filename: string = "comparacao_projetos.xlsx") {
  // Preparar dados para exportação
  const data = projects.map((project) => ({
    "Nome do Projeto": project.name,
    Cliente: project.clientName || "—",
    Localização: project.location || "—",
    Estado: getStatusLabel(project.status),
    Prioridade: getPriorityLabel(project.priority),
    "Progresso (%)": project.progress || 0,
    Orçamento: formatCurrency(project.budget),
    "Data de Início": formatDate(project.startDate),
    "Data de Fim": formatDate(project.endDate),
    Descrição: project.description || "—",
  }));

  // Criar workbook
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 30 }, // Nome do Projeto
    { wch: 25 }, // Cliente
    { wch: 20 }, // Localização
    { wch: 15 }, // Estado
    { wch: 12 }, // Prioridade
    { wch: 12 }, // Progresso
    { wch: 15 }, // Orçamento
    { wch: 15 }, // Data de Início
    { wch: 15 }, // Data de Fim
    { wch: 40 }, // Descrição
  ];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comparação de Projetos");

  // Exportar
  XLSX.writeFile(wb, filename);
}

export function exportConstructionsToExcel(
  constructions: ConstructionExportData[],
  filename: string = "comparacao_obras.xlsx"
) {
  // Preparar dados para exportação
  const data = constructions.map((construction) => ({
    Código: construction.code,
    "Nome da Obra": construction.name,
    "Projeto Associado": construction.projectName || "—",
    Localização: construction.location || "—",
    Estado: getStatusLabel(construction.status),
    Prioridade: getPriorityLabel(construction.priority),
    "Progresso (%)": construction.progress || 0,
    Orçamento: formatCurrency(construction.budget),
    "Data de Início": formatDate(construction.startDate),
    "Data de Fim Prevista": formatDate(construction.endDate),
    Cliente: construction.client || "—",
  }));

  // Criar workbook
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 15 }, // Código
    { wch: 30 }, // Nome da Obra
    { wch: 25 }, // Projeto Associado
    { wch: 20 }, // Localização
    { wch: 15 }, // Estado
    { wch: 12 }, // Prioridade
    { wch: 12 }, // Progresso
    { wch: 15 }, // Orçamento
    { wch: 15 }, // Data de Início
    { wch: 15 }, // Data de Fim Prevista
    { wch: 25 }, // Cliente
  ];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comparação de Obras");

  // Exportar
  XLSX.writeFile(wb, filename);
}
