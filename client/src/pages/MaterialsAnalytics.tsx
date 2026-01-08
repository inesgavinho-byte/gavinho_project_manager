import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Package, DollarSign, Users, Download } from "lucide-react";

const COLORS = ["#C9A882", "#B8976F", "#A7865E", "#96754D", "#85643C", "#74532B"];

export default function MaterialsAnalytics() {
  // Queries
  const { data: usageStats = [] } = trpc.library.getMaterialsUsageStats.useQuery();
  const { data: categoryDistribution = [] } = trpc.library.getMaterialsCategoryDistribution.useQuery();
  const { data: priceEvolution = [] } = trpc.library.getMaterialsPriceEvolution.useQuery();
  const { data: projectComparison = [] } = trpc.library.getProjectMaterialsComparison.useQuery();
  const { data: overview } = trpc.library.getMaterialsOverview.useQuery();

  const exportToPDF = () => {
    // TODO: Implement PDF export
    alert("Exportação para PDF em desenvolvimento");
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    alert("Exportação para Excel em desenvolvimento");
  };

  return (
    <div className="min-h-screen bg-[#EEEAE5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-[#5F5C59] mb-2">
              Análise de Materiais
            </h1>
            <p className="text-[#C3BAAF]">
              Estatísticas e insights sobre uso de materiais
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToPDF}
              className="border-[#C9A882] text-[#C9A882] hover:bg-[#C9A882]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="border-[#C9A882] text-[#C9A882] hover:bg-[#C9A882]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
              <Package className="h-4 w-4 text-[#C9A882]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalMaterials || 0}</div>
              <p className="text-xs text-[#C3BAAF]">
                {overview?.totalCategories || 0} categorias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-[#C9A882]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{overview?.avgPrice ? overview.avgPrice.toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-[#C3BAAF]">por material</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
              <Users className="h-4 w-4 text-[#C9A882]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalSuppliers || 0}</div>
              <p className="text-xs text-[#C3BAAF]">fornecedores ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materiais em Uso</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#C9A882]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageStats.reduce((sum, item) => sum + (item.usageCount || 0), 0)}
              </div>
              <p className="text-xs text-[#C3BAAF]">em projetos ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Materials Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Materiais Mais Usados</CardTitle>
              <CardDescription>Top 10 materiais por número de usos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="materialName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usageCount" fill="#C9A882" name="Usos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>Materiais por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.category} (${entry.count})`}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Preços</CardTitle>
              <CardDescription>Preço médio dos materiais ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgPrice" 
                    stroke="#C9A882" 
                    strokeWidth={2}
                    name="Preço Médio (€)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Materials Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparação entre Projetos</CardTitle>
              <CardDescription>Custo total de materiais por projeto</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="projectCode" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalCost" fill="#C9A882" name="Custo Total (€)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
