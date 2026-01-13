import { useMemo } from 'react';
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
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

interface MQTChartsProps {
  projectId: number;
}

export function MQTCharts({ projectId }: MQTChartsProps) {
  const { data: mqtData } = trpc.mq.getMQTData.useQuery({ projectId });
  const { data: statistics } = trpc.mq.getStatistics.useQuery({ projectId });

  // Preparar dados para gráfico de comparação
  const comparisonData = useMemo(() => {
    if (!mqtData) return [];
    return mqtData.slice(0, 10).map((item) => ({
      name: item.itemCode,
      Planejado: item.plannedQuantity,
      Executado: item.executedQuantity,
    }));
  }, [mqtData]);

  // Preparar dados para gráfico de variância
  const varianceData = useMemo(() => {
    if (!mqtData) return [];
    return mqtData.slice(0, 10).map((item) => ({
      name: item.itemCode,
      variância: item.variancePercentage || 0,
    }));
  }, [mqtData]);

  // Preparar dados para gráfico de status
  const statusData = useMemo(() => {
    if (!statistics)
      return [
        { name: 'No Caminho', value: 0 },
        { name: 'Aviso', value: 0 },
        { name: 'Crítico', value: 0 },
      ];

    return [
      { name: 'No Caminho', value: statistics.itemsOnTrack },
      { name: 'Aviso', value: statistics.itemsWarning },
      { name: 'Crítico', value: statistics.itemsCritical },
    ];
  }, [statistics]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Comparação Planejado vs Executado */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Planejado vs Executado</CardTitle>
          <CardDescription>Top 10 itens por quantidade</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Planejado" fill="#8b8670" />
              <Bar dataKey="Executado" fill="#adaa96" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Variância */}
      <Card>
        <CardHeader>
          <CardTitle>Variância por Item (%)</CardTitle>
          <CardDescription>Desvio percentual planejado vs executado</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={varianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="variância"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Status</CardTitle>
          <CardDescription>Itens por categoria de status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumo de Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
          <CardDescription>Métricas principais do projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{statistics?.totalItems || 0}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Quantidade Planejada</p>
                <p className="text-2xl font-bold">{statistics?.totalPlanned || 0}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Quantidade Executada</p>
                <p className="text-2xl font-bold">{statistics?.totalExecuted || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">No Caminho</p>
                <p className="text-2xl font-bold text-green-700">{statistics?.itemsOnTrack || 0}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">Aviso</p>
                <p className="text-2xl font-bold text-yellow-700">{statistics?.itemsWarning || 0}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">Crítico</p>
                <p className="text-2xl font-bold text-red-700">{statistics?.itemsCritical || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
