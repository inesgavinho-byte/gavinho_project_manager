import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { TrendingUp, TrendingDown } from 'lucide-react';

interface EmailTrendChartsProps {
  projectId: number;
  trendData: any[];
  domainData: any[];
  eventTypeData: any[];
  trendSummary: any;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export function EmailTrendCharts({
  projectId,
  trendData,
  domainData,
  eventTypeData,
  trendSummary,
}: EmailTrendChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('month');

  const currentPeriod = trendSummary?.[selectedPeriod] || {};

  const getTrendDirection = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  return (
    <div className="space-y-6">
      {/* Resumo de Tendências */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Entrega</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {currentPeriod.avgDeliveryRate?.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Rejeição</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {currentPeriod.avgBounceRate?.toFixed(1)}%
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-gray-600">Taxa de Abertura</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {currentPeriod.avgOpenRate?.toFixed(1)}%
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-gray-600">Total Enviados</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {currentPeriod.totalSent || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Filtro de Período */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Última Semana
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Último Mês
        </button>
      </div>

      {/* Gráfico de Tendências de Taxas */}
      {trendData && trendData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Evolução de Taxas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => `${(value as number).toFixed(1)}%`}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="deliveryRate"
                stroke="#10b981"
                name="Taxa de Entrega"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="bounceRate"
                stroke="#ef4444"
                name="Taxa de Rejeição"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="openRate"
                stroke="#3b82f6"
                name="Taxa de Abertura"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Comparação por Domínio */}
        {domainData && domainData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Desempenho por Domínio</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={domainData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="domain" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="deliveryRate" fill="#10b981" name="Taxa de Entrega" />
                <Bar dataKey="bounceRate" fill="#ef4444" name="Taxa de Rejeição" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Gráfico de Comparação por Tipo de Evento */}
        {eventTypeData && eventTypeData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Desempenho por Tipo de Evento</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="deliveryRate" fill="#10b981" name="Taxa de Entrega" />
                <Bar dataKey="openRate" fill="#3b82f6" name="Taxa de Abertura" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Gráfico de Distribuição de Envios */}
      {trendData && trendData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Distribuição de Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Total de Envios</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Entregues',
                        value: trendData.reduce((sum, d) => sum + d.totalDelivered, 0),
                      },
                      {
                        name: 'Rejeitados',
                        value: trendData.reduce((sum, d) => sum + d.totalBounced, 0),
                      },
                      {
                        name: 'Falhados',
                        value: trendData.reduce((sum, d) => sum + d.totalFailed, 0),
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Engajamento</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Abertos',
                        value: trendData.reduce((sum, d) => sum + d.totalOpened, 0),
                      },
                      {
                        name: 'Clicados',
                        value: trendData.reduce((sum, d) => sum + d.totalClicked, 0),
                      },
                      {
                        name: 'Não Engajados',
                        value: Math.max(
                          0,
                          trendData.reduce((sum, d) => sum + d.totalDelivered, 0) -
                            trendData.reduce((sum, d) => sum + d.totalOpened, 0)
                        ),
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index + 3]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
