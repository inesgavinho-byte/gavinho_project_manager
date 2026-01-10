import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { trpc } from "../../lib/trpc";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title } from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { TrendingUp, Package, Euro, Layers } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
);

export function AnalyticsDashboard() {
  const { data: usageStats } = trpc.library.getMaterialsUsageStats.useQuery();
  const { data: categoryDistribution } = trpc.library.getMaterialsCategoryDistribution.useQuery();
  const { data: priceEvolution } = trpc.library.getMaterialsPriceEvolution.useQuery();
  const { data: overview } = trpc.library.getMaterialsOverview.useQuery();

  // Category Distribution Chart Data
  const categoryChartData = {
    labels: categoryDistribution?.map((item) => item.category) || [],
    datasets: [
      {
        label: "Materiais por Categoria",
        data: categoryDistribution?.map((item) => item.count) || [],
        backgroundColor: [
          "#C9A882",
          "#B8976F",
          "#A7865C",
          "#967549",
          "#856436",
          "#745323",
          "#634210",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Most Used Materials Chart Data
  const usageChartData = {
    labels: usageStats?.map((item) => item.materialName.substring(0, 20)) || [],
    datasets: [
      {
        label: "Utilizações",
        data: usageStats?.map((item) => item.usageCount) || [],
        backgroundColor: "#C9A882",
        borderColor: "#B8976F",
        borderWidth: 1,
      },
    ],
  };

  // Price Evolution Chart Data
  const priceChartData = {
    labels: priceEvolution?.map((item) => item.month) || [],
    datasets: [
      {
        label: "Preço Médio (€)",
        data: priceEvolution?.map((item) => parseFloat(item.avgPrice || "0")) || [],
        borderColor: "#C9A882",
        backgroundColor: "rgba(201, 168, 130, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E5E2D9]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">
              Total de Materiais
            </CardTitle>
            <Package className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">
              {overview?.totalMaterials || 0}
            </div>
            <p className="text-xs text-[#8B8670] mt-1">
              Na biblioteca
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E2D9]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">
              Categorias
            </CardTitle>
            <Layers className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">
              {overview?.totalCategories || 0}
            </div>
            <p className="text-xs text-[#8B8670] mt-1">
              Diferentes categorias
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E2D9]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">
              Preço Médio
            </CardTitle>
            <Euro className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">
              €{overview?.avgPrice || "0"}
            </div>
            <p className="text-xs text-[#8B8670] mt-1">
              Por material
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E5E2D9]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">
              Mais Utilizado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">
              {usageStats?.[0]?.usageCount || 0}x
            </div>
            <p className="text-xs text-[#8B8670] mt-1">
              {usageStats?.[0]?.materialName?.substring(0, 20) || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="border-[#E5E2D9]">
          <CardHeader>
            <CardTitle className="text-[#5F5C59]">Distribuição por Categoria</CardTitle>
            <CardDescription className="text-[#8B8670]">
              Materiais organizados por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryDistribution && categoryDistribution.length > 0 ? (
                <Doughnut data={categoryChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-[#8B8670]">
                  Sem dados disponíveis
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Used Materials */}
        <Card className="border-[#E5E2D9]">
          <CardHeader>
            <CardTitle className="text-[#5F5C59]">Materiais Mais Utilizados</CardTitle>
            <CardDescription className="text-[#8B8670]">
              Top 10 materiais por utilização em projetos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {usageStats && usageStats.length > 0 ? (
                <Bar data={usageChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-[#8B8670]">
                  Sem dados disponíveis
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price Evolution */}
        <Card className="border-[#E5E2D9] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#5F5C59]">Evolução de Preços</CardTitle>
            <CardDescription className="text-[#8B8670]">
              Preço médio dos materiais ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {priceEvolution && priceEvolution.length > 0 ? (
                <Line data={priceChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-[#8B8670]">
                  Sem dados disponíveis
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
