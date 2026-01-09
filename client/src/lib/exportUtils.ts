import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title: string;
  filename: string;
}

/**
 * Export data to Excel format
 */
export function exportToExcel(data: ExportData) {
  const worksheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, data.title);
  
  // Auto-size columns
  const maxWidth = data.headers.map((_, i) => {
    const headerLen = data.headers[i].length;
    const maxDataLen = Math.max(...data.rows.map(row => String(row[i] || '').length));
    return Math.max(headerLen, maxDataLen, 10);
  });
  
  worksheet['!cols'] = maxWidth.map(w => ({ wch: w + 2 }));
  
  XLSX.writeFile(workbook, `${data.filename}.xlsx`);
}

/**
 * Export data to PDF format
 */
export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(data.title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, 14, 28);
  
  // Add table
  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [139, 117, 89], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  doc.save(`${data.filename}.pdf`);
}

/**
 * Format financial data for export
 */
export function formatFinancialDataForExport(kpis: any, projects: any[]): ExportData {
  const headers = ['Projeto', 'Cliente', 'Estado', 'Orçamento', 'Custo Real', 'Margem %', 'ROI %'];
  const rows = projects.map(p => [
    p.name || '',
    p.clientName || '',
    p.status || '',
    `€${Number(p.budget || 0).toFixed(2)}`,
    `€${Number(p.actualCost || 0).toFixed(2)}`,
    `${p.profitMargin?.toFixed(2) || 0}%`,
    `${p.roi?.toFixed(2) || 0}%`,
  ]);
  
  // Add summary row
  rows.push([
    'TOTAL',
    '',
    '',
    `€${kpis?.totalBudget?.toFixed(2) || 0}`,
    `€${kpis?.totalSpent?.toFixed(2) || 0}`,
    `${kpis?.averageProfitMargin?.toFixed(2) || 0}%`,
    '',
  ]);
  
  return {
    headers,
    rows,
    title: 'Relatório Financeiro',
    filename: `relatorio-financeiro-${new Date().toISOString().split('T')[0]}`,
  };
}

/**
 * Format team productivity data for export
 */
export function formatTeamDataForExport(timeEntries: any[], summary: any): ExportData {
  const headers = ['Data', 'Projeto', 'Descrição', 'Horas'];
  const rows = timeEntries.map(entry => [
    new Date(entry.date).toLocaleDateString('pt-PT'),
    entry.projectName || '',
    entry.description || '',
    Number(entry.hours || 0).toFixed(2),
  ]);
  
  // Add summary row
  rows.push([
    'TOTAL',
    '',
    `${summary?.daysWorked || 0} dias trabalhados`,
    `${summary?.totalHours || 0}h`,
  ]);
  
  return {
    headers,
    rows,
    title: 'Relatório de Produtividade',
    filename: `relatorio-produtividade-${new Date().toISOString().split('T')[0]}`,
  };
}
