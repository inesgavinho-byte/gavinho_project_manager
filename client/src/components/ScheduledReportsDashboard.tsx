import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Trash2, Clock, CheckCircle, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ScheduledReportsDashboardProps {
  projectId: number;
}

export function ScheduledReportsDashboard({ projectId }: ScheduledReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'logs'>('reports');
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recipientEmail: '',
    includeCharts: true,
    includeAIInsights: true,
  });

  // Queries
  const { data: scheduledReports = [], isLoading: reportsLoading, refetch: refetchReports } = trpc.emailReports.getScheduledReports.useQuery({
    projectId,
  });

  const { data: reportLogs = [], isLoading: logsLoading, refetch: refetchLogs } = trpc.emailReports.getReportLogs.useQuery({
    projectId,
    limit: 50,
  });

  // Mutations
  const { mutate: createReport, isPending: isCreating } = trpc.emailReports.createScheduledReport.useMutation({
    onSuccess: () => {
      setNewReport({ name: '', frequency: 'weekly', recipientEmail: '', includeCharts: true, includeAIInsights: true });
      setShowNewReportForm(false);
      refetchReports();
    },
  });

  const { mutate: generateReport, isPending: isGenerating } = trpc.emailReports.generateReport.useMutation({
    onSuccess: () => {
      refetchLogs();
    },
  });

  const { mutate: deleteReport, isPending: isDeleting } = trpc.emailReports.deleteScheduledReport.useMutation({
    onSuccess: () => {
      refetchReports();
    },
  });

  const handleCreateReport = () => {
    if (newReport.name && newReport.recipientEmail) {
      createReport({
        projectId,
        ...newReport,
      });
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'Diário';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensal';
      default:
        return frequency;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Sucesso';
      case 'failed':
        return 'Falha';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  // Calcular estatísticas
  const totalReports = scheduledReports.length;
  const successfulLogs = reportLogs.filter((log: any) => log.status === 'success').length;
  const failedLogs = reportLogs.filter((log: any) => log.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios Agendados</h2>
          <p className="text-gray-600 mt-1">Configure e gerencie relatórios automáticos de email</p>
        </div>
        <Button
          onClick={() => setShowNewReportForm(!showNewReportForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {/* Novo Relatório Form */}
      {showNewReportForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Criar Novo Relatório Agendado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Relatório</label>
                <Input
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="Ex: Relatório Semanal de Emails"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email do Destinatário</label>
                <Input
                  value={newReport.recipientEmail}
                  onChange={(e) => setNewReport({ ...newReport, recipientEmail: e.target.value })}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
                <select
                  value={newReport.frequency}
                  onChange={(e) => setNewReport({ ...newReport, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newReport.includeCharts}
                    onChange={(e) => setNewReport({ ...newReport, includeCharts: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir Gráficos</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newReport.includeAIInsights}
                    onChange={(e) => setNewReport({ ...newReport, includeAIInsights: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Insights de IA</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateReport}
                disabled={isCreating || !newReport.name || !newReport.recipientEmail}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? 'Criando...' : 'Criar Relatório'}
              </Button>
              <Button
                onClick={() => setShowNewReportForm(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Relatórios Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-blue-600">{totalReports}</div>
              <FileText className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Relatórios Bem-sucedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-green-600">{successfulLogs}</div>
              <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Falhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-red-600">{failedLogs}</div>
              <AlertCircle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Execuções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-purple-600">{reportLogs.length}</div>
              <BarChart3 className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">Relatórios Agendados ({totalReports})</TabsTrigger>
          <TabsTrigger value="logs">Histórico de Execução ({reportLogs.length})</TabsTrigger>
        </TabsList>

        {/* Tab: Relatórios Agendados */}
        <TabsContent value="reports" className="space-y-4">
          {reportsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando relatórios...</p>
            </div>
          ) : scheduledReports.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum relatório agendado</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {scheduledReports.map((report: any) => (
                <Card key={report.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-600">{report.recipientEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {getFrequencyLabel(report.frequency)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReport({ reportId: report.id })}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {report.includeCharts && (
                      <Badge variant="outline">Com Gráficos</Badge>
                    )}
                    {report.includeAIInsights && (
                      <Badge variant="outline">Com Insights de IA</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateReport({ projectId, days: 7 })}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Gerando...' : 'Gerar Agora'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Histórico de Execução */}
        <TabsContent value="logs" className="space-y-4">
          {logsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando histórico...</p>
            </div>
          ) : reportLogs.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma execução registrada</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reportLogs.map((log: any) => (
                <Card key={log.id} className={`p-4 border-l-4 ${log.status === 'success' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{log.reportName}</h3>
                      <p className="text-sm text-gray-600">{log.recipientEmail}</p>
                    </div>
                    <Badge className={getStatusColor(log.status)}>
                      {getStatusLabel(log.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      {format(new Date(log.executedAt), 'dd MMM HH:mm', { locale: pt })}
                    </span>
                    {log.errorMessage && (
                      <span className="text-red-600">{log.errorMessage}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
