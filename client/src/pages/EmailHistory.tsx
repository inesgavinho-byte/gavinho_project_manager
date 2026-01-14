import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, CheckCircle, XCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { EmailTrendCharts } from '@/components/EmailTrendCharts';
import { EmailBulkActions } from '@/components/EmailBulkActions';
import { AlertsDashboard } from '@/components/AlertsDashboard';
import { EmailSearchBar } from '@/components/EmailSearchBar';

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
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'alerts' | 'trends'>('history');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Queries
  const { data: emailHistory = [], isLoading: historyLoading } = trpc.emailHistory.getHistory.useQuery({
    projectId,
    status: filters.status || undefined,
    eventType: filters.eventType || undefined,
    limit: 50,
  });

  // Usar resultados de busca se houver, senão usar histórico normal
  const displayedEmails = isSearching && searchResults.length > 0 ? searchResults : emailHistory;

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = trpc.emailHistory.getAlerts.useQuery({
    projectId,
  });

  const { data: insights = {}, isLoading: insightsLoading } = trpc.emailHistory.getInsights.useQuery({
    projectId,
  });

  const { data: trendData = [], isLoading: trendLoading } = trpc.emailHistory.getTrendChartData.useQuery({
    projectId,
    days: 30,
  });

  const { data: domainData = [], isLoading: domainLoading } = trpc.emailHistory.getDomainComparison.useQuery({
    projectId,
    days: 30,
  });

  const { data: eventTypeData = [], isLoading: eventTypeLoading } = trpc.emailHistory.getEventTypeComparison.useQuery({
    projectId,
    days: 30,
  });

  const { data: trendSummary = {}, isLoading: summaryLoading } = trpc.emailHistory.getTrendSummary.useQuery({
    projectId,
  });

  // Mutations
  const { mutate: markAlertAsReadMutation } = trpc.emailHistory.markAlertAsRead.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const { mutate: analyzeProjectMutation } = trpc.emailHistory.analyzeProject.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

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

  // Funções de seleção múltipla
  const handleSelectEmail = (emailId: number) => {
    setSelectedEmails((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails([]);
      setSelectAll(false);
    } else {
      const allIds = emailHistory.map((e: any) => e.id);
      setSelectedEmails(allIds);
      setSelectAll(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedEmails([]);
    setSelectAll(false);
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

      {/* Tabs de Navegação */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Histórico
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Alertas Inteligentes
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'trends'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tendências
        </button>
      </div>

      {/* Tab: Alertas Inteligentes */}
      {activeTab === 'alerts' && <AlertsDashboard projectId={projectId} />}

      {/* Tab: Histórico */}
      {activeTab === 'history' && (
        <>
          {/* Barra de Ações em Massa */}
          <EmailBulkActions
            selectedEmails={selectedEmails}
            onClearSelection={handleClearSelection}
            onRefresh={() => {
              // Trigger refresh of email history
            }}
            projectName="Projeto"
          />

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Enviados</p>
                  <p className="text-3xl font-bold text-blue-600">{emailHistory.length}</p>
                </div>
                <Mail className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entregues</p>
                  <p className="text-3xl font-bold text-green-600">
                    {emailHistory.filter((e: any) => e.status === 'delivered').length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejeitados</p>
                  <p className="text-3xl font-bold text-red-600">
                    {emailHistory.filter((e: any) => e.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {emailHistory.filter((e: any) => e.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Busca em Tempo Real */}
          <div className="mb-4">
            <EmailSearchBar
              projectId={projectId}
              onResultsChange={(results) => {
                setSearchResults(results);
                setIsSearching(results.length > 0);
              }}
              onSearchChange={(query) => {
                setIsSearching(query.length > 0);
              }}
              placeholder="Buscar emails por destinatário, assunto, remetente..."
            />
          </div>

          {/* Filtros */}
          <Card className="p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos</option>
                  <option value="delivered">Entregue</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="pending">Pendente</option>
                  <option value="bounced">Devolvido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos</option>
                  <option value="send">Envio</option>
                  <option value="open">Abertura</option>
                  <option value="click">Clique</option>
                  <option value="bounce">Devolução</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </Card>

          {/* Alertas Automáticos */}
          {alerts.length > 0 && (
            <Card className="p-4 border border-red-200 bg-red-50">
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
            </Card>
          )}

          {/* Tabela de Histórico */}
          <Card className="border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Destinatário</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Assunto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Carregando histórico...
                      </td>
                    </tr>
                  ) : displayedEmails.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {isSearching ? 'Nenhum email encontrado para sua busca' : 'Nenhum email encontrado'}
                      </td>
                    </tr>
                  ) : (
                    displayedEmails.map((email: any) => (
                      <tr key={email.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(email.id)}
                            onChange={() => handleSelectEmail(email.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(email.sentAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{email.recipientEmail}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{email.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{email.eventType}</td>
                        <td className="px-4 py-3">
                          <Badge className={getSeverityColor(email.status)}>{email.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Tab: Tendências */}
      {activeTab === 'trends' && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Dashboard de Tendências</h2>
          </div>
          {trendLoading || domainLoading || eventTypeLoading || summaryLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando gráficos...</div>
          ) : (
            <EmailTrendCharts
              projectId={projectId}
              trendData={trendData}
              domainData={domainData}
              eventTypeData={eventTypeData}
              trendSummary={trendSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
