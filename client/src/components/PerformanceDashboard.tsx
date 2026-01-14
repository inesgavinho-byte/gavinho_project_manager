import { useState } from 'react';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ActionMetric {
  actionId: string;
  actionName: string;
  completionRate: number;
  sentimentImpact: number;
  avgTimeInvested: number;
  successCount: number;
  totalAttempts: number;
}

interface PerformanceDashboardProps {
  projectId: number;
}

export function PerformanceDashboard({ projectId }: PerformanceDashboardProps) {
  const [metrics] = useState<ActionMetric[]>([
    {
      actionId: 'email-follow-up',
      actionName: 'Email de Acompanhamento',
      completionRate: 85,
      sentimentImpact: 12,
      avgTimeInvested: 15,
      successCount: 34,
      totalAttempts: 40,
    },
    {
      actionId: 'schedule-meeting',
      actionName: 'Agendar Reunião',
      completionRate: 72,
      sentimentImpact: 18,
      avgTimeInvested: 30,
      successCount: 29,
      totalAttempts: 40,
    },
    {
      actionId: 'send-proposal',
      actionName: 'Enviar Proposta',
      completionRate: 65,
      sentimentImpact: 15,
      avgTimeInvested: 45,
      successCount: 26,
      totalAttempts: 40,
    },
  ]);

  const topActions = metrics.sort((a, b) => b.sentimentImpact - a.sentimentImpact).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-[#C9A882]" />
        <h2 className="text-2xl font-bold text-[#5F5C59]">Dashboard de Performance</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#C9A882]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Taxa de Conclusão Média</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">
                {Math.round(metrics.reduce((a, b) => a + b.completionRate, 0) / metrics.length)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-[#C9A882] opacity-20" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Impacto Médio em Sentimento</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">
                +{Math.round(metrics.reduce((a, b) => a + b.sentimentImpact, 0) / metrics.length)}%
              </p>
            </div>
            <Award className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Tempo Médio Investido</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">
                {Math.round(metrics.reduce((a, b) => a + b.avgTimeInvested, 0) / metrics.length)} min
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Total de Ações Executadas</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">
                {metrics.reduce((a, b) => a + b.successCount, 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Top Performing Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#5F5C59] mb-4">Ações com Maior Impacto</h3>
        <div className="space-y-4">
          {topActions.map((action, idx) => (
            <div key={action.actionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#C9A882]">#{idx + 1}</span>
                  <p className="font-medium text-[#5F5C59]">{action.actionName}</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {action.successCount} sucessos em {action.totalAttempts} tentativas
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">+{action.sentimentImpact}%</p>
                <p className="text-xs text-gray-600">Impacto em Sentimento</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Metrics Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#5F5C59] mb-4">Métricas Detalhadas por Ação</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Ação</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Taxa de Conclusão</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Impacto Sentimento</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Tempo Médio</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">Taxa de Sucesso</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.actionId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-700">{metric.actionName}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {metric.completionRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      +{metric.sentimentImpact}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-700">{metric.avgTimeInvested} min</td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-gray-700 font-medium">
                      {Math.round((metric.successCount / metric.totalAttempts) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
