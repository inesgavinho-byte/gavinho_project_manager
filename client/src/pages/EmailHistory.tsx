import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface EmailHistoryProps {
  projectId?: number;
}

export default function EmailHistory({ projectId = 1 }: EmailHistoryProps) {
  const [filters, setFilters] = useState({
    status: '',
    eventType: '',
    startDate: '',
    endDate: '',
  });

  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);

  // Queries
  const { data: emailHistory = [], isLoading: historyLoading } = trpc.emailHistory.getHistory.useQuery({
    projectId,
    status: filters.status || undefined,
    eventType: filters.eventType || undefined,
    limit: 50,
  });

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = trpc.emailHistory.getAlerts.useQuery({
    projectId,
  });

  const { data: insights = {}, isLoading: insightsLoading } = trpc.emailHistory.getInsights.useQuery({
    projectId,
  });

  // Mutations
  const markAlertAsReadMutation = trpc.emailHistory.markAlertAsRead.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const analyzeProjectMutation = trpc.emailHistory.analyzeProject.useMutation();

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!emailHistory || emailHistory.length === 0) {
      return { sent: 0, delivered: 0, bounced: 0, failed: 0, openRate: 0 };
    }

    const sent = emailHistory.length;
    const delivered = emailHistory.filter((e: any) => e.status === 'delivered').length;
    const bounced = emailHistory.filter((e: any) => e.status === 'bounced').length;
    const failed = emailHistory.filter((e: any) => e.status === 'failed').length;
    const opened = emailHistory.filter((e: any) => e.openedAt).length;
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0';

    return { sent, delivered, bounced, failed, openRate };
  }, [emailHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'bounced':
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Emails</h1>
          <p className="text-gray-600 mt-1">Rastreamento e análise de comunicações por email</p>
        </div>
        <Button
          onClick={() => analyzeProjectMutation.mutate({ projectId })}
          disabled={analyzeProjectMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {analyzeProjectMutation.isPending ? 'Analisando...' : 'Analisar Agora'}
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Enviados</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.sent}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Entregues</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{stats.delivered}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Rejeitados</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{stats.bounced}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Falhados</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{stats.failed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Taxa de Abertura</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{stats.openRate}%</div>
        </Card>
      </div>

      {/* Alertas Automáticos */}
      {alerts.length > 0 && (
        <Card className="p-6 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Alertas Automáticos ({alerts.length})</h2>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-3 bg-white rounded border border-red-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-gray-900">{alert.title}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      {alert.recipientEmail && (
                        <p className="text-xs text-gray-500 mt-1">Email: {alert.recipientEmail}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        markAlertAsReadMutation.mutate({ alertId: alert.id });
                        setSelectedAlert(null);
                      }}
                      className="ml-4 flex-shrink-0"
                    >
                      Marcar como lido
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Insights de IA */}
      {insights.anomalies && insights.anomalies.length > 0 && (
        <Card className="p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Insights de IA</h2>
              <div className="space-y-3">
                {insights.anomalies.slice(0, 3).map((anomaly: any, idx: number) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {anomaly.anomalyType}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        Confiança: {(anomaly.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{anomaly.description}</p>
                    {anomaly.recommendation && (
                      <p className="text-sm text-blue-700 mt-2 italic">💡 {anomaly.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos</option>
              <option value="delivered">Entregue</option>
              <option value="bounced">Rejeitado</option>
              <option value="failed">Falhado</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos</option>
              <option value="delivery">Entrega</option>
              <option value="adjudication">Adjudicação</option>
              <option value="payment">Pagamento</option>
              <option value="reminder">Lembrete</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabela de Histórico */}
      <Card className="p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Histórico de Emails</h2>
        {historyLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : emailHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum email encontrado</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Data/Hora</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Destinatário</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Assunto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tipo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {emailHistory.map((email: any) => (
                <tr key={email.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">
                    {email.sentAt ? format(new Date(email.sentAt), 'dd MMM yyyy HH:mm', { locale: pt }) : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-900">{email.recipientEmail}</td>
                  <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{email.subject}</td>
                  <td className="py-3 px-4">
                    <Badge className="bg-gray-100 text-gray-800">{email.eventType}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(email.status)}
                      <Badge className={getStatusColor(email.status)}>
                        {email.status.toUpperCase()}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                      Ver Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
