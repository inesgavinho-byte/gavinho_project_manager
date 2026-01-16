import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

// Brand colors GAVINHO
const BRAND_COLORS = {
  dark: '#7a7667',
  medium: '#8b8670',
  light: '#adaa96',
  cream: '#f2f0e7',
};

const CHART_COLORS = ['#7a7667', '#8b8670', '#adaa96', '#c4c0ad', '#d9d7ce'];

interface ExecutiveDashboardChartsProps {
  statusData?: Array<{ name: string; value: number }>;
  priorityData?: Array<{ name: string; value: number }>;
  phaseData?: Array<{ name: string; value: number }>;
  progressData?: Array<{ name: string; progress: number; count: number }>;
  timelineData?: Array<{ date: string; completed: number; active: number; overdue: number }>;
}

export function ExecutiveDashboardCharts({
  statusData = [],
  priorityData = [],
  phaseData = [],
  progressData = [],
  timelineData = [],
}: ExecutiveDashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: BRAND_COLORS.medium }} />
            Distribuição por Status
          </CardTitle>
          <CardDescription>
            Visão geral do estado dos projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
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
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: BRAND_COLORS.cream,
                    border: `1px solid ${BRAND_COLORS.light}`,
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" style={{ color: BRAND_COLORS.medium }} />
            Distribuição por Prioridade
          </CardTitle>
          <CardDescription>
            Projetos por nível de prioridade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.light} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: BRAND_COLORS.cream,
                    border: `1px solid ${BRAND_COLORS.light}`,
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill={BRAND_COLORS.medium} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Fase</CardTitle>
          <CardDescription>
            Projetos em cada fase do ciclo de vida
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={phaseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.light} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: BRAND_COLORS.cream,
                    border: `1px solid ${BRAND_COLORS.light}`,
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill={BRAND_COLORS.light} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Progresso</CardTitle>
          <CardDescription>
            Número de projetos por faixa de progresso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.light} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: BRAND_COLORS.cream,
                    border: `1px solid ${BRAND_COLORS.light}`,
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  fill={BRAND_COLORS.light}
                  stroke={BRAND_COLORS.medium}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {timelineData.length > 0 && (
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: BRAND_COLORS.medium }} />
              Tendência Temporal
            </CardTitle>
            <CardDescription>
              Evolução do status dos projetos ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.light} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: BRAND_COLORS.cream,
                    border: `1px solid ${BRAND_COLORS.light}`,
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Concluídos"
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke={BRAND_COLORS.medium}
                  strokeWidth={2}
                  dot={{ fill: BRAND_COLORS.medium, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Ativos"
                />
                <Line
                  type="monotone"
                  dataKey="overdue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Atrasados"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Componente de Comparação de Projetos
 * Permite comparar métricas entre múltiplos projetos
 */
interface ProjectComparisonChartProps {
  projects: Array<{
    name: string;
    progress: number;
    budget: number;
    team: number;
    milestones: number;
  }>;
}

export function ProjectComparisonChart({ projects }: ProjectComparisonChartProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Comparação de Projetos</CardTitle>
        <CardDescription>
          Métricas comparativas entre projetos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND_COLORS.light} />
              <XAxis
                dataKey="progress"
                name="Progresso (%)"
                type="number"
                domain={[0, 100]}
              />
              <YAxis
                dataKey="team"
                name="Tamanho da Equipa"
                type="number"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: BRAND_COLORS.cream,
                  border: `1px solid ${BRAND_COLORS.light}`,
                  borderRadius: '8px',
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter
                name="Projetos"
                data={projects}
                fill={BRAND_COLORS.medium}
              />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Sem dados disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Componente de Heatmap de Atividades
 * Mostra intensidade de atividades por período
 */
interface ActivityHeatmapProps {
  data: Array<{
    period: string;
    intensity: number;
  }>;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return '#dc2626'; // Vermelho
    if (intensity >= 60) return '#f97316'; // Laranja
    if (intensity >= 40) return '#eab308'; // Amarelo
    if (intensity >= 20) return '#84cc16'; // Verde claro
    return '#d1d5db'; // Cinzento
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Intensidade de Atividades</CardTitle>
        <CardDescription>
          Heatmap de atividades por período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1"
              title={`${item.period}: ${item.intensity}%`}
            >
              <div
                className="w-8 h-8 rounded"
                style={{
                  backgroundColor: getIntensityColor(item.intensity),
                }}
              />
              <span className="text-xs text-gray-600">{item.period}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
