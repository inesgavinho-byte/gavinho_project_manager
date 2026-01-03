import ExcelJS from "exceljs";
import type { ProjectReport, ComparisonReport } from "./reportService";

export class ExportService {
  /**
   * Export project report to Excel
   */
  async exportProjectToExcel(report: ProjectReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gavinho Project Manager";
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Resumo");
    summarySheet.columns = [
      { header: "Métrica", key: "metric", width: 30 },
      { header: "Valor", key: "value", width: 20 },
    ];

    summarySheet.addRows([
      { metric: "Nome do Projeto", value: report.project.name },
      { metric: "Status", value: report.project.status },
      { metric: "Progresso", value: `${report.project.progress}%` },
      { metric: "", value: "" },
      { metric: "Total de Tarefas", value: report.summary.totalTasks },
      { metric: "Tarefas Concluídas", value: report.summary.completedTasks },
      { metric: "Tarefas em Andamento", value: report.summary.inProgressTasks },
      { metric: "Taxa de Conclusão", value: `${report.summary.completionRate.toFixed(1)}%` },
      { metric: "", value: "" },
      { metric: "Orçamento Total", value: `€${report.summary.totalBudget.toFixed(2)}` },
      { metric: "Gasto Atual", value: `€${report.summary.actualSpent.toFixed(2)}` },
      {
        metric: "Utilização do Orçamento",
        value: `${report.summary.budgetUtilization.toFixed(1)}%`,
      },
      { metric: "", value: "" },
      { metric: "Total de Encomendas", value: report.summary.totalOrders },
      { metric: "Encomendas Pendentes", value: report.summary.pendingOrders },
      { metric: "", value: "" },
      {
        metric: "Dias Restantes",
        value: report.summary.daysRemaining !== null ? report.summary.daysRemaining : "N/A",
      },
      { metric: "Atrasado", value: report.summary.isDelayed ? "Sim" : "Não" },
    ]);

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Tasks Sheet
    const tasksSheet = workbook.addWorksheet("Tarefas");
    tasksSheet.columns = [
      { header: "Título", key: "title", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Prioridade", key: "priority", width: 12 },
      { header: "Urgência", key: "urgency", width: 12 },
      { header: "Importância", key: "importance", width: 12 },
      { header: "Prazo", key: "dueDate", width: 15 },
    ];

    report.tasks.forEach((task) => {
      tasksSheet.addRow({
        title: task.title,
        status: task.status,
        priority: task.priority,
        urgency: task.urgency,
        importance: task.importance,
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "N/A",
      });
    });

    tasksSheet.getRow(1).font = { bold: true };
    tasksSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    tasksSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Budget Sheet
    const budgetSheet = workbook.addWorksheet("Orçamentos");
    budgetSheet.columns = [
      { header: "Categoria", key: "category", width: 25 },
      { header: "Orçado", key: "budgeted", width: 15 },
      { header: "Atual", key: "actual", width: 15 },
      { header: "Variação", key: "variance", width: 15 },
    ];

    report.budgetTrend.forEach((item) => {
      budgetSheet.addRow({
        category: item.category,
        budgeted: `€${item.budgeted.toFixed(2)}`,
        actual: `€${item.actual.toFixed(2)}`,
        variance: `€${item.variance.toFixed(2)}`,
      });
    });

    budgetSheet.getRow(1).font = { bold: true };
    budgetSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    budgetSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Timeline Sheet
    const timelineSheet = workbook.addWorksheet("Timeline");
    timelineSheet.columns = [
      { header: "Data", key: "date", width: 15 },
      { header: "Progresso (%)", key: "progress", width: 15 },
      { header: "Tarefas Concluídas", key: "tasksCompleted", width: 20 },
    ];

    report.timeline.forEach((item) => {
      timelineSheet.addRow({
        date: new Date(item.date).toLocaleDateString("pt-BR"),
        progress: item.progress,
        tasksCompleted: item.tasksCompleted,
      });
    });

    timelineSheet.getRow(1).font = { bold: true };
    timelineSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    timelineSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export comparison report to Excel
   */
  async exportComparisonToExcel(report: ComparisonReport): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gavinho Project Manager";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Comparação de Projetos");
    sheet.columns = [
      { header: "Projeto", key: "name", width: 30 },
      { header: "Progresso (%)", key: "progress", width: 15 },
      { header: "Taxa de Conclusão (%)", key: "completionRate", width: 20 },
      { header: "Utilização de Orçamento (%)", key: "budgetUtilization", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Dias Restantes", key: "daysRemaining", width: 15 },
    ];

    report.projects.forEach((project) => {
      sheet.addRow({
        name: project.name,
        progress: project.progress.toFixed(1),
        completionRate: project.completionRate.toFixed(1),
        budgetUtilization: project.budgetUtilization.toFixed(1),
        status: project.status,
        daysRemaining: project.daysRemaining !== null ? project.daysRemaining : "N/A",
      });
    });

    // Add averages row
    sheet.addRow({});
    const avgRow = sheet.addRow({
      name: "MÉDIAS",
      progress: report.averages.avgProgress.toFixed(1),
      completionRate: report.averages.avgCompletionRate.toFixed(1),
      budgetUtilization: report.averages.avgBudgetUtilization.toFixed(1),
      status: "",
      daysRemaining: "",
    });

    avgRow.font = { bold: true };
    avgRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFEF3C7" },
    };

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generate filename for export
   */
  generateFilename(type: "project" | "comparison", projectName?: string): string {
    const timestamp = new Date().toISOString().substring(0, 10);
    if (type === "project" && projectName) {
      return `${projectName.replace(/\s+/g, "_")}_${timestamp}`;
    }
    return `comparacao_projetos_${timestamp}`;
  }
}

export const exportService = new ExportService();
