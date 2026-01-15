import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SegmentFilter {
  segmentId: string;
  startDate?: Date;
  endDate?: Date;
}

export function RecipientSegmentationDashboard() {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSegmentId, setCompareSegmentId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Queries
  const segmentMetricsQuery = trpc.recipientSegmentation.getSegmentMetrics.useQuery(
    {
      segmentId: selectedSegment,
      startDate: dateRange.start,
      endDate: dateRange.end,
    },
    { enabled: !!selectedSegment }
  );

  const compareQuery = trpc.recipientSegmentation.compareSegments.useQuery(
    {
      segmentId1: selectedSegment,
      segmentId2: compareSegmentId,
      startDate: dateRange.start,
      endDate: dateRange.end,
    },
    { enabled: compareMode && !!selectedSegment && !!compareSegmentId }
  );

  const highEngagementQuery = trpc.recipientSegmentation.getHighEngagementRecipients.useQuery(
    {
      segmentId: selectedSegment,
      threshold: 50,
    },
    { enabled: !!selectedSegment }
  );

  const inactiveQuery = trpc.recipientSegmentation.getInactiveRecipients.useQuery(
    {
      segmentId: selectedSegment,
      daysInactive: 30,
    },
    { enabled: !!selectedSegment }
  );

  const metrics = segmentMetricsQuery.data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Segmentação de Destinatários</h1>
        <Button
          onClick={() => setCompareMode(!compareMode)}
          variant={compareMode ? 'default' : 'outline'}
        >
          {compareMode ? 'Cancelar Comparação' : 'Comparar Segmentos'}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Segmento Principal</label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md"
              >
                <option value="">Selecione um segmento</option>
                <option value="segment-1">Clientes Residenciais</option>
                <option value="segment-2">Clientes Corporativos</option>
                <option value="segment-3">Investidores</option>
              </select>
            </div>

            {compareMode && (
              <div>
                <label className="text-sm font-medium">Segmento para Comparação</label>
                <select
                  value={compareSegmentId}
                  onChange={(e) => setCompareSegmentId(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                >
                  <option value="">Selecione um segmento</option>
                  <option value="segment-1">Clientes Residenciais</option>
                  <option value="segment-2">Clientes Corporativos</option>
                  <option value="segment-3">Investidores</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Período</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="date"
                  onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.openRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">{metrics.totalOpens} aberturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Clique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.clickRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">{metrics.totalClicks} cliques</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.bounceRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">{metrics.totalBounces} rejeições</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Destinatários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRecipients}</div>
              <p className="text-xs text-gray-500">{metrics.totalEmails} emails enviados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparação de Segmentos */}
      {compareMode && compareQuery.data?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Segmentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Taxa de Abertura</p>
                <div className="flex items-center gap-2">
                  <Badge variant={compareQuery.data.comparison.openRateDiff > 0 ? 'default' : 'secondary'}>
                    {compareQuery.data.comparison.openRateDiff > 0 ? '+' : ''}
                    {compareQuery.data.comparison.openRateDiff.toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {compareQuery.data.comparison.openRateDiff > 0 ? 'Segmento 1 melhor' : 'Segmento 2 melhor'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Taxa de Clique</p>
                <div className="flex items-center gap-2">
                  <Badge variant={compareQuery.data.comparison.clickRateDiff > 0 ? 'default' : 'secondary'}>
                    {compareQuery.data.comparison.clickRateDiff > 0 ? '+' : ''}
                    {compareQuery.data.comparison.clickRateDiff.toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {compareQuery.data.comparison.clickRateDiff > 0 ? 'Segmento 1 melhor' : 'Segmento 2 melhor'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Vencedor Geral</p>
                <Badge variant="default">
                  {compareQuery.data.comparison.winner === 'segment1'
                    ? 'Segmento 1'
                    : compareQuery.data.comparison.winner === 'segment2'
                      ? 'Segmento 2'
                      : 'Empate'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destinatários com Alto Engajamento */}
      {highEngagementQuery.data?.data && highEngagementQuery.data.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Destinatários com Alto Engajamento</CardTitle>
            <CardDescription>Top {highEngagementQuery.data.count} destinatários mais engajados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highEngagementQuery.data.data.map((recipient) => (
                <div key={recipient.email} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{recipient.email}</p>
                    <p className="text-sm text-gray-500">
                      {recipient.opens} aberturas • {recipient.clicks} cliques
                    </p>
                  </div>
                  <Badge variant="default">{recipient.engagementScore}/100</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destinatários Inativos */}
      {inactiveQuery.data?.data && inactiveQuery.data.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Destinatários Inativos</CardTitle>
            <CardDescription>Sem atividade nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveQuery.data.data.slice(0, 5).map((recipient) => (
                <div key={recipient.email} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">{recipient.email}</p>
                    <p className="text-sm text-gray-500">
                      Última atividade: {recipient.lastEventAt ? new Date(recipient.lastEventAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Reativar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links Mais Clicados */}
      {metrics?.topLinks && metrics.topLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Links Mais Clicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <p className="text-sm truncate">{link.url}</p>
                  <Badge variant="secondary">{link.clicks} cliques</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
