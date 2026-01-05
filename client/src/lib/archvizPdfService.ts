import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

type StatusType = "pending" | "approved_dc" | "approved_client";

interface RenderData {
  id: number;
  name: string;
  version: number;
  status: StatusType;
  compartmentName: string;
  uploadedAt: string;
  imageUrl: string;
  isFavorite: boolean;
}

interface StatusHistoryEntry {
  oldStatus: StatusType;
  newStatus: StatusType;
  changedByName: string;
  changedAt: string;
  notes?: string | null;
}

interface CommentEntry {
  content: string;
  authorName: string;
  createdAt: string;
}

interface RenderWithDetails {
  render: RenderData;
  history: StatusHistoryEntry[];
  comments: CommentEntry[];
}

interface ReportData {
  constructionName: string;
  constructionCode: string;
  totalRenders: number;
  pendingCount: number;
  approvedDcCount: number;
  approvedClientCount: number;
  renders: RenderWithDetails[];
}

// Cores GAVINHO
const COLORS = {
  primary: "#C9A882",
  secondary: "#C3BAAF",
  dark: "#5F5C59",
  light: "#F5F5F0",
  pending: "#F59E0B",
  approvedDc: "#3B82F6",
  approvedClient: "#10B981",
};

function getStatusLabel(status: StatusType): string {
  switch (status) {
    case "approved_client":
      return "Aprovada DC + Cliente";
    case "approved_dc":
      return "Aprovada DC";
    default:
      return "Pendente";
  }
}

function getStatusColor(status: StatusType): string {
  switch (status) {
    case "approved_client":
      return COLORS.approvedClient;
    case "approved_dc":
      return COLORS.approvedDc;
    default:
      return COLORS.pending;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateArchVizReport(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("GAVINHO", 15, 20);
  
  doc.setFontSize(16);
  doc.text("Relatório de Aprovações ArchViz", 15, 32);

  yPosition = 50;

  // Construction Info
  doc.setTextColor(COLORS.dark);
  doc.setFontSize(14);
  doc.text(`Obra: ${data.constructionName}`, 15, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.text(`Código: ${data.constructionCode}`, 15, yPosition);
  yPosition += 10;

  // Statistics
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.text("Estatísticas Gerais", 15, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [["Total de Renders", "Pendentes", "Aprovadas DC", "Aprovadas DC + Cliente"]],
    body: [[
      data.totalRenders.toString(),
      data.pendingCount.toString(),
      data.approvedDcCount.toString(),
      data.approvedClientCount.toString(),
    ]],
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
    },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Renders Details
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.text("Detalhes dos Renders", 15, yPosition);
  yPosition += 8;

  for (const item of data.renders) {
    const { render, history, comments } = item;

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Render Info Box
    doc.setDrawColor(COLORS.secondary);
    doc.setLineWidth(0.5);
    doc.rect(15, yPosition, 180, 25);

    doc.setFontSize(11);
    doc.setTextColor(COLORS.dark);
    doc.text(`${render.name} v${render.version}`, 20, yPosition + 8);

    doc.setFontSize(9);
    doc.text(`Compartimento: ${render.compartmentName}`, 20, yPosition + 14);
    doc.text(`Upload: ${formatDate(render.uploadedAt)}`, 20, yPosition + 20);

    // Status badge
    const statusColor = getStatusColor(render.status);
    doc.setFillColor(statusColor);
    doc.roundedRect(140, yPosition + 5, 50, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(getStatusLabel(render.status), 142, yPosition + 10);

    yPosition += 30;

    // History
    if (history.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(COLORS.primary);
      doc.text("Histórico de Mudanças:", 20, yPosition);
      yPosition += 6;

      for (const h of history) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(8);
        doc.setTextColor(COLORS.dark);
        doc.text(
          `• ${formatDate(h.changedAt)} - ${h.changedByName}: ${getStatusLabel(h.oldStatus)} → ${getStatusLabel(h.newStatus)}`,
          25,
          yPosition
        );
        yPosition += 5;

        if (h.notes) {
          doc.setTextColor(100, 100, 100);
          doc.text(`  Nota: ${h.notes}`, 30, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 3;
    }

    // Comments
    if (comments.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(COLORS.primary);
      doc.text("Comentários:", 20, yPosition);
      yPosition += 6;

      for (const c of comments) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(8);
        doc.setTextColor(COLORS.dark);
        doc.text(`• ${formatDate(c.createdAt)} - ${c.authorName}:`, 25, yPosition);
        yPosition += 5;

        // Wrap comment text
        const lines = doc.splitTextToSize(c.content, 160);
        doc.text(lines, 30, yPosition);
        yPosition += lines.length * 4 + 3;
      }

      yPosition += 3;
    }

    yPosition += 5;
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Gerado em ${formatDate(new Date().toISOString())}`,
      15,
      285
    );
  }

  // Save PDF
  const fileName = `ArchViz_${data.constructionCode}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
