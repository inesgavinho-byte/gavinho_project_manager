import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, AlertTriangle, Activity, BarChart3 } from "lucide-react";

export default function MqtAnalyticsDashboard() {
  const params = useParams();
  const constructionId = parseInt(params.id || "0");

  // Fetch construction details
  const { data: construction, isLoading: loadingConstruction } = trpc.constructions.getById.useQuery({
    id: constructionId,
  });

  // Fetch analytics data
  const { data: overview } = trpc.constructions.analytics.overview.useQuery({
    constructionId,
  });

  const { data: mostEditedItems } = trpc.constructions.analytics.mostEditedItems.useQuery({
    constructionId,
    limit: 10,
  });

  const { data: mostActiveUsers } = trpc.constructions.analytics.mostActiveUsers.useQuery({
    constructionId,
  });

  const { data: criticalDeviations } = trpc.constructions.analytics.criticalDeviations.useQuery({
    constructionId,
  });

  const { data: activityTimeline } = trpc.constructions.analytics.activityTimeline.useQuery({
    constructionId,
    days: 30,
  });

  if (loadingConstruction) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#EEEAE5" }}>
        <p style={{ color: "#5F5C59" }}>A carregar...</p>
      </div>
    );
  }

  if (!construction) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#EEEAE5" }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "#5F5C59" }}>
            Obra não encontrada
          </p>
          <Link href="/constructions">
            <Button style={{ backgroundColor: "#C9A882", color: "#5F5C59" }}>
              Voltar às Obras
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EEEAE5" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#C3BAAF" }}>
        <div className="container py-6">
          <Link href={`/constructions/${constructionId}`}>
            <Button variant="ghost" className="mb-4" style={{ color: "#5F5C59" }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à Obra
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <BarChart3 className="h-8 w-8" style={{ color: "#C9A882" }} />
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#5F5C59" }}>
                Análise de Alterações MQT
              </h1>
              <p className="text-sm mt-1" style={{ color: "#8B8580" }}>
                {construction.code} - {construction.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid gap-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#8B8580" }}>
                    Total de Alterações
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: "#5F5C59" }}>
                    {overview?.totalChanges || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8" style={{ color: "#C9A882" }} />
              </div>
            </Card>

            <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#8B8580" }}>
                    Últimas 24 Horas
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: "#5F5C59" }}>
                    {overview?.changes24h || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8" style={{ color: "#4CAF50" }} />
              </div>
            </Card>

            <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#8B8580" }}>
                    Últimos 7 Dias
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: "#5F5C59" }}>
                    {overview?.changes7d || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8" style={{ color: "#FF9800" }} />
              </div>
            </Card>

            <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#8B8580" }}>
                    Taxa de Alteração
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: "#5F5C59" }}>
                    {overview?.changeRate || 0}
                    <span className="text-sm font-normal ml-1" style={{ color: "#8B8580" }}>
                      /dia
                    </span>
                  </p>
                </div>
                <Activity className="h-8 w-8" style={{ color: "#2196F3" }} />
              </div>
            </Card>
          </div>

          {/* Most Edited Items & Active Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Edited Items */}
            <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#5F5C59" }}>
                Itens Mais Editados
              </h2>
              {mostEditedItems && mostEditedItems.length > 0 ? (
                <div className="space-y-3">
                  {mostEditedItems.map((item, index) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-3 rounded"
                      style={{ backgroundColor: "#EEEAE5" }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                          style={{
                            backgroundColor: index < 3 ? "#C9A882" : "#C3BAAF",
                            color: "#FFFFFF",
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: "#5F5C59" }}>
                            {item.code}
                          </p>
                          <p className="text-sm truncate" style={{ color: "#8B8580" }}>
                            {item.descriptionPt}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold" style={{ color: "#C9A882" }}>
                          {item.changeCount}
                        </p>
                        <p className="text-xs" style={{ color: "#8B8580" }}>
                          alterações
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8" style={{ color: "#8B8580" }}>
                  Nenhuma alteração registada
                </p>
              )}
            </Card>

            {/* Most Active Users */}
            <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#5F5C59" }}>
                Utilizadores Mais Ativos
              </h2>
              {mostActiveUsers && mostActiveUsers.length > 0 ? (
                <div className="space-y-3">
                  {mostActiveUsers.map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-3 rounded"
                      style={{ backgroundColor: "#EEEAE5" }}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5" style={{ color: "#C9A882" }} />
                        <div>
                          <p className="font-medium" style={{ color: "#5F5C59" }}>
                            Utilizador {user.userId}
                          </p>
                          <p className="text-sm" style={{ color: "#8B8580" }}>
                            {user.changeCount} alterações
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: "#C9A882" }}>
                          {user.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8" style={{ color: "#8B8580" }}>
                  Nenhuma alteração registada
                </p>
              )}
            </Card>
          </div>

          {/* Critical Deviations */}
          <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6" style={{ color: "#F44336" }} />
              <h2 className="text-xl font-bold" style={{ color: "#5F5C59" }}>
                Desvios Críticos
              </h2>
              <span
                className="ml-auto px-3 py-1 rounded-full text-sm font-bold"
                style={{ backgroundColor: "#F44336", color: "#FFFFFF" }}
              >
                {criticalDeviations?.length || 0}
              </span>
            </div>
            {criticalDeviations && criticalDeviations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "2px solid #C3BAAF" }}>
                      <th className="text-left p-3" style={{ color: "#5F5C59" }}>
                        Item
                      </th>
                      <th className="text-left p-3" style={{ color: "#5F5C59" }}>
                        Descrição
                      </th>
                      <th className="text-right p-3" style={{ color: "#5F5C59" }}>
                        Planejado
                      </th>
                      <th className="text-right p-3" style={{ color: "#5F5C59" }}>
                        Executado
                      </th>
                      <th className="text-right p-3" style={{ color: "#5F5C59" }}>
                        %
                      </th>
                      <th className="text-right p-3" style={{ color: "#5F5C59" }}>
                        Desvio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalDeviations.map((item) => {
                      const isOver = item.deviation > 0;
                      const deviationColor = isOver ? "#F44336" : "#FF9800";
                      
                      return (
                        <tr
                          key={item.itemId}
                          style={{ borderBottom: "1px solid #EEEAE5" }}
                        >
                          <td className="p-3 font-medium" style={{ color: "#5F5C59" }}>
                            {item.code}
                          </td>
                          <td className="p-3" style={{ color: "#8B8580" }}>
                            {item.descriptionPt}
                          </td>
                          <td className="p-3 text-right" style={{ color: "#5F5C59" }}>
                            {item.planned.toFixed(2)}
                          </td>
                          <td className="p-3 text-right" style={{ color: "#5F5C59" }}>
                            {item.executed.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold" style={{ color: deviationColor }}>
                            {item.percentage.toFixed(0)}%
                          </td>
                          <td className="p-3 text-right font-bold" style={{ color: deviationColor }}>
                            {isOver ? "+" : ""}
                            {item.deviation.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: "#8B8580" }}>
                Nenhum desvio crítico identificado
              </p>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#C3BAAF" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#5F5C59" }}>
              Timeline de Atividade (Últimos 30 Dias)
            </h2>
            {activityTimeline && activityTimeline.length > 0 ? (
              <div className="space-y-2">
                {activityTimeline.map((day) => {
                  const maxCount = Math.max(...activityTimeline.map(d => d.count));
                  const widthPercent = (day.count / maxCount) * 100;
                  
                  return (
                    <div key={day.date} className="flex items-center gap-4">
                      <span className="text-sm w-24" style={{ color: "#8B8580" }}>
                        {new Date(day.date).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <div className="flex-1 h-8 rounded overflow-hidden" style={{ backgroundColor: "#EEEAE5" }}>
                        <div
                          className="h-full flex items-center px-3 transition-all"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: "#C9A882",
                            minWidth: day.count > 0 ? "40px" : "0",
                          }}
                        >
                          <span className="text-sm font-bold text-white">
                            {day.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: "#8B8580" }}>
                Nenhuma atividade registada nos últimos 30 dias
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
