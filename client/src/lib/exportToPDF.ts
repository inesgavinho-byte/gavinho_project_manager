interface ProjectPDFData {
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
  startDate: Date | null;
  endDate: Date | null;
  client: string | null;
}

export async function exportProjectsToPDF(projects: ProjectPDFData[]) {
  try {
    // Converter Date para ISO string para envio
    const projectsData = projects.map((p) => ({
      ...p,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      endDate: p.endDate ? p.endDate.toISOString() : null,
    }));

    const response = await fetch("/api/exports/projects-compare-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projects: projectsData }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    // Obter blob do PDF
    const blob = await response.blob();

    // Criar URL temporário e fazer download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparacao_projetos_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting projects to PDF:", error);
    throw error;
  }
}

export async function exportConstructionsToPDF(constructions: ConstructionPDFData[]) {
  try {
    // Converter Date para ISO string para envio
    const constructionsData = constructions.map((c) => ({
      ...c,
      startDate: c.startDate ? c.startDate.toISOString() : null,
      endDate: c.endDate ? c.endDate.toISOString() : null,
    }));

    const response = await fetch("/api/exports/constructions-compare-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ constructions: constructionsData }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    // Obter blob do PDF
    const blob = await response.blob();

    // Criar URL temporário e fazer download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparacao_obras_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting constructions to PDF:", error);
    throw error;
  }
}
