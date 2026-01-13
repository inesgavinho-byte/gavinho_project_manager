import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  sent: '#94a3b8',
  delivered: '#22c55e',
  bounced: '#ef4444',
  failed: '#f97316',
  opened: '#3b82f6',
  clicked: '#8b5cf6',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  delivery: '#3b82f6',
  adjudication: '#f59e0b',
  payment: '#10b981',
};

export function EmailHistoryDashboard({ projectId }: { projectId?: string }) {
  const [filters, setFilters] = useState({
    eventType: undefined as string | undefined,
    status: undefined as string | undefined,
    recipientEmail: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Queries
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = trpc.emailHistory.getHistory.useQuery({
    projectId,
    eventType: filters.eventType as any,
    status: filters.status as any,
    recipientEmail: filters.recipientEmail || undefined,
    startDate: filters.startDate,
    endDate: filters.endDate,
    limit: 100,
  });

  const { data: statistics } = trpc.emailHistory.getStatistics.useQuery({ projectId });
  const { data: statsByEventType } = trpc.emailHistory.getStatisticsByEventType.useQuery({ projectId });
  const { data: statsByDate } = trpc.emailHistory.getStatisticsByDate.useQuery({ projectId, days: 30 });
  const { data: bounceReasons } = trpc.emailHistory.getBounceReasons.useQuery({ projectId });
  const { data: exportData, mutate: exportHistory } = trpc.emailHistory.exportHistory.useMutation();

  const handleExport = () => {
    exportHistory({
      projectId,
      eventType: filters.eventType as any,
      status: filters.status as any,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Evento</label>
              <select
                value={filters.eventType || ''}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value || undefined })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Todos</option>
                <option value="delivery">Entrega</option>
                <option value="adjudication">Adjudicação</option>
                <option value="payment">Pagamento</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Todos</option>
                <option value="sent">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="bounced">Rejeitado</option>
                <option value="failed">Falha</option>
                <option value="opened">Aberto</option>
                <option value="clicked">Clicado</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Email do Destinatário</label>
              <Input
                type="email"
                placeholder="Filtrar por email"
                value={filters.recipientEmail}
                onChange={(e) => setFilters({ ...filters, recipientEmail: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => refetchHistory()} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Enviado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalSent}</div>
              <p className="text-xs text-muted-foreground">emails enviados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.deliveryRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{statistics.totalDelivered} entregues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.bounceRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{statistics.totalBounced} rejeitados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.openRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{statistics.totalOpened} abertos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Abas */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="bounces">Rejeições</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico por Tipo de Evento */}
            {statsByEventType && statsByEventType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo de Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statsByEventType}
                        dataKey="totalSent"
                        nameKey="eventType"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {statsByEventType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EVENT_TYPE_COLORS[entry.eventType] || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Taxa de Entrega por Tipo */}
            {statsByEventType && statsByEventType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Entrega por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statsByEventType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="eventType" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="deliveryRate" fill="#22c55e" name="Taxa de Entrega (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tabela */}
        <TabsContent value="table">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Emails</CardTitle>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : history && history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-4">Email</th>
                        <th className="text-left py-2 px-4">Tipo</th>
                        <th className="text-left py-2 px-4">Assunto</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Enviado em</th>
                        <th className="text-left py-2 px-4">Entregue em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((email) => (
                        <tr key={email.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 text-xs">{email.recipientEmail}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline" className="text-xs">
                              {email.eventType}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-xs truncate max-w-xs">{email.subject}</td>
                          <td className="py-2 px-4">
                            <Badge
                              style={{ backgroundColor: STATUS_COLORS[email.status], color: 'white' }}
                              className="text-xs"
                            >
                              {email.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-xs">{email.sentAt?.toLocaleDateString()}</td>
                          <td className="py-2 px-4 text-xs">{email.deliveredAt?.toLocaleDateString() || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Nenhum email encontrado</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejeições */}
        <TabsContent value="bounces">
          <Card>
            <CardHeader>
              <CardTitle>Razões de Rejeição</CardTitle>
              <CardDescription>Análise dos emails rejeitados</CardDescription>
            </CardHeader>
            <CardContent>
              {bounceReasons && bounceReasons.length > 0 ? (
                <div className="space-y-2">
                  {bounceReasons.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">{reason.reason || 'Desconhecido'}</span>
                      <Badge variant="destructive">{reason.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Nenhuma rejeição registrada</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tendências */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendências (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {statsByDate && statsByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={statsByDate as any}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalSent" stroke="#94a3b8" name="Enviados" />
                    <Line type="monotone" dataKey="totalDelivered" stroke="#22c55e" name="Entregues" />
                    <Line type="monotone" dataKey="totalBounced" stroke="#ef4444" name="Rejeitados" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Sem dados disponíveis</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
