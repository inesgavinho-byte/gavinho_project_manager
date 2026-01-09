import { Bar, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface ProjectData {
  name: string;
  progress: number | null;
  budget: number | null;
  priority: string;
}

interface ConstructionData {
  code: string;
  name: string;
  progress: number | null;
  budget: number | null;
  priority: string;
}

interface ProjectChartsProps {
  projects: ProjectData[];
}

interface ConstructionChartsProps {
  constructions: ConstructionData[];
}

const priorityToScore = (priority: string): number => {
  const scores: Record<string, number> = {
    urgent: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  return scores[priority] || 0;
};

export function ProjectComparisonCharts({ projects }: ProjectChartsProps) {
  // Dados para gráfico de barras (Progresso)
  const progressData = {
    labels: projects.map((p) => p.name),
    datasets: [
      {
        label: "Progresso (%)",
        data: projects.map((p) => p.progress || 0),
        backgroundColor: "rgba(173, 170, 150, 0.8)", // Warm Beige
        borderColor: "#ADAA96",
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de barras (Orçamento)
  const budgetData = {
    labels: projects.map((p) => p.name),
    datasets: [
      {
        label: "Orçamento (€)",
        data: projects.map((p) => p.budget || 0),
        backgroundColor: "rgba(139, 134, 112, 0.8)", // Olive Gray
        borderColor: "#8B8670",
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico radar (Comparação Multidimensional)
  const radarData = {
    labels: ["Progresso", "Orçamento (x1000)", "Prioridade"],
    datasets: projects.map((project, index) => {
      const colors = [
        "rgba(173, 170, 150, 0.6)", // Warm Beige
        "rgba(139, 134, 112, 0.6)", // Olive Gray
        "rgba(201, 168, 108, 0.6)", // High priority color
      ];
      return {
        label: project.name,
        data: [
          project.progress || 0,
          (project.budget || 0) / 1000, // Normalizar orçamento
          priorityToScore(project.priority),
        ],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace("0.6", "1"),
        borderWidth: 2,
      };
    }),
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#3D3D3D",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "#ADAA96",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#E5E2D9",
        },
        ticks: {
          color: "#6B6B6B",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B6B6B",
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#3D3D3D",
          font: {
            family: "Quattrocento Sans",
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "#3D3D3D",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "#ADAA96",
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: "#E5E2D9",
        },
        ticks: {
          color: "#6B6B6B",
          backdropColor: "transparent",
        },
        pointLabels: {
          color: "#3D3D3D",
          font: {
            family: "Quattrocento Sans",
            size: 11,
            weight: "bold" as const,
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Progresso */}
        <div
          className="p-6 rounded-lg"
          style={{ background: "white", border: "1px solid var(--border-light)" }}
        >
          <h4 className="font-semibold mb-4" style={{ color: "var(--text-dark)" }}>
            Comparação de Progresso
          </h4>
          <div style={{ height: "300px" }}>
            <Bar data={progressData} options={barOptions} />
          </div>
        </div>

        {/* Gráfico de Orçamento */}
        <div
          className="p-6 rounded-lg"
          style={{ background: "white", border: "1px solid var(--border-light)" }}
        >
          <h4 className="font-semibold mb-4" style={{ color: "var(--text-dark)" }}>
            Comparação de Orçamento
          </h4>
          <div style={{ height: "300px" }}>
            <Bar data={budgetData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Gráfico Radar */}
      <div
        className="p-6 rounded-lg"
        style={{ background: "white", border: "1px solid var(--border-light)" }}
      >
        <h4 className="font-semibold mb-4" style={{ color: "var(--text-dark)" }}>
          Análise Multidimensional
        </h4>
        <div style={{ height: "400px" }}>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
}

export function ConstructionComparisonCharts({ constructions }: ConstructionChartsProps) {
  // Dados para gráfico de barras (Progresso)
  const progressData = {
    labels: constructions.map((c) => c.code),
    datasets: [
      {
        label: "Progresso (%)",
        data: constructions.map((c) => c.progress || 0),
        backgroundColor: "rgba(173, 170, 150, 0.8)",
        borderColor: "#ADAA96",
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de barras (Orçamento)
  const budgetData = {
    labels: constructions.map((c) => c.code),
    datasets: [
      {
        label: "Orçamento (€)",
        data: constructions.map((c) => c.budget || 0),
        backgroundColor: "rgba(139, 134, 112, 0.8)",
        borderColor: "#8B8670",
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico radar
  const radarData = {
    labels: ["Progresso", "Orçamento (x1000)", "Prioridade"],
    datasets: constructions.map((construction, index) => {
      const colors = [
        "rgba(173, 170, 150, 0.6)",
        "rgba(139, 134, 112, 0.6)",
        "rgba(201, 168, 108, 0.6)",
      ];
      return {
        label: construction.code,
        data: [
          construction.progress || 0,
          (construction.budget || 0) / 1000,
          priorityToScore(construction.priority),
        ],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace("0.6", "1"),
        borderWidth: 2,
      };
    }),
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#3D3D3D",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "#ADAA96",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#E5E2D9",
        },
        ticks: {
          color: "#6B6B6B",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B6B6B",
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#3D3D3D",
          font: {
            family: "Quattrocento Sans",
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "#3D3D3D",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "#ADAA96",
        borderWidth: 1,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: "#E5E2D9",
        },
        ticks: {
          color: "#6B6B6B",
          backdropColor: "transparent",
        },
        pointLabels: {
          color: "#3D3D3D",
          font: {
            family: "Quattrocento Sans",
            size: 11,
            weight: "bold" as const,
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-lg"
          style={{ background: "white", border: "1px solid var(--border-light)" }}
        >
          <h4 className="font-semibold mb-4" style={{ color: "var(--text-dark)" }}>
            Comparação de Progresso
          </h4>
          <div style={{ height: "300px" }}>
            <Bar data={progressData} options={barOptions} />
          </div>
        </div>

        <div
          className="p-6 rounded-lg"
          style={{ background: "white", border: "1px solid var(--border-light)" }}
        >
          <h4 className="font-semibold mb-4" style={{ color: "var(--text-dark)" }}>
            Comparação de Orçamento
          </h4>
          <div style={{ height: "300px" }}>
            <Bar data={budgetData} options={barOptions} />
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-lg"
        style={{ background: "white", border: "1px solid var(--border-light)" }}
      >
        <h4 className="font-semibold mb-4" style={{ color: "var(--text-dark)" }}>
          Análise Multidimensional
        </h4>
        <div style={{ height: "400px" }}>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
}
