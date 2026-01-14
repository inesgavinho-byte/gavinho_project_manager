import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentData {
  averageSentiment: number;
  trend: 'improving' | 'declining' | 'stable';
  sentimentBreakdown: {
    very_positive: number;
    positive: number;
    neutral: number;
    negative: number;
    very_negative: number;
  };
  sentimentTrend: Array<{
    date: string;
    sentiment: number;
  }>;
}

interface ContactSentimentChartProps {
  contactId: number;
  sentimentAnalysis: SentimentData;
}

export default function ContactSentimentChart({ contactId, sentimentAnalysis }: ContactSentimentChartProps) {
  // Cores para o gráfico de pizza
  const SENTIMENT_COLORS = {
    very_positive: '#10b981',
    positive: '#6ee7b7',
    neutral: '#f3f4f6',
    negative: '#fca5a5',
    very_negative: '#ef4444',
  };

  // Dados para o gráfico de pizza
  const pieData = [
    { name: 'Muito Positivo', value: sentimentAnalysis.sentimentBreakdown.very_positive, color: SENTIMENT_COLORS.very_positive },
    { name: 'Positivo', value: sentimentAnalysis.sentimentBreakdown.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutro', value: sentimentAnalysis.sentimentBreakdown.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negativo', value: sentimentAnalysis.sentimentBreakdown.negative, color: SENTIMENT_COLORS.negative },
    { name: 'Muito Negativo', value: sentimentAnalysis.sentimentBreakdown.very_negative, color: SENTIMENT_COLORS.very_negative },
  ].filter(item => item.value > 0);

  // Dados para o gráfico de linha
  const lineData = sentimentAnalysis.sentimentTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }),
    sentiment: Math.round(item.sentiment * 100),
  }));

  // Determinar cor da tendência
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Determinar ícone da tendência
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Minus className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo de Sentimento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise de Sentimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Score Médio */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-xs text-blue-600 mb-2">Score Médio</p>
              <p className="text-3xl font-bold text-blue-900">
                {Math.round(sentimentAnalysis.averageSentiment * 100)}%
              </p>
              <p className="text-xs text-blue-600 mt-2">
                {sentimentAnalysis.averageSentiment > 0.6 && '😊 Muito Positivo'}
                {sentimentAnalysis.averageSentiment > 0.3 && sentimentAnalysis.averageSentiment <= 0.6 && '🙂 Positivo'}
                {sentimentAnalysis.averageSentiment > -0.3 && sentimentAnalysis.averageSentiment <= 0.3 && '😐 Neutro'}
                {sentimentAnalysis.averageSentiment > -0.6 && sentimentAnalysis.averageSentiment <= -0.3 && '😞 Negativo'}
                {sentimentAnalysis.averageSentiment <= -0.6 && '😠 Muito Negativo'}
              </p>
            </div>

            {/* Tendência */}
            <div className={`bg-gradient-to-br ${
              sentimentAnalysis.trend === 'improving' ? 'from-green-50 to-green-100' :
              sentimentAnalysis.trend === 'declining' ? 'from-red-50 to-red-100' :
              'from-gray-50 to-gray-100'
            } p-4 rounded-lg`}>
              <p className={`text-xs mb-2 ${
                sentimentAnalysis.trend === 'improving' ? 'text-green-600' :
                sentimentAnalysis.trend === 'declining' ? 'text-red-600' :
                'text-gray-600'
              }`}>Tendência</p>
              <div className={`flex items-center gap-2 ${getTrendColor(sentimentAnalysis.trend)}`}>
                {getTrendIcon(sentimentAnalysis.trend)}
                <p className="text-lg font-bold">
                  {sentimentAnalysis.trend === 'improving' && 'Melhorando'}
                  {sentimentAnalysis.trend === 'declining' && 'Piorando'}
                  {sentimentAnalysis.trend === 'stable' && 'Estável'}
                </p>
              </div>
            </div>

            {/* Total de Emails */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-xs text-purple-600 mb-2">Emails Analisados</p>
              <p className="text-3xl font-bold text-purple-900">
                {pieData.reduce((sum, item) => sum + item.value, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Evolução de Sentimento */}
      {lineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução de Sentimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line
                  type="monotone"
                  dataKey="sentiment"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Pizza - Distribuição de Sentimento */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Sentimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} emails`} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legenda Detalhada */}
              <div className="space-y-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">
                      {item.name}: <strong>{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sentimentAnalysis.averageSentiment > 0.6 && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✅ <strong>Comunicação Positiva:</strong> Este contato mantém uma comunicação predominantemente positiva. Continue com a abordagem atual.
              </p>
            </div>
          )}

          {sentimentAnalysis.averageSentiment < -0.3 && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Atenção Necessária:</strong> Detectamos padrões de comunicação negativa. Recomendamos revisar a estratégia de comunicação com este contato.
              </p>
            </div>
          )}

          {sentimentAnalysis.trend === 'improving' && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                📈 <strong>Tendência Positiva:</strong> O sentimento está melhorando ao longo do tempo. As ações recentes estão tendo efeito positivo.
              </p>
            </div>
          )}

          {sentimentAnalysis.trend === 'declining' && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                📉 <strong>Atenção:</strong> O sentimento está piorando. Considere investigar a causa e tomar ações corretivas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
