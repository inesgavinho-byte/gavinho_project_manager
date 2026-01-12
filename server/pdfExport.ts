import puppeteer from "puppeteer";

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

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    planning: "Planeamento",
    in_progress: "Em Andamento",
    on_hold: "Em Espera",
    completed: "Concluído",
    cancelled: "Cancelado",
    not_started: "Não Iniciado",
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    urgent: "URGENTE",
    high: "ALTA",
    medium: "MÉDIA",
    low: "BAIXA",
  };
  return labels[priority] || priority;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    urgent: "#9A6B5B",
    high: "#C9A86C",
    medium: "#ADAA96",
    low: "#8B8670",
  };
  return colors[priority] || "#8B8670";
};

const formatCurrency = (value: number | null) => {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

const formatDate = (date: Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-PT");
};

function generateProjectsHTML(projects: ProjectPDFData[]): string {
  const rows = projects
    .map(
      (project) => `
    <tr>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <strong>${project.name}</strong>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${project.clientName || "—"}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${project.location || "—"}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <span style="background: #8B8670; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
          ${getStatusLabel(project.status)}
        </span>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <span style="background: ${getPriorityColor(project.priority)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">
          ${getPriorityLabel(project.priority)}
        </span>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="flex: 1; height: 6px; background: #DCD9CF; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; background: #8B8670; width: ${project.progress || 0}%;"></div>
          </div>
          <span style="font-weight: 600; font-size: 12px;">${project.progress || 0}%</span>
        </div>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9; font-weight: 600;">${formatCurrency(project.budget)}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${formatDate(project.startDate)}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${formatDate(project.endDate)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Quattrocento+Sans:wght@400;700&display=swap');
    
    body {
      font-family: 'Quattrocento Sans', sans-serif;
      background: #F2F0E7;
      padding: 40px;
      margin: 0;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    h1 {
      color: #3D3D3D;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px 0;
    }
    
    .subtitle {
      color: #6B6B6B;
      font-size: 14px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 10px;
      overflow: hidden;
    }
    
    th {
      background: #ADAA96;
      color: white;
      padding: 14px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      border: 1px solid #ADAA96;
    }
    
    td {
      font-size: 12px;
      color: #3D3D3D;
    }
    
    tr:nth-child(even) {
      background: #F2F0E7;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GAVINHO - Comparação de Projetos</h1>
    <p class="subtitle">Relatório gerado em ${new Date().toLocaleDateString("pt-PT")} às ${new Date().toLocaleTimeString(
    "pt-PT"
  )}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Nome do Projeto</th>
        <th>Cliente</th>
        <th>Localização</th>
        <th>Estado</th>
        <th>Prioridade</th>
        <th>Progresso</th>
        <th>Orçamento</th>
        <th>Data Início</th>
        <th>Data Fim</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
  `;
}

function generateConstructionsHTML(constructions: ConstructionPDFData[]): string {
  const rows = constructions
    .map(
      (construction) => `
    <tr>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <strong>${construction.code}</strong>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${construction.name}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${construction.projectName || "—"}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${construction.location || "—"}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <span style="background: #8B8670; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
          ${getStatusLabel(construction.status)}
        </span>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <span style="background: ${getPriorityColor(construction.priority)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">
          ${getPriorityLabel(construction.priority)}
        </span>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="flex: 1; height: 6px; background: #DCD9CF; border-radius: 3px; overflow: hidden;">
            <div style="height: 100%; background: #8B8670; width: ${construction.progress || 0}%;"></div>
          </div>
          <span style="font-weight: 600; font-size: 12px;">${construction.progress || 0}%</span>
        </div>
      </td>
      <td style="padding: 12px; border: 1px solid #E5E2D9; font-weight: 600;">${formatCurrency(construction.budget)}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${formatDate(construction.startDate)}</td>
      <td style="padding: 12px; border: 1px solid #E5E2D9;">${formatDate(construction.endDate)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Quattrocento+Sans:wght@400;700&display=swap');
    
    body {
      font-family: 'Quattrocento Sans', sans-serif;
      background: #F2F0E7;
      padding: 40px;
      margin: 0;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    h1 {
      color: #3D3D3D;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px 0;
    }
    
    .subtitle {
      color: #6B6B6B;
      font-size: 14px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 10px;
      overflow: hidden;
    }
    
    th {
      background: #ADAA96;
      color: white;
      padding: 14px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      border: 1px solid #ADAA96;
    }
    
    td {
      font-size: 12px;
      color: #3D3D3D;
    }
    
    tr:nth-child(even) {
      background: #F2F0E7;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GAVINHO - Comparação de Obras</h1>
    <p class="subtitle">Relatório gerado em ${new Date().toLocaleDateString("pt-PT")} às ${new Date().toLocaleTimeString(
    "pt-PT"
  )}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Nome da Obra</th>
        <th>Projeto Associado</th>
        <th>Localização</th>
        <th>Estado</th>
        <th>Prioridade</th>
        <th>Progresso</th>
        <th>Orçamento</th>
        <th>Data Início</th>
        <th>Data Fim</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
  `;
}

export async function generateProjectsPDF(projects: ProjectPDFData[]): Promise<Buffer> {
  const html = generateProjectsHTML(projects);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });

  await browser.close();

  return Buffer.from(pdf);
}

export async function generateConstructionsPDF(constructions: ConstructionPDFData[]): Promise<Buffer> {
  const html = generateConstructionsHTML(constructions);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });

  await browser.close();

  return Buffer.from(pdf);
}
