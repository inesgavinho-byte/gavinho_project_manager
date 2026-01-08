import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { listProjectMaterials } from "./libraryDb";

// Helper to get materials with proper typing
async function getProjectMaterialsWithDetails(projectId: number) {
  return await listProjectMaterials(projectId);
}

interface MaterialExportData {
  projectId: number;
  projectName: string;
  projectCode: string;
  includePrice: boolean;
}

/**
 * Gera PDF com lista de materiais do projeto
 */
export async function generateMaterialsPDF(data: MaterialExportData): Promise<Buffer> {
  const { projectId, projectName, projectCode, includePrice } = data;

  // Buscar materiais do projeto
  const materials = await getProjectMaterialsWithDetails(projectId);

  // Criar documento PDF
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("GAVINHO", 14, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Lista de Materiais", 14, 30);

  doc.setFontSize(10);
  doc.text(`Projeto: ${projectCode} - ${projectName}`, 14, 38);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 44);

  // Preparar dados da tabela
  const tableData = materials.map((m) => {
    const materialName = m.material?.name || "Material sem nome";
    const materialCategory = m.material?.category || "-";
    const materialUnit = m.material?.unit || "un";
    const quantity = m.quantity || "0";
    const unitPrice = parseFloat(m.unitPrice || "0");
    const totalPrice = parseFloat(m.totalPrice || "0");
    const notes = m.notes || "";

    const row = [
      materialName,
      materialCategory,
      `${quantity} ${materialUnit}`,
    ];

    if (includePrice) {
      row.push(`${unitPrice.toFixed(2)} €`);
      row.push(`${totalPrice.toFixed(2)} €`);
    }

    if (notes) {
      row.push(notes);
    } else {
      row.push("-");
    }

    return row;
  });

  // Cabeçalhos da tabela
  const headers = ["Material", "Categoria", "Quantidade"];
  if (includePrice) {
    headers.push("Preço Unit.", "Total");
  }
  headers.push("Notas");

  // Gerar tabela
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 50,
    theme: "grid",
    headStyles: {
      fillColor: [201, 168, 130], // #C9A882 (dourado GAVINHO)
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      ...(includePrice ? { 3: { cellWidth: 25 }, 4: { cellWidth: 25 } } : {}),
    },
  });

  // Adicionar total no final (se incluir preços)
  if (includePrice && materials.length > 0) {
    const totalCost = materials.reduce((sum, m) => sum + (m.totalPrice || 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Custo Total Estimado: ${totalCost.toFixed(2)} €`, 14, finalY);
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // Retornar buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

/**
 * Gera Excel com lista de materiais do projeto
 */
export async function generateMaterialsExcel(data: MaterialExportData): Promise<Buffer> {
  const { projectId, projectName, projectCode, includePrice } = data;

  // Buscar materiais do projeto
  const materials = await getProjectMaterialsWithDetails(projectId);

  // Criar workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GAVINHO";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Materiais");

  // Cabeçalho
  worksheet.mergeCells("A1:F1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "GAVINHO - Lista de Materiais";
  titleCell.font = { size: 16, bold: true, color: { argb: "FFC9A882" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.getCell("A2").value = `Projeto: ${projectCode} - ${projectName}`;
  worksheet.getCell("A3").value = `Data: ${new Date().toLocaleDateString("pt-PT")}`;

  // Cabeçalhos da tabela
  const headerRow = worksheet.getRow(5);
  const headers = ["Material", "Categoria", "Fornecedor", "Quantidade"];
  if (includePrice) {
    headers.push("Preço Unit. (€)", "Total (€)");
  }
  headers.push("Notas");

  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC9A882" }, // Dourado GAVINHO
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

    const values: any[] = [
      materialName,
      materialCategory,
      materialSupplier,
      `${quantity} ${materialUnit}`,
    ];

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

    const totalFormula = `SUM(F6:F${5 + materials.length})`;
    totalRow.getCell(6).value = { formula: totalFormula };
    totalRow.getCell(6).numFmt = "#,##0.00";
    totalRow.getCell(6).font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F5F5" },
    };
  }

  // Ajustar largura das colunas
  worksheet.getColumn(1).width = 35; // Material
  worksheet.getColumn(2).width = 20; // Categoria
  worksheet.getColumn(3).width = 25; // Fornecedor
  worksheet.getColumn(4).width = 15; // Quantidade
  if (includePrice) {
    worksheet.getColumn(5).width = 15; // Preço Unit.
    worksheet.getColumn(6).width = 15; // Total
    worksheet.getColumn(7).width = 40; // Notas
  } else {
    worksheet.getColumn(5).width = 40; // Notas
  }

  // Retornar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
