'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';

export function TrendAnalysisDashboard() {
  const [timeWindow, setTimeWindow] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  // Calcular datas
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeWindow);

  // Queries
  const { data: analysisData, isLoading } = trpc.trendAnalysis.getCompleteTrendAnalysis.useQuery(
    { timeWindowDays: timeWindow },
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: anomalies } = trpc.trendAnalysis.detectAnomalies.useQuery(
    { timeWindowDays: timeWindow },
    { staleTime: 5 * 60 * 1000 }
  );

  // Dados para gráficos
  const anomalyChartData = useMemo(() => {
    if (!anomalies) return [];
    return anomalies.slice(0, 10).map((a) => ({
      actionType: a.actionType.substring(0, 15),
      expected: a.expectedDuration,
      actual: a.actualDuration,
      deviation: a.deviation,
      severity: a.severity,
    }));
  }, [anomalies]);

  const recommendationsByPriority = useMemo(() => {
    if (!analysisData?.recommendations) return { high: 0, medium: 0, low: 0 };
    return {
      high: analysisData.recommendations.filter((r) => r.priority === 'high').length,
      medium: analysisData.recommendations.filter((r) => r.priority === 'medium').length,
      low: analysisData.recommendations.filter((r) => r.priority === 'low').length,
    };
  }, [analysisData]);

  const priorityData = [
    { name: 'High', value: recommendationsByPriority.high, color: '#ef4444' },
    { name: 'Medium', value: recommendationsByPriority.medium, color: '#f59e0b' },
    { name: 'Low', value: recommendationsByPriority.low, color: '#10b981' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando análise de tendências...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={timeWindow === days ? 'default' : 'outline'}
              onClick={() => setTimeWindow(days)}
              className="text-sm"
            >
              {days === 7 ? '1 Semana' : days === 30 ? '1 Mês' : '3 Meses'}
            </Button>
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analysisData?.metrics.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analysisData?.metrics.successCount} de {analysisData?.metrics.totalActions} ações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Duração Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analysisData?.metrics.averageDuration}ms
            </div>
            <p className="text-xs text-gray-500 mt-1">Tempo médio de execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Anomalias Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{anomalies?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Desvios significativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analysisData?.recommendations.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Oportunidades de otimização</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Anomalias Críticas */}
      {anomalies && anomalies.filter((a) => a.severity === 'high').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{anomalies.filter((a) => a.severity === 'high').length} anomalias críticas detectadas</strong>
            {' - '}
            Ações estão demorando significativamente mais do que o normal. Verifique os logs de erro.
          </AlertDescription>
        </Alert>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Prioridades */}
        <Card>
          <CardHeader>
            <CardTitle>Recomendações por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Anomalias por Tipo de Ação */}
        <Card>
          <CardHeader>
            <CardTitle>Anomalias Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={anomalyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="actionType" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expected" fill="#10b981" name="Esperado (ms)" />
                <Bar dataKey="actual" fill="#ef4444" name="Real (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Principais Recomendações de Otimização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysisData?.recommendations.slice(0, 5).map((rec, idx) => (
              <div key={idx} className="border-l-4 border-yellow-400 pl-4 py-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{rec.actionType}</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.issue}</p>
                    <p className="text-sm text-gray-700 mt-2 italic">{rec.recommendation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rec.priority === 'high'
                          ? 'destructive'
                          : rec.priority === 'medium'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-semibold text-green-600">
                      +{rec.estimatedImprovement.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Anomalias Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Anomalias Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Tipo de Ação</th>
                  <th className="px-4 py-2 text-right font-semibold">Esperado (ms)</th>
                  <th className="px-4 py-2 text-right font-semibold">Real (ms)</th>
                  <th className="px-4 py-2 text-right font-semibold">Desvio (ms)</th>
                  <th className="px-4 py-2 text-center font-semibold">Severidade</th>
                </tr>
              </thead>
              <tbody>
                {anomalies?.slice(0, 10).map((anomaly, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{anomaly.actionType}</td>
                    <td className="px-4 py-2 text-right">{anomaly.expectedDuration}</td>
                    <td className="px-4 py-2 text-right font-semibold text-red-600">
                      {anomaly.actualDuration}
                    </td>
                    <td className="px-4 py-2 text-right">{anomaly.deviation}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge
                        variant={
                          anomaly.severity === 'high'
                            ? 'destructive'
                            : anomaly.severity === 'medium'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {anomaly.severity.toUpperCase()}
                      </Badge>
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
