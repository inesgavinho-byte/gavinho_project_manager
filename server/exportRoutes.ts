import { Router, Request, Response } from "express";
import { generateProjectsPDF, generateConstructionsPDF } from "./pdfExport";

const router = Router();

interface ProjectPDFData {
  id: number;
  name: string;
  clientName: string | null;
  location: string | null;
  status: string;
  priority: string;
  progress: number | null;
  budget: number | null;
  startDate: string | null; // ISO string from client
  endDate: string | null;
  description: string | null;
}

interface ConstructionPDFData {
  id: number;
  code: string;
  name: string;
  projectName: string | null;
  location: string | null;
  status: string;
  priority: string;
  progress: number | null;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  client: string | null;
}

// Endpoint para exportar comparação de projetos em PDF
router.post("/projects-compare-pdf", async (req: Request, res: Response) => {
  try {
    const projects: ProjectPDFData[] = req.body.projects;

    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ error: "Projects array is required" });
    }

    // Converter strings ISO para Date
    const projectsWithDates = projects.map((p) => ({
      ...p,
      startDate: p.startDate ? new Date(p.startDate) : null,
      endDate: p.endDate ? new Date(p.endDate) : null,
    }));

    const pdfBuffer = await generateProjectsPDF(projectsWithDates);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="comparacao_projetos_${new Date().toISOString().split("T")[0]}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating projects PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// Endpoint para exportar comparação de obras em PDF
router.post("/constructions-compare-pdf", async (req: Request, res: Response) => {
  try {
    const constructions: ConstructionPDFData[] = req.body.constructions;

    if (!constructions || !Array.isArray(constructions) || constructions.length === 0) {
      return res.status(400).json({ error: "Constructions array is required" });
    }

    // Converter strings ISO para Date
    const constructionsWithDates = constructions.map((c) => ({
      ...c,
      startDate: c.startDate ? new Date(c.startDate) : null,
      endDate: c.endDate ? new Date(c.endDate) : null,
    }));

    const pdfBuffer = await generateConstructionsPDF(constructionsWithDates);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="comparacao_obras_${new Date().toISOString().split("T")[0]}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating constructions PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
