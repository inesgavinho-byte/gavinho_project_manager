import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportData {
  construction: {
    code: string;
    name: string;
    address: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  attendance: Array<{
    workerName: string;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    totalHours: number;
  }>;
  workHours: Array<{
    workerName: string;
    taskDescription: string;
    hours: number;
    date: Date;
  }>;
  materials: Array<{
    materialName: string;
    quantity: number;
    unit: string;
    usedBy: string;
    date: Date;
  }>;
  photos: Array<{
    photoUrl: string;
    description: string | null;
    location: string | null;
    uploadedBy: string;
    date: Date;
  }>;
  nonCompliances: Array<{
    description: string;
    severity: string;
    status: string;
    responsibleName: string | null;
    reportedDate: Date;
  }>;
}

export async function generateSiteReport(data: ReportData, type: "daily" | "weekly"): Promise<Buffer> {
  const doc = new jsPDF();
  let yPos = 20;

  // Add GAVINHO BUILD logo
  const logoPath = "/home/ubuntu/gavinho_project_manager/client/public/gavinho-build-logo.png";
  try {
    doc.addImage(logoPath, "PNG", 15, 10, 50, 15);
  } catch (error) {
    console.error("Logo not found, skipping");
  }

  // Company header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("GAVINHO & ASSOCIADOS", 200, 15, { align: "right" });
  doc.text("Prom. Imobiliária e Reabilitação, Lda", 200, 20, { align: "right" });
  doc.text("Praça da Alegria Nº 66-A", 200, 25, { align: "right" });
  doc.text("1250-004 Lisboa", 200, 30, { align: "right" });
  doc.text("NIF: 513 217 274", 200, 35, { align: "right" });

  yPos = 50;

  // Report title
  doc.setFontSize(18);
  doc.setTextColor(0);
  const reportTitle = type === "daily" ? "Relatório Diário de Obra" : "Relatório Semanal de Obra";
  doc.text(reportTitle, 105, yPos, { align: "center" });
  yPos += 15;

  // Construction info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Obra: ${data.construction.code} - ${data.construction.name}`, 15, yPos);
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Morada: ${data.construction.address}`, 15, yPos);
  yPos += 7;
  doc.text(
    `Período: ${format(data.period.startDate, "dd/MM/yyyy", { locale: ptBR })} a ${format(data.period.endDate, "dd/MM/yyyy", { locale: ptBR })}`,
    15,
    yPos
  );
  yPos += 12;

  // Summary section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Executivo", 15, yPos);
  yPos += 8;

  const totalHours = data.workHours.reduce((sum, wh) => sum + wh.hours, 0);
  const totalWorkers = new Set(data.attendance.map(a => a.workerName)).size;
  const totalPhotos = data.photos.length;
  const pendingNonCompliances = data.nonCompliances.filter(nc => nc.status === "open").length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`• Total de Trabalhadores: ${totalWorkers}`, 15, yPos);
  yPos += 6;
  doc.text(`• Horas Trabalhadas: ${totalHours.toFixed(2)}h`, 15, yPos);
  yPos += 6;
  doc.text(`• Materiais Consumidos: ${data.materials.length} registos`, 15, yPos);
  yPos += 6;
  doc.text(`• Fotografias: ${totalPhotos}`, 15, yPos);
  yPos += 6;
  doc.text(`• Não Conformidades Pendentes: ${pendingNonCompliances}`, 15, yPos);
  yPos += 12;

  // Attendance table
  if (data.attendance.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Picagem de Ponto", 15, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Trabalhador", "Data", "Entrada", "Saída", "Horas"]],
      body: data.attendance.map(a => [
        a.workerName,
        format(a.date, "dd/MM/yyyy"),
        a.checkIn ? format(a.checkIn, "HH:mm") : "-",
        a.checkOut ? format(a.checkOut, "HH:mm") : "-",
        a.totalHours.toFixed(2) + "h",
      ]),
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Work hours table
  if (data.workHours.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Registo de Horas por Tarefa", 15, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Trabalhador", "Tarefa", "Horas", "Data"]],
      body: data.workHours.map(wh => [
        wh.workerName,
        wh.taskDescription,
        wh.hours.toFixed(2) + "h",
        format(wh.date, "dd/MM/yyyy"),
      ]),
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Materials table
  if (data.materials.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Consumo de Materiais", 15, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Material", "Quantidade", "Unidade", "Utilizado Por", "Data"]],
      body: data.materials.map(m => [
        m.materialName,
        m.quantity.toString(),
        m.unit,
        m.usedBy,
        format(m.date, "dd/MM/yyyy"),
      ]),
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Non-compliances table
  if (data.nonCompliances.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Não Conformidades", 15, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Descrição", "Severidade", "Estado", "Responsável", "Data"]],
      body: data.nonCompliances.map(nc => [
        nc.description.substring(0, 50) + (nc.description.length > 50 ? "..." : ""),
        nc.severity,
        nc.status,
        nc.responsibleName || "-",
        format(nc.reportedDate, "dd/MM/yyyy"),
      ]),
      theme: "grid",
      headStyles: { fillColor: [231, 76, 60] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Photos section
  if (data.photos.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fotografias de Obra", 15, yPos);
    yPos += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total de ${data.photos.length} fotografias registadas no período.`, 15, yPos);
    yPos += 8;

    // List photos (without embedding images to keep PDF size manageable)
    data.photos.slice(0, 20).forEach((photo, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(
        `${index + 1}. ${format(photo.date, "dd/MM/yyyy HH:mm")} - ${photo.uploadedBy}`,
        15,
        yPos
      );
      yPos += 5;

      if (photo.location) {
        doc.setTextColor(100);
        doc.text(`   Local: ${photo.location}`, 15, yPos);
        yPos += 5;
      }

      if (photo.description) {
        doc.setTextColor(100);
        doc.text(`   ${photo.description}`, 15, yPos);
        yPos += 5;
      }

      doc.setTextColor(0);
      yPos += 3;
    });

    if (data.photos.length > 20) {
      yPos += 5;
      doc.setTextColor(150);
      doc.text(`... e mais ${data.photos.length - 20} fotografias.`, 15, yPos);
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      15,
      290
    );
    doc.text(`Página ${i} de ${pageCount}`, 200, 290, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
