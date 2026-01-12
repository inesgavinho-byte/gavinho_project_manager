import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrendDataPoint {
  date: string;
  rating: number;
  quality: number;
  timeliness: number;
  communication: number;
  count: number;
}

interface SupplierTrendChartProps {
  data: TrendDataPoint[];
  supplierName: string;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  currentAvg: number;
  previousAvg: number;
  chartType?: "line" | "composed";
}

export function SupplierTrendChart({
  data,
  supplierName,
  trend,
  trendPercentage,
  currentAvg,
  previousAvg,
  chartType = "line",
}: SupplierTrendChartProps) {
  const trendColor = useMemo(() => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-amber-600";
  }, [trend]);

  const trendIcon = useMemo(() => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  }, [trend]);

  const formattedData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString("pt-PT", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{supplierName} - Tendência de Ratings</CardTitle>
            <CardDescription>Evolução de avaliações ao longo do tempo</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
              className="text-sm"
            >
              <span className={trendColor}>{trendIcon}</span>
              <span className="ml-1">{Math.abs(trendPercentage)}%</span>
            </Badge>
            <div className="text-sm text-muted-foreground">
              Atual: <span className="font-semibold text-foreground">{currentAvg}/5</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Média Atual</p>
            <p className="text-lg font-semibold">{currentAvg.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Média Anterior</p>
            <p className="text-lg font-semibold">{previousAvg.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Tendência</p>
            <p className={`text-lg font-semibold ${trendColor}`}>
              {trend === "up" ? "Melhora" : trend === "down" ? "Queda" : "Estável"}
            </p>
          </div>
        </div>

        {/* Gráfico */}
        {formattedData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "composed" ? (
                <ComposedChart data={formattedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[0, 5]} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => value.toFixed(2)}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="var(--color-muted-foreground)" opacity={0.3} />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary)", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Rating Geral"
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="var(--color-accent)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Qualidade"
                    opacity={0.6}
                  />
                </ComposedChart>
              ) : (
                <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[0, 5]} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => value.toFixed(2)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary)", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Rating Geral"
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="var(--color-accent)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Qualidade"
                    opacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="timeliness"
                    stroke="var(--color-amber-500)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Pontualidade"
                    opacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="communication"
                    stroke="var(--color-blue-500)"
                    strokeWidth={1.5}
                    dot={false}
                    name="Comunicação"
                    opacity={0.6}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-lg bg-muted">
            <p className="text-muted-foreground">Sem dados de avaliação disponíveis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
