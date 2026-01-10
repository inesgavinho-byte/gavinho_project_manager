import PDFDocument from "pdfkit";
import { getMaterialById } from "./libraryDb.js";

interface GeneratePDFOptions {
  projectId?: number;
  materialIds?: number[];
  includeImages: boolean;
  includeTechnicalSpecs: boolean;
  userId: number;
}

export async function generateMaterialsReportPDF(
  options: GeneratePDFOptions
): Promise<Buffer> {
  const { materialIds, includeImages, includeTechnicalSpecs } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header with GAVINHO branding
      doc
        .fontSize(24)
        .fillColor("#C9A882")
        .text("GAVINHO", 50, 50)
        .fontSize(12)
        .fillColor("#5F5C59")
        .text("Relatório de Materiais", 50, 80);

      doc
        .fontSize(10)
        .fillColor("#8A8A8A")
        .text(`Gerado em: ${new Date().toLocaleDateString("pt-PT")}`, 50, 100);

      // Line separator
      doc
        .moveTo(50, 120)
        .lineTo(545, 120)
        .strokeColor("#E5E2D9")
        .stroke();

      let yPosition = 140;

      // Fetch and render materials
      if (materialIds && materialIds.length > 0) {
        for (const materialId of materialIds) {
          const material = await getMaterialById(materialId);
          if (!material) continue;

          // Check if we need a new page
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          // Material name
          doc
            .fontSize(16)
            .fillColor("#C9A882")
            .text(material.name, 50, yPosition);
          yPosition += 25;

          // Category badge
          doc
            .fontSize(10)
            .fillColor("#8A8A8A")
            .text(`Categoria: ${material.category}`, 50, yPosition);
          yPosition += 20;

          // Description
          if (material.description) {
            doc
              .fontSize(11)
              .fillColor("#5F5C59")
              .text(material.description, 50, yPosition, {
                width: 495,
                align: "justify",
              });
            yPosition += doc.heightOfString(material.description, { width: 495 }) + 15;
          }

          // Supplier and Price
          if (material.supplier || material.price) {
            doc.fontSize(10).fillColor("#5F5C59");
            if (material.supplier) {
              doc.text(`Fornecedor: ${material.supplier}`, 50, yPosition);
              yPosition += 15;
            }
            if (material.price) {
              doc.text(
                `Preço: €${material.price}${material.unit ? ` / ${material.unit}` : ""}`,
                50,
                yPosition
              );
              yPosition += 15;
            }
          }

          // Technical specifications
          if (includeTechnicalSpecs && material.tags) {
            doc
              .fontSize(12)
              .fillColor("#C9A882")
              .text("Especificações Técnicas", 50, yPosition);
            yPosition += 20;

            doc
              .fontSize(10)
              .fillColor("#5F5C59")
              .text(material.tags, 50, yPosition, {
                width: 495,
              });
            yPosition += doc.heightOfString(material.tags, { width: 495 }) + 15;
          }

          // Image placeholder (if includeImages is true)
          if (includeImages && material.imageUrl) {
            // Note: Downloading and embedding images requires additional setup
            // For now, we'll just note the image URL
            doc
              .fontSize(9)
              .fillColor("#8A8A8A")
              .text(`Imagem: ${material.imageUrl}`, 50, yPosition, {
                link: material.imageUrl,
                underline: true,
              });
            yPosition += 15;
          }

          // Separator line
          doc
            .moveTo(50, yPosition)
            .lineTo(545, yPosition)
            .strokeColor("#E5E2D9")
            .stroke();
          yPosition += 25;
        }
      } else {
        doc
          .fontSize(12)
          .fillColor("#8A8A8A")
          .text("Nenhum material selecionado para o relatório.", 50, yPosition);
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(9)
          .fillColor("#8A8A8A")
          .text(
            `Página ${i + 1} de ${pageCount}`,
            50,
            doc.page.height - 50,
            {
              align: "center",
              width: doc.page.width - 100,
            }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
