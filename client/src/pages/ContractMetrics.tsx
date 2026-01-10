import { useState } from "react";
import { BarChart3, TrendingUp, Clock, AlertCircle, FileText, CheckCircle2, XCircle, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

type Period = "7d" | "30d" | "90d" | "all";

const COLORS = {
  success: "#10b981",
  error: "#ef4444",
  processing: "#f59e0b",
  primary: "#3b82f6",
};

export default function ContractMetrics() {
  const [period, setPeriod] = useState<Period>("30d");
  
  const { data: metrics, isLoading: metricsLoading } = trpc.projects.contract.getMetrics.useQuery({ period });
  const { data: timeSeries, isLoading: timeSeriesLoading } = trpc.projects.contract.getTimeSeries.useQuery({ 
    period: period === "all" ? "90d" : period 
  });
  
  const isLoading = metricsLoading || timeSeriesLoading;
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "7d": return "Últimos 7 dias";
      case "30d": return "Últimos 30 dias";
      case "90d": return "Últimos 90 dias";
      case "all": return "Todo o período";
    }
  };
  
  // Prepare pie chart data
  const statusDistribution = metrics ? [
    { name: "Sucesso", value: metrics.overallStats.success, color: COLORS.success },
    { name: "Erro", value: metrics.overallStats.error, color: COLORS.error },
    { name: "Processando", value: metrics.overallStats.processing, color: COLORS.processing },
  ].filter(item => item.value > 0) : [];
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">A carregar métricas...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!metrics || !timeSeries) {
    return (
      <div className="container py-8">
        <Card className="p-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem dados disponíveis</h3>
            <p className="text-muted-foreground">
              Não há métricas para exibir no período selecionado.
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Métricas de Contratos</h1>
            <p className="text-muted-foreground mt-1">
              Análise de performance e estatísticas de processamento
            </p>
          </div>
          
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Processado</span>
            </div>
            <div className="text-3xl font-bold">{metrics.overallStats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.overallStats.reprocessed} reprocessados
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {metrics.overallStats.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.overallStats.success} de {metrics.overallStats.total} contratos
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Tempo Médio</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {formatDuration(metrics.performanceMetrics.avgDuration)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Min: {formatDuration(metrics.performanceMetrics.minDuration)} | 
              Max: {formatDuration(metrics.performanceMetrics.maxDuration)}
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Tamanho Médio</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {formatFileSize(metrics.fileSizeStats.avgSize)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total: {formatFileSize(metrics.fileSizeStats.totalSize)}
            </div>
          </Card>
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Rate Over Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Taxa de Sucesso ao Longo do Tempo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(value) => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString("pt-BR")}
                  formatter={(value: any) => [`${value}%`, "Taxa de Sucesso"]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  name="Taxa de Sucesso (%)"
                  dot={{ fill: COLORS.success }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          
          {/* Status Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uploads Over Time */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Volume de Uploads
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeries.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(value) => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString("pt-BR")}
                />
                <Legend />
                <Bar dataKey="success" stackId="a" fill={COLORS.success} name="Sucesso" />
                <Bar dataKey="error" stackId="a" fill={COLORS.error} name="Erro" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          {/* Processing Duration Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Distribuição de Tempo de Processamento
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeries.durationDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="bucket" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS.primary} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        
        {/* Common Errors */}
        {metrics.commonErrors.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Erros Mais Comuns
            </h3>
            <div className="space-y-3">
              {metrics.commonErrors.map((error, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md"
                >
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 truncate">
                        {error.errorMessage}
                      </p>
                      <span className="text-sm font-bold text-red-700 dark:text-red-300 flex-shrink-0">
                        {error.count}x
                      </span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Última ocorrência: {new Date(error.lastOccurrence).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* Performance Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo de Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tempo Médio</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(metrics.performanceMetrics.avgDuration)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Tempo de processamento
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tamanho Mínimo</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatFileSize(metrics.fileSizeStats.minSize)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Menor arquivo processado
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tamanho Máximo</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatFileSize(metrics.fileSizeStats.maxSize)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Maior arquivo processado
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
