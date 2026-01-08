import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertTriangle,
  Calendar,
  DollarSign,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SupplierComparisonDialogProps {
  materialId: number;
  materialName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierComparisonDialog({
  materialId,
  materialName,
  open,
  onOpenChange,
}: SupplierComparisonDialogProps) {
  const { data: comparison, isLoading } = trpc.library.getSupplierComparison.useQuery(
    { materialId },
    { enabled: open }
  );

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparação de Fornecedores</DialogTitle>
            <DialogDescription>
              A carregar dados de comparação...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A882]"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!comparison || comparison.suppliers.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Comparação de Fornecedores</DialogTitle>
            <DialogDescription>{materialName}</DialogDescription>
          </DialogHeader>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum histórico de preços disponível para este material.</p>
            <p className="text-sm mt-2">
              Adicione registos de preços para começar a comparar fornecedores.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Preparar dados para o gráfico
  const chartData = prepareChartData(comparison.suppliers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Comparação de Fornecedores
          </DialogTitle>
          <DialogDescription>{materialName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Fornecedores</p>
                  <p className="text-2xl font-bold">{comparison.totalSuppliers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Melhor Oferta Atual</p>
                  <p className="text-lg font-semibold truncate">
                    {comparison.bestCurrentOffer || "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Preço Médio</p>
                  <p className="text-2xl font-bold">
                    {(
                      comparison.suppliers.reduce((sum, s) => sum + s.avgPrice, 0) /
                      comparison.suppliers.length
                    ).toFixed(2)}{" "}
                    €
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Price Evolution Chart */}
          {chartData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Evolução de Preços</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)} €`}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString("pt-PT");
                    }}
                  />
                  <Legend />
                  {comparison.suppliers.map((supplier, index) => (
                    <Line
                      key={supplier.supplierName}
                      type="monotone"
                      dataKey={supplier.supplierName}
                      stroke={getColorForIndex(index)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Suppliers Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Comparação Detalhada</h3>
            <div className="space-y-4">
              {comparison.suppliers.map((supplier, index) => (
                <div
                  key={supplier.supplierName}
                  className={`p-4 border rounded-lg ${
                    supplier.supplierName === comparison.bestCurrentOffer
                      ? "border-green-500 bg-green-50"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getColorForIndex(index) }}
                      />
                      <div>
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          {supplier.supplierName}
                          {supplier.supplierName === comparison.bestCurrentOffer && (
                            <Badge className="bg-green-600">
                              <Award className="w-3 h-3 mr-1" />
                              Melhor Oferta
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Última atualização:{" "}
                          {new Date(supplier.lastUpdate).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {supplier.trend === "up" && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +{supplier.trendPercent.toFixed(1)}%
                        </Badge>
                      )}
                      {supplier.trend === "down" && (
                        <Badge className="bg-green-600 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          -{supplier.trendPercent.toFixed(1)}%
                        </Badge>
                      )}
                      {supplier.trend === "stable" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Minus className="w-3 h-3" />
                          Estável
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Preço Atual</p>
                      <p className="text-lg font-bold text-[#C9A882]">
                        {supplier.lastPrice.toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Preço Médio</p>
                      <p className="text-lg font-semibold">
                        {supplier.avgPrice.toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mínimo</p>
                      <p className="text-lg font-semibold text-green-600">
                        {supplier.minPrice.toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Máximo</p>
                      <p className="text-lg font-semibold text-red-600">
                        {supplier.maxPrice.toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Variação</p>
                      <p className="text-lg font-semibold">
                        {supplier.priceVariation.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{supplier.recordCount} registos de preços</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to prepare chart data
function prepareChartData(suppliers: any[]) {
  const allDates = new Set<string>();
  
  // Collect all unique dates
  suppliers.forEach((supplier) => {
    supplier.priceHistory.forEach((entry: any) => {
      allDates.add(entry.date.toISOString());
    });
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Build chart data
  return sortedDates.map((dateStr) => {
    const dataPoint: any = { date: dateStr };
    
    suppliers.forEach((supplier) => {
      const entry = supplier.priceHistory.find(
        (e: any) => e.date.toISOString() === dateStr
      );
      if (entry) {
        dataPoint[supplier.supplierName] = entry.price;
      }
    });

    return dataPoint;
  });
}

// Helper function to get color for supplier line
function getColorForIndex(index: number): string {
  const colors = [
    "#C9A882", // Primary
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#14B8A6", // Teal
  ];
  return colors[index % colors.length];
}
