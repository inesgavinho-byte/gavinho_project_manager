import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, MessageSquare, CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface SentimentAnalysisDashboardProps {
  projectId: number;
}

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444',
};

export function SentimentAnalysisDashboard({ projectId }: SentimentAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'trends'>('overview');
  const [selectedContact, setSelectedContact] = useState<number | null>(null);

  // Queries
  const { data: sentimentTrends = [], isLoading: trendsLoading } = trpc.sentimentAnalysis.getSentimentTrends.useQuery({
    projectId,
    days: 30,
  });

  const { data: negativeSentimentAlerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = trpc.sentimentAnalysis.getNegativeSentimentAlerts.useQuery({
    projectId,
  });

  const { data: contactSentiment, isLoading: contactLoading } = trpc.sentimentAnalysis.getContactSentiment.useQuery(
    { contactId: selectedContact || 0 },
    { enabled: !!selectedContact }
  );

  // Mutations
  const { mutate: analyzeSentiment, isPending: isAnalyzing } = trpc.sentimentAnalysis.analyzeSentiment.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const { mutate: checkNegativeSentimentPatterns, isPending: isCheckingPatterns } = trpc.sentimentAnalysis.checkNegativeSentimentPatterns.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const { mutate: markAlertAsResolved, isPending: isResolvingAlert } = trpc.sentimentAnalysis.markSentimentAlertAsResolved.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  // Calcular estatísticas
  const sentimentStats = {
    positive: sentimentTrends.filter((t: any) => t.sentiment === 'positive').length,
    neutral: sentimentTrends.filter((t: any) => t.sentiment === 'neutral').length,
    negative: sentimentTrends.filter((t: any) => t.sentiment === 'negative').length,
  };

  const alertStats = {
    total: negativeSentimentAlerts.length,
    unresolved: negativeSentimentAlerts.filter((a: any) => !a.resolved).length,
    resolved: negativeSentimentAlerts.filter((a: any) => a.resolved).length,
  };

  // Preparar dados para gráficos
  const pieChartData = [
    { name: 'Positivo', value: sentimentStats.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutro', value: sentimentStats.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negativo', value: sentimentStats.negative, color: SENTIMENT_COLORS.negative },
  ].filter(d => d.value > 0);

  const trendChartData = sentimentTrends.slice(-14).map((t: any) => ({
    date: format(new Date(t.date), 'dd MMM', { locale: pt }),
    positive: t.sentiment === 'positive' ? 1 : 0,
    neutral: t.sentiment === 'neutral' ? 1 : 0,
    negative: t.sentiment === 'negative' ? 1 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análise de Sentimento</h2>
          <p className="text-gray-600 mt-1">Monitoramento de sentimento em comunicações</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => analyzeSentiment({ projectId })}
            disabled={isAnalyzing}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analisando...' : 'Analisar Agora'}
          </Button>
          <Button
            onClick={() => checkNegativeSentimentPatterns({ projectId })}
            disabled={isCheckingPatterns}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isCheckingPatterns ? 'Verificando...' : 'Verificar Padrões'}
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Sentimento Positivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-green-600">{sentimentStats.positive}</div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Sentimento Neutro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-600">{sentimentStats.neutral}</div>
              <MessageSquare className="w-8 h-8 text-gray-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Sentimento Negativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-red-600">{sentimentStats.negative}</div>
              <TrendingDown className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alertas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-orange-600">{alertStats.unresolved}</div>
              <AlertCircle className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="alerts">Alertas ({alertStats.unresolved})</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de Sentimento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo por Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {negativeSentimentAlerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.contactName}</p>
                      <p className="text-sm text-gray-600">{alert.occurrences} ocorrências</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Negativo</Badge>
                  </div>
                ))}
                {negativeSentimentAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhum sentimento negativo detectado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          {alertsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando alertas...</p>
            </div>
          ) : negativeSentimentAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum alerta de sentimento negativo</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {negativeSentimentAlerts.map((alert: any) => (
                <Card key={alert.id} className={`p-4 border-l-4 ${alert.resolved ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.contactName}</h3>
                      <p className="text-sm text-gray-600">{alert.email}</p>
                    </div>
                    <Badge className={alert.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {alert.resolved ? 'Resolvido' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {alert.occurrences} comunicações com sentimento negativo detectadas
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Criado em {format(new Date(alert.createdAt), 'dd MMM HH:mm', { locale: pt })}
                  </p>
                  {!alert.resolved && (
                    <Button
                      size="sm"
                      onClick={() => markAlertAsResolved({ alertId: alert.id })}
                      disabled={isResolvingAlert}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isResolvingAlert ? 'Resolvendo...' : 'Marcar como Resolvido'}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Tendências */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Sentimento (14 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  Carregando dados...
                </div>
              ) : trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} name="Positivo" />
                    <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} name="Neutro" />
                    <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} name="Negativo" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
