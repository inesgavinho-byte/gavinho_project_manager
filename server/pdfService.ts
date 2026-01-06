import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { readFileSync } from "fs";

/**
 * Serviço de Geração de PDFs para Relatórios RH
 * Utiliza jsPDF e jspdf-autotable para criar relatórios profissionais
 */

interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  nif: string;
  logoPath: string;
}

const GAVINHO_ARQUITETURA: CompanyInfo = {
  name: "GAVINHO Arquitetura e Interiores Lda",
  address: "Praça da Alegria Nº 66-A",
  city: "1250-004 Lisboa",
  nif: "513 768 580",
  logoPath: "/home/ubuntu/gavinho_project_manager/client/public/gavinho-logo.png",
};

const GAVINHO_BUILD: CompanyInfo = {
  name: "GAVINHO & ASSOCIADOS - Prom. Imobiliária e Reabilitação, Lda",
  address: "Praça da Alegria Nº 66-A",
  city: "1250-004 Lisboa",
  nif: "513 217 274",
  logoPath: "/home/ubuntu/gavinho_project_manager/client/public/gavinho-build-logo.png",
};

/**
 * Converte imagem PNG para base64
 */
function getLogoBase64(logoPath: string): string {
  try {
    const imageBuffer = readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Erro ao carregar logotipo:", error);
    return "";
  }
}

/**
 * Adiciona cabeçalho GAVINHO ao PDF
 */
function addHeader(doc: jsPDF, company: CompanyInfo, title: string) {
  const logoBase64 = getLogoBase64(company.logoPath);
  
  // Add logo if available
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 15, 10, 60, 15);
    } catch (error) {
      console.error("Erro ao adicionar logotipo ao PDF:", error);
    }
  }
  
  // Company info (right side)
  doc.setFontSize(9);
  doc.setTextColor(95, 92, 89); // #5F5C59
  doc.text(company.name, 200, 12, { align: "right" });
  doc.text(company.address, 200, 17, { align: "right" });
  doc.text(company.city, 200, 22, { align: "right" });
  doc.text(`NIF: ${company.nif}`, 200, 27, { align: "right" });
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(95, 92, 89);
  doc.text(title, 15, 45);
  
  // Horizontal line
  doc.setDrawColor(201, 168, 130); // #C9A882
  doc.setLineWidth(0.5);
  doc.line(15, 50, 195, 50);
}

/**
 * Adiciona rodapé ao PDF
 */
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Página ${pageNumber} de ${totalPages}`,
    105,
    pageHeight - 10,
    { align: "center" }
  );
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-PT")} às ${new Date().toLocaleTimeString("pt-PT")}`,
    105,
    pageHeight - 5,
    { align: "center" }
  );
}

/**
 * Gera relatório de ausências em PDF
 */
export async function generateAbsencesReportPDF(data: {
  absences: Array<{
    userName: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    status: string;
  }>;
  startDate?: string;
  endDate?: string;
  companyType?: "arquitetura" | "build";
}): Promise<Buffer> {
  const doc = new jsPDF();
  const company = data.companyType === "build" ? GAVINHO_BUILD : GAVINHO_ARQUITETURA;
  
  // Header
  addHeader(doc, company, "Relatório de Ausências");
  
  // Period info
  let yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(95, 92, 89);
  if (data.startDate && data.endDate) {
    doc.text(
      `Período: ${new Date(data.startDate).toLocaleDateString("pt-PT")} a ${new Date(data.endDate).toLocaleDateString("pt-PT")}`,
      15,
      yPos
    );
    yPos += 10;
  }
  
  // Summary stats
  const totalAbsences = data.absences.length;
  const totalDays = data.absences.reduce((sum, a) => sum + a.days, 0);
  const approved = data.absences.filter(a => a.status === "approved").length;
  const pending = data.absences.filter(a => a.status === "pending").length;
  
  doc.setFontSize(9);
  doc.setTextColor(95, 92, 89);
  doc.text(`Total de ausências: ${totalAbsences}`, 15, yPos);
  doc.text(`Total de dias: ${totalDays}`, 15, yPos + 5);
  doc.text(`Aprovadas: ${approved} | Pendentes: ${pending}`, 15, yPos + 10);
  
  yPos += 20;
  
  // Table
  const tableData = data.absences.map(a => [
    a.userName,
    translateAbsenceType(a.type),
    new Date(a.startDate).toLocaleDateString("pt-PT"),
    new Date(a.endDate).toLocaleDateString("pt-PT"),
    a.days.toString(),
    translateStatus(a.status),
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Colaborador", "Tipo", "Início", "Fim", "Dias", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [201, 168, 130], // #C9A882
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [95, 92, 89],
    },
    alternateRowStyles: {
      fillColor: [238, 234, 229], // #EEEAE5
    },
    margin: { left: 15, right: 15 },
  });
  
  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Gera relatório de timesheets em PDF
 */
export async function generateTimesheetsReportPDF(data: {
  timesheets: Array<{
    userName: string;
    date: string;
    projectCode: string;
    hours: number;
    description: string;
    status: string;
  }>;
  stats?: {
    totalHours: number;
    uniqueProjects: number;
    approvedHours: number;
  };
  startDate?: string;
  endDate?: string;
  companyType?: "arquitetura" | "build";
}): Promise<Buffer> {
  const doc = new jsPDF();
  const company = data.companyType === "build" ? GAVINHO_BUILD : GAVINHO_ARQUITETURA;
  
  // Header
  addHeader(doc, company, "Relatório de Timesheets");
  
  // Period info
  let yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(95, 92, 89);
  if (data.startDate && data.endDate) {
    doc.text(
      `Período: ${new Date(data.startDate).toLocaleDateString("pt-PT")} a ${new Date(data.endDate).toLocaleDateString("pt-PT")}`,
      15,
      yPos
    );
    yPos += 10;
  }
  
  // Summary stats
  if (data.stats) {
    doc.setFontSize(9);
    doc.text(`Total de horas: ${data.stats.totalHours}h`, 15, yPos);
    doc.text(`Projetos ativos: ${data.stats.uniqueProjects}`, 15, yPos + 5);
    doc.text(`Horas aprovadas: ${data.stats.approvedHours}h`, 15, yPos + 10);
    yPos += 20;
  }
  
  // Table
  const tableData = data.timesheets.map(t => [
    t.userName,
    new Date(t.date).toLocaleDateString("pt-PT"),
    t.projectCode,
    `${t.hours}h`,
    t.description.length > 50 ? t.description.substring(0, 47) + "..." : t.description,
    translateStatus(t.status),
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Colaborador", "Data", "Projeto", "Horas", "Descrição", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [201, 168, 130], // #C9A882
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [95, 92, 89],
    },
    alternateRowStyles: {
      fillColor: [238, 234, 229], // #EEEAE5
    },
    margin: { left: 15, right: 15 },
    columnStyles: {
      4: { cellWidth: 60 }, // Description column wider
    },
  });
  
  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Traduz tipo de ausência para português
 */
function translateAbsenceType(type: string): string {
  const translations: Record<string, string> = {
    vacation: "Férias",
    sick: "Doença",
    personal: "Assunto Pessoal",
    other: "Outro",
  };
  return translations[type] || type;
}

/**
 * Traduz status para português
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    approved: "Aprovado",
    rejected: "Rejeitado",
    pending: "Pendente",
  };
  return translations[status] || status;
}
