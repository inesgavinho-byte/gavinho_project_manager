import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, TrendingUp, MapPin, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

export default function ContractsDashboard() {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch data
  const { data: stats, isLoading: statsLoading } = trpc.contractAnalytics.getStats.useQuery();
  const { data: byType, isLoading: typeLoading } = trpc.contractAnalytics.getByType.useQuery();
  const { data: timeline, isLoading: timelineLoading } = trpc.contractAnalytics.getTimeline.useQuery();
  const { data: byLocation, isLoading: locationLoading } = trpc.contractAnalytics.getByLocation.useQuery();

  const isLoading = statsLoading || typeLoading || timelineLoading || locationLoading;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for charts
  const typeChartData = byType?.map((item) => ({
    name: item.type,
    value: item.totalValue,
    count: item.count,
  })) || [];

  const timelineChartData = timeline?.map((item) => ({
    name: `${item.month.substring(0, 3)}/${item.year}`,
    value: item.totalValue,
    count: item.count,
  })) || [];

  const locationChartData = byLocation?.slice(0, 10).map((item) => ({
    name: item.location,
    value: item.totalValue,
    count: item.count,
  })) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">A carregar análise de contratos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard de Análise de Contratos</h1>
        <p className="text-muted-foreground">
          Visualização estratégica de portfólio de contratos e análise de distribuição
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine a análise por ano, status ou tipo de serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                  <SelectItem value="expiring_soon">A expirar (30 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Serviço</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {byType?.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContracts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.activeContracts || 0} ativos, {stats?.expiredContracts || 0} expirados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {formatCurrency(stats?.averageValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Expirar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats?.expiringSoon || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Contratos a expirar nos próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contracts by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Serviço</CardTitle>
            <CardDescription>Valor total de contratos por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6" name="Valor Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal de Assinaturas</CardTitle>
            <CardDescription>Valor de contratos assinados por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ec4899"
                  strokeWidth={2}
                  name="Valor Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Geográfica</CardTitle>
            <CardDescription>Top 10 localizações por número de contratos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "value") return formatCurrency(value);
                    return value;
                  }}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Nº Contratos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Proporção de Contratos por Tipo</CardTitle>
            <CardDescription>Distribuição percentual do portfólio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {typeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip labelStyle={{ color: "#000" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Localização</CardTitle>
          <CardDescription>Análise detalhada de contratos por região</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Localização</th>
                  <th className="text-right p-2 font-medium">Nº Contratos</th>
                  <th className="text-right p-2 font-medium">Valor Total</th>
                  <th className="text-right p-2 font-medium">Valor Médio</th>
                </tr>
              </thead>
              <tbody>
                {byLocation?.map((loc, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {loc.location}
                    </td>
                    <td className="text-right p-2">{loc.count}</td>
                    <td className="text-right p-2 font-medium">
                      {formatCurrency(loc.totalValue)}
                    </td>
                    <td className="text-right p-2 text-muted-foreground">
                      {formatCurrency(loc.totalValue / loc.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
