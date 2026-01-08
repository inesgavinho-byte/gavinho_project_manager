import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number;
  materialName: string;
}

export function PriceHistoryDialog({
  open,
  onOpenChange,
  materialId,
  materialName,
}: PriceHistoryDialogProps) {
  const [days, setDays] = useState(90);

  const { data: history, isLoading: historyLoading } = trpc.library.getMaterialPriceHistory.useQuery(
    { materialId, limit: 50 },
    { enabled: open }
  );

  const { data: trend, isLoading: trendLoading } = trpc.library.getMaterialPriceTrend.useQuery(
    { materialId, days },
    { enabled: open }
  );

  const isLoading = historyLoading || trendLoading;

  // Preparar dados para o gráfico
  const chartData =
    history?.map((record) => ({
      date: format(new Date(record.recordedAt), "dd/MM/yy", { locale: ptBR }),
      price: parseFloat(record.price),
      fullDate: format(new Date(record.recordedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    })) || [];

  // Inverter para mostrar do mais antigo ao mais recente
  const sortedChartData = [...chartData].reverse();

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.trend) {
      case "rising":
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case "falling":
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "bg-gray-100 text-gray-800";
    switch (trend.trend) {
      case "rising":
        return "bg-red-100 text-red-800";
      case "falling":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendLabel = () => {
    if (!trend) return "Estável";
    switch (trend.trend) {
      case "rising":
        return "Em Alta";
      case "falling":
        return "Em Baixa";
      default:
        return "Estável";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Histórico de Preços - {materialName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo da Tendência */}
            {trend && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getTrendIcon()}
                    <span className="text-sm font-medium text-muted-foreground">Tendência</span>
                  </div>
                  <Badge className={getTrendColor()}>{getTrendLabel()}</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Variação</div>
                  <div className={`text-2xl font-bold ${trend.changePercent > 0 ? "text-red-600" : trend.changePercent < 0 ? "text-green-600" : "text-gray-600"}`}>
                    {trend.changePercent > 0 ? "+" : ""}
                    {trend.changePercent}%
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Pontos de Dados</div>
                  <div className="text-2xl font-bold">{trend.dataPoints}</div>
                </div>
              </div>
            )}

            {/* Alerta de Preço Alto */}
            {trend && trend.trend === "rising" && trend.changePercent >= 10 && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">Alerta de Preço</div>
                  <div className="text-sm text-red-700">
                    Este material teve um aumento significativo de preço nos últimos {days} dias.
                  </div>
                </div>
              </div>
            )}

            {/* Filtro de Período */}
            <div className="flex gap-2">
              <Button
                variant={days === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(30)}
              >
                30 dias
              </Button>
              <Button
                variant={days === 90 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(90)}
              >
                90 dias
              </Button>
              <Button
                variant={days === 180 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(180)}
              >
                180 dias
              </Button>
              <Button
                variant={days === 365 ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(365)}
              >
                1 ano
              </Button>
            </div>

            {/* Gráfico de Evolução */}
            {sortedChartData.length > 0 ? (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-4">Evolução de Preço</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sortedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="text-sm font-medium">{payload[0].payload.fullDate}</p>
                              <p className="text-lg font-bold text-primary">
                                {payload[0].value?.toFixed(2)} €
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#d4a574"
                      strokeWidth={2}
                      dot={{ fill: "#d4a574", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Sem dados de histórico de preços
              </div>
            )}

            {/* Tabela de Histórico */}
            {history && history.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Data</th>
                      <th className="text-left p-3 text-sm font-medium">Preço</th>
                      <th className="text-left p-3 text-sm font-medium">Unidade</th>
                      <th className="text-left p-3 text-sm font-medium">Fornecedor</th>
                      <th className="text-left p-3 text-sm font-medium">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 text-sm">
                          {format(new Date(record.recordedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="p-3 text-sm font-medium">{parseFloat(record.price).toFixed(2)} €</td>
                        <td className="p-3 text-sm">{record.unit}</td>
                        <td className="p-3 text-sm">{record.supplierName || "-"}</td>
                        <td className="p-3 text-sm text-muted-foreground">{record.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
