import React, { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ScatterChart,
  Scatter,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Download,
  RefreshCw,
} from "lucide-react";
import { MQTDataTable } from "@/components/MQTDataTable";
import { MQTImportUpload } from "@/components/MQTImportUpload";

export function MQTAnalysis() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "data" | "import">("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const projectIdNum = parseInt(projectId || "0");

  // Queries
  const { data: mqtData, isLoading: dataLoading } = trpc.mqt.getMQTData.useQuery(
    { projectId: projectIdNum },
    { enabled: !!projectIdNum }
  );

  const { data: alerts, isLoading: alertsLoading } = trpc.mqt.getMQTAlerts.useQuery(
    { projectId: projectIdNum },
    { enabled: !!projectIdNum }
  );

  const { data: summary } = trpc.mqt.getSummary.useQuery(
    { projectId: projectIdNum },
    { enabled: !!projectIdNum }
  );

  // Mutations
  const resolveAlertMutation = trpc.mqt.resolveAlert.useMutation({
    onSuccess: () => {
      setRefreshKey((k) => k + 1);
    },
  });

  const generateTasksMutation = trpc.mqtAutomation.processAllUnresolvedAlerts.useMutation({
    onSuccess: () => {
      setRefreshKey((k) => k + 1);
    },
  });

  const handleGenerateTasks = async () => {
    try {
      await generateTasksMutation.mutateAsync({
        projectId: projectIdNum,
        taskPriority: "high",
        taskDueOffsetDays: 3,
      });
    } catch (error) {
      console.error("Erro ao gerar tarefas:", error);
    }
  };

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!mqtData || mqtData.length === 0) return [];

    return mqtData.map((item) => ({
      code: item.itemCode,
      planned: parseFloat(String(item.plannedQuantity)),
      executed: parseFloat(String(item.executedQuantity)),
      variance: parseFloat(String(item.variancePercentage)),
      status: item.status,
    }));
  }, [mqtData]);

  const statusSummary = React.useMemo(() => {
    if (!mqtData) return { onTrack: 0, warning: 0, critical: 0 };

    return {
      onTrack: mqtData.filter((item) => item.status === "on_track").length,
      warning: mqtData.filter((item) => item.status === "warning").length,
      critical: mqtData.filter((item) => item.status === "critical").length,
    };
  }, [mqtData]);

  const statusChartData = [
    { name: "No Caminho", value: statusSummary.onTrack, fill: "#10b981" },
    { name: "Aviso", value: statusSummary.warning, fill: "#f59e0b" },
    { name: "Crítico", value: statusSummary.critical, fill: "#ef4444" },
  ];

  const unresolvedAlerts = alerts?.filter((a) => !a.isResolved) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise de Mapas de Quantidades</h1>
          <p className="text-muted-foreground mt-1">
            Monitore e analise as quantidades planejadas vs executadas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Alerts */}
      {unresolvedAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {unresolvedAlerts.length} alerta(s) não resolvido(s) requer(em) atenção
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Itens no mapa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Variância Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{summary?.totalVariance?.toFixed(2) || "0"}</div>
              {(summary?.totalVariance || 0) > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.variancePercentage?.toFixed(1) || "0"}% de desvio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.criticalAlerts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requer ação imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Alertas de Aviso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary?.highAlerts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Monitorar de perto</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="data">Dados Detalhados</TabsTrigger>
          <TabsTrigger value="import">Importar Dados</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Planned vs Executed */}
            <Card>
              <CardHeader>
                <CardTitle>Planejado vs Executado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" fill="#8b8670" name="Planejado" />
                    <Bar dataKey="executed" fill="#adaa96" name="Executado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Variance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Variância (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="variance"
                    stroke="#ef4444"
                    name="Variância %"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alerts Summary */}
          {unresolvedAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Alertas Não Resolvidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unresolvedAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {alert.severity === "critical" ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                      disabled={resolveAlertMutation.isPending}
                    >
                      Resolver
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <MQTDataTable projectId={projectIdNum} />
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import">
          <MQTImportUpload
            projectId={projectIdNum}
            onImportSuccess={() => setRefreshKey((k) => k + 1)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
