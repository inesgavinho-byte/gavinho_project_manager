import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Filter, FileDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { exportToExcel, exportToPDF, formatFinancialDataForExport } from "@/lib/exportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function FinancialDashboard() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly' | 'all'>('all');
  const [status, setStatus] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    period: period !== 'all' ? period : undefined,
    status: status || undefined,
    clientName: clientName || undefined,
  };

  const { data: kpis, isLoading: kpisLoading } = trpc.financial.getFinancialKPIs.useQuery(filters);
  const { data: budgetEvolution, isLoading: evolutionLoading } = trpc.financial.getBudgetEvolution.useQuery(filters);
  const { data: costComparison, isLoading: comparisonLoading } = trpc.financial.getCostComparison.useQuery(filters);
  const { data: profitability, isLoading: profitabilityLoading } = trpc.financial.getProjectProfitability.useQuery(filters);
  const { data: budgetAlerts, isLoading: alertsLoading } = trpc.financial.getBudgetAlerts.useQuery(filters);
  const { data: expenseTrends, isLoading: trendsLoading } = trpc.financial.getExpenseTrends.useQuery(filters);

  const handleClearFilters = () => {
    setPeriod('all');
    setStatus('');
    setClientName('');
  };

  if (kpisLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Análise de KPIs, orçamentos e rentabilidade dos projetos</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                const data = formatFinancialDataForExport(kpis, profitability || []);
                exportToExcel(data);
              }}>
                Exportar para Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const data = formatFinancialDataForExport(kpis, profitability || []);
                exportToPDF(data);
              }}>
                Exportar para PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros Avançados</CardTitle>
            <CardDescription>Filtre os dados por período, estado e cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado do Projeto</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="planning">Planeamento</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Input
                  id="client"
                  placeholder="Nome do cliente..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Alerts */}
      {budgetAlerts && budgetAlerts.length > 0 && (
        <Alert variant={budgetAlerts.some(a => a.severity === 'critical') ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alertas de Orçamento</AlertTitle>
          <AlertDescription>
            {budgetAlerts.length} projeto(s) com utilização de orçamento acima de 90%
            <ul className="mt-2 space-y-1">
              {budgetAlerts.slice(0, 3).map(alert => (
                <li key={alert.projectId} className="text-sm">
                  <strong>{alert.projectName}</strong>: {alert.utilization.toFixed(1)}% utilizado
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalBudget || 0)}</div>
            <p className="text-xs text-muted-foreground">Todos os projetos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalSpent || 0)}</div>
            <p className="text-xs text-muted-foreground">Custos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilização de Orçamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.budgetUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Média geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.averageProfitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Todos os projetos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Evolution */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Orçamento</CardTitle>
            <CardDescription>Orçamento planeado vs. custos reais por mês</CardDescription>
          </CardHeader>
          <CardContent>
            {evolutionLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : budgetEvolution && budgetEvolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={budgetEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="plannedBudget" stroke="#8884d8" name="Orçamento Planeado" />
                  <Line type="monotone" dataKey="actualCost" stroke="#82ca9d" name="Custo Real" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências de Despesas</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : expenseTrends && expenseTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={expenseTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area type="monotone" dataKey="totalExpenses" stroke="#8884d8" fill="#8884d8" name="Total de Despesas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Custos</CardTitle>
            <CardDescription>Top 10 projetos por variação de orçamento</CardDescription>
          </CardHeader>
          <CardContent>
            {comparisonLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : costComparison && costComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costComparison.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="projectName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="plannedBudget" fill="#8884d8" name="Orçamento" />
                  <Bar dataKey="actualCost" fill="#82ca9d" name="Custo Real" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Profitability */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidade por Projeto</CardTitle>
            <CardDescription>Top 10 projetos por margem de lucro</CardDescription>
          </CardHeader>
          <CardContent>
            {profitabilityLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : profitability && profitability.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitability.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="projectName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="profitMargin" fill="#8884d8" name="Margem de Lucro (%)" />
                  <Bar dataKey="roi" fill="#82ca9d" name="ROI (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
