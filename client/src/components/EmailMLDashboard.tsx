import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Brain, TrendingUp, AlertCircle, CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function EmailMLDashboard() {
  const [isTraining, setIsTraining] = useState(false);

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.emailML.getModelMetrics.useQuery();

  const { data: accuracyStats, refetch: refetchStats } = trpc.emailML.getAccuracyStats.useQuery({
    projectId: undefined,
  });

  const { data: suggestions } = trpc.emailML.getImprovementSuggestions.useQuery();

  const trainModelMutation = trpc.emailML.trainModel.useMutation({
    onSuccess: () => {
      toast.success('Modelo treinado com sucesso!');
      refetchMetrics();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Erro ao treinar modelo: ${error.message}`);
    },
  });

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      await trainModelMutation.mutateAsync();
    } finally {
      setIsTraining(false);
    }
  };

  if (metricsLoading) {
    return <div className="text-center py-8">Carregando métricas do modelo...</div>;
  }

  const COLORS = ['#8b8670', '#adaa96', '#f2f0e7', '#e5e3d9', '#d4d1c5', '#c3bfb8'];

  // Preparar dados para gráficos
  const categoryData =
    accuracyStats?.status === 'ready'
      ? accuracyStats.byCategory.map((cat) => ({
          category: cat.category,
          f1Score: (cat.f1Score * 100).toFixed(0),
          precision: (cat.precision * 100).toFixed(0),
          recall: (cat.recall * 100).toFixed(0),
        }))
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Machine Learning - Classificação de Emails
        </h1>
        <p className="text-muted-foreground mt-1">Monitore e melhore o modelo de classificação com base em suas correções</p>
      </div>

      {/* Status do Modelo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {accuracyStats?.status === 'ready' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accuracyStats?.status === 'ready' ? 'Ativo' : 'Sem Modelo'}
            </div>
            <p className="text-xs text-muted-foreground">
              {accuracyStats?.status === 'ready' ? 'Modelo treinado' : 'Registre correções para treinar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acurácia</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accuracyStats?.status === 'ready'
                ? `${(accuracyStats.overallAccuracy * 100).toFixed(1)}%`
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">Acurácia geral do modelo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amostras</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accuracyStats?.status === 'ready' ? accuracyStats.totalSamples : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Correções registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {accuracyStats?.status === 'ready'
                ? new Date(accuracyStats.lastTraining).toLocaleDateString('pt-PT')
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">Data do treinamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Sugestões de Melhoria */}
      {suggestions && suggestions.suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.suggestions.map((suggestion, idx) => (
            <Alert key={idx} className={suggestion.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{suggestion.message}</p>
                    <Badge className="mt-2">{suggestion.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}</Badge>
                  </div>
                  {suggestion.action === 'train_model' && (
                    <Button
                      onClick={handleTrainModel}
                      disabled={isTraining}
                      size="sm"
                      className="ml-4"
                    >
                      {isTraining ? 'Treinando...' : 'Treinar Agora'}
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tabs com Gráficos e Detalhes */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="training">Treinamento</TabsTrigger>
        </TabsList>

        {/* Tab: Performance */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance do Modelo</CardTitle>
              <CardDescription>Evolução da acurácia ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {accuracyStats?.status === 'ready' ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Acurácia Geral</span>
                      <span className="text-sm font-bold">
                        {(accuracyStats.overallAccuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={accuracyStats.overallAccuracy * 100} className="h-2" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Gráfico de Acurácia por Categoria */}
                    <div>
                      <h3 className="text-sm font-medium mb-4">F1-Score por Categoria</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="f1Score" fill="#8b8670" name="F1-Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Gráfico de Comparação Precision vs Recall */}
                    <div>
                      <h3 className="text-sm font-medium mb-4">Precision vs Recall</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="precision" stroke="#adaa96" name="Precision" />
                          <Line type="monotone" dataKey="recall" stroke="#f2f0e7" name="Recall" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum modelo treinado. Registre correções para começar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Por Categoria */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Categoria</CardTitle>
              <CardDescription>Detalhes de performance para cada categoria de email</CardDescription>
            </CardHeader>
            <CardContent>
              {accuracyStats?.status === 'ready' ? (
                <div className="space-y-4">
                  {accuracyStats.byCategory.map((cat) => (
                    <div key={cat.category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium capitalize">{cat.category}</h3>
                        <Badge variant="outline">{(cat.f1Score * 100).toFixed(0)}% F1</Badge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Precision</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={cat.precision * 100} className="h-1 flex-1" />
                            <span className="text-xs font-medium">{(cat.precision * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Recall</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={cat.recall * 100} className="h-1 flex-1" />
                            <span className="text-xs font-medium">{(cat.recall * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">F1-Score</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={cat.f1Score * 100} className="h-1 flex-1" />
                            <span className="text-xs font-medium">{(cat.f1Score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Sem dados disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Treinamento */}
        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento do Modelo</CardTitle>
              <CardDescription>Treinar novo modelo com histórico de correções</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Treinar Novo Modelo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  O modelo será treinado com todas as correções registradas. Isso pode levar alguns minutos.
                </p>
                <Button
                  onClick={handleTrainModel}
                  disabled={isTraining || trainModelMutation.isPending}
                  className="w-full"
                >
                  {isTraining || trainModelMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Treinando...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Treinar Modelo
                    </>
                  )}
                </Button>
              </div>

              {metrics && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Informações do Modelo</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Nome:</strong> {metrics.modelName}
                    </p>
                    <p>
                      <strong>Acurácia:</strong> {(metrics.accuracy * 100).toFixed(2)}%
                    </p>
                    <p>
                      <strong>Amostras:</strong> {metrics.totalSamples}
                    </p>
                    <p>
                      <strong>Data de Treinamento:</strong> {new Date(metrics.trainingDate).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
