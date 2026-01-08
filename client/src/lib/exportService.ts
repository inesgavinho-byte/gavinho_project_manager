import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface Material {
  id: number;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  notes: string | null;
  status: string;
  material: {
    id: number;
    name: string;
    description: string | null;
    category: string;
    supplier: string | null;
    price: string | null;
    unit: string;
  } | null;
}

interface ExportOptions {
  projectCode: string;
  projectName: string;
  materials: Material[];
  includePrice: boolean;
}

export async function exportMaterialsToPDF(options: ExportOptions) {
  const { projectCode, projectName, materials, includePrice } = options;

  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Lista de Materiais", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Projeto: ${projectCode} - ${projectName}`, 14, 28);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 34);

  // Preparar dados da tabela
  const tableData = materials.map((m) => {
    const materialName = m.material?.name || "Material sem nome";
    const materialCategory = m.material?.category || "-";
    const materialUnit = m.material?.unit || "un";
    const quantity = m.quantity || "0";
    const unitPrice = parseFloat(m.unitPrice || "0");
    const totalPrice = parseFloat(m.totalPrice || "0");
    const notes = m.notes || "-";

    const row: any[] = [materialName, materialCategory, `${quantity} ${materialUnit}`];

    if (includePrice) {
      row.push(`${unitPrice.toFixed(2)} €`);
      row.push(`${totalPrice.toFixed(2)} €`);
    }

    row.push(notes);
    return row;
  });

  // Cabeçalhos da tabela
  const headers: string[] = ["Material", "Categoria", "Quantidade"];
  if (includePrice) {
    headers.push("Preço Unit.");
    headers.push("Total");
  }
  headers.push("Notas");

  // Gerar tabela
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [200, 180, 140], textColor: [0, 0, 0] },
  });

  // Total
  if (includePrice && materials.length > 0) {
    const total = materials.reduce((sum, m) => sum + parseFloat(m.totalPrice || "0"), 0);
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Custo Total Estimado: ${total.toFixed(2)} €`, 14, finalY + 10);
  }

  // Download
  doc.save(`${projectCode}_materiais.pdf`);
}

export async function exportMaterialsToExcel(options: ExportOptions) {
  const { projectCode, projectName, materials, includePrice } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Materiais");

  // Cabeçalho
  worksheet.mergeCells("A1:G1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Lista de Materiais";
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.getCell("A2").value = `Projeto: ${projectCode} - ${projectName}`;
  worksheet.getCell("A3").value = `Data: ${new Date().toLocaleDateString("pt-PT")}`;

  // Cabeçalhos da tabela
  const headers: string[] = ["Material", "Categoria", "Fornecedor", "Quantidade"];
  if (includePrice) {
    headers.push("Preço Unitário (€)", "Total (€)");
  }
  headers.push("Notas");

  const headerRow = worksheet.getRow(5);
  headerRow.values = headers;
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC8B48C" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 20;

  // Dados
  materials.forEach((m, index) => {
    const row = worksheet.getRow(6 + index);
    const materialName = m.material?.name || "Material sem nome";
    const materialCategory = m.material?.category || "-";
    const materialSupplier = m.material?.supplier || "-";
    const materialUnit = m.material?.unit || "un";
    const quantity = m.quantity || "0";
    const unitPrice = parseFloat(m.unitPrice || "0");
    const totalPrice = parseFloat(m.totalPrice || "0");
    const notes = m.notes || "";

    const values: any[] = [materialName, materialCategory, materialSupplier, `${quantity} ${materialUnit}`];

    if (includePrice) {
      values.push(unitPrice);
      values.push(totalPrice);
    }

    values.push(notes);
    row.values = values;

    // Formatação de preços
    if (includePrice) {
      row.getCell(5).numFmt = "#,##0.00";
      row.getCell(6).numFmt = "#,##0.00";
    }
  });

  // Total
  if (includePrice && materials.length > 0) {
    const totalRow = worksheet.getRow(6 + materials.length);
    totalRow.getCell(1).value = "TOTAL";
    totalRow.getCell(1).font = { bold: true };
    const total = materials.reduce((sum, m) => sum + parseFloat(m.totalPrice || "0"), 0);
    totalRow.getCell(6).value = total;
    totalRow.getCell(6).numFmt = "#,##0.00";
    totalRow.getCell(6).font = { bold: true };
  }

  // Ajustar largura das colunas
  worksheet.columns = [
    { width: 25 },
    { width: 15 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 30 },
  ];

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectCode}_materiais.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
