import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Package,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SiteDashboard() {
  const { constructionId } = useParams();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const today = new Date();

  // Queries with auto-refresh
  const { data: attendance, refetch: refetchAttendance } =
    trpc.siteManagement.attendance.listByConstruction.useQuery(
      {
        constructionId: Number(constructionId),
        startDate: startOfDay(today),
        endDate: endOfDay(today),
      },
      { enabled: !!constructionId, refetchInterval: autoRefresh ? 30000 : false }
    );

  const { data: workHours, refetch: refetchWorkHours } =
    trpc.siteManagement.workHours.listByConstruction.useQuery(
      {
        constructionId: Number(constructionId),
        startDate: startOfDay(today),
        endDate: endOfDay(today),
      },
      { enabled: !!constructionId, refetchInterval: autoRefresh ? 30000 : false }
    );

  const { data: materials, refetch: refetchMaterials } =
    trpc.siteManagement.materialUsage.listByConstruction.useQuery(
      {
        constructionId: Number(constructionId),
        startDate: startOfDay(today),
        endDate: endOfDay(today),
      },
      { enabled: !!constructionId, refetchInterval: autoRefresh ? 30000 : false }
    );

  const { data: nonCompliances, refetch: refetchNonCompliances } =
    trpc.siteManagement.nonCompliances.listByConstruction.useQuery(
      { constructionId: Number(constructionId) },
      { enabled: !!constructionId, refetchInterval: autoRefresh ? 30000 : false }
    );

  const handleManualRefresh = () => {
    refetchAttendance();
    refetchWorkHours();
    refetchMaterials();
    refetchNonCompliances();
  };

  // Calculate metrics
  const workersPresent = attendance?.filter((a) => a.checkIn && !a.checkOut).length || 0;
  const totalWorkersToday = new Set(attendance?.map((a) => a.workerId)).size || 0;
  const totalHoursToday = workHours?.reduce((sum, wh) => sum + wh.hours, 0) || 0;
  const materialsConsumedToday = materials?.length || 0;
  const criticalNonCompliances =
    nonCompliances?.filter(
      (nc) => nc.severity === "critical" && nc.status !== "closed"
    ).length || 0;
  const openNonCompliances =
    nonCompliances?.filter((nc) => nc.status === "open" || nc.status === "in_progress")
      .length || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Obra</h1>
          <p className="text-muted-foreground">
            Métricas em tempo real • {format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Atualização Automática" : "Atualização Manual"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            Atualizar Agora
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-1">Trabalhadores Presentes</p>
              <p className="text-3xl font-bold text-blue-700">{workersPresent}</p>
              <p className="text-xs text-blue-600 mt-1">
                de {totalWorkersToday} hoje
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">Horas Trabalhadas Hoje</p>
              <p className="text-3xl font-bold text-green-700">
                {totalHoursToday.toFixed(1)}h
              </p>
              <p className="text-xs text-green-600 mt-1">
                {workHours?.length || 0} registos
              </p>
            </div>
            <Clock className="h-12 w-12 text-green-400" />
          </div>
        </Card>

        <Card className="p-6 border-purple-200 bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 mb-1">Materiais Consumidos</p>
              <p className="text-3xl font-bold text-purple-700">
                {materialsConsumedToday}
              </p>
              <p className="text-xs text-purple-600 mt-1">registos hoje</p>
            </div>
            <Package className="h-12 w-12 text-purple-400" />
          </div>
        </Card>

        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 mb-1">Não Conformidades</p>
              <p className="text-3xl font-bold text-red-700">
                {openNonCompliances}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {criticalNonCompliances} críticas
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Alerts Section */}
      {criticalNonCompliances > 0 && (
        <Card className="p-6 border-red-300 bg-red-50">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                Alertas Críticos
              </h3>
              <p className="text-red-700">
                Existem {criticalNonCompliances} não conformidades críticas que
                requerem atenção imediata.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={() =>
                  (window.location.href = `/site-non-compliances/${constructionId}`)
                }
              >
                Ver Não Conformidades
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Picagens Recentes
          </h3>
          <div className="space-y-3">
            {attendance && attendance.length > 0 ? (
              attendance.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">Trabalhador #{a.workerId}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.checkIn
                        ? format(new Date(a.checkIn), "HH:mm", { locale: ptBR })
                        : "-"}
                      {a.checkOut && (
                        <> → {format(new Date(a.checkOut), "HH:mm", { locale: ptBR })}</>
                      )}
                    </p>
                  </div>
                  <Badge variant={a.checkOut ? "secondary" : "default"}>
                    {a.checkOut ? "Saiu" : "Presente"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma picagem hoje
              </p>
            )}
          </div>
        </Card>

        {/* Recent Materials */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materiais Consumidos Recentemente
          </h3>
          <div className="space-y-3">
            {materials && materials.length > 0 ? (
              materials.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{m.materialName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(m.date), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {m.quantity} {m.unit}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum consumo hoje
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Weekly Trends */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tendências Semanais
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {totalWorkersToday}
            </p>
            <p className="text-sm text-muted-foreground">
              Média de trabalhadores/dia
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {totalHoursToday.toFixed(1)}h
            </p>
            <p className="text-sm text-muted-foreground">Horas trabalhadas hoje</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {materialsConsumedToday}
            </p>
            <p className="text-sm text-muted-foreground">
              Materiais consumidos hoje
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
