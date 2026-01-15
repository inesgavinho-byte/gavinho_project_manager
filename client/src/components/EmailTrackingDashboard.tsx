import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { trpc } from '@/lib/trpc';

interface EmailMetrics {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalDropped: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  uniqueOpens: number;
  uniqueClicks: number;
}

interface EmailEvent {
  id: string;
  messageId: string;
  email: string;
  eventType: string;
  timestamp: Date;
  url?: string;
  userAgent?: string;
  ip?: string;
}

const COLORS = ['#8b8670', '#adaa96', '#f2f0e7', '#d4d0c0', '#c0bbb0'];

export function EmailTrackingDashboard({ reportId }: { reportId: number }) {
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('open');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  // Buscar métricas do relatório
  const metricsQuery = trpc.emailTracking.getReportMetrics.useQuery({
    reportId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Buscar eventos por tipo
  const eventsQuery = trpc.emailTracking.getEventsByType.useQuery({
    eventType: selectedEventType as any,
    limit: 100,
  });

  useEffect(() => {
    if (metricsQuery.data?.data) {
      setMetrics(metricsQuery.data.data);
    }
  }, [metricsQuery.data]);

  useEffect(() => {
    if (eventsQuery.data?.data) {
      setEvents(eventsQuery.data.data);
    }
  }, [eventsQuery.data]);

  if (!metrics) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Carregando métricas de email...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Dados para gráfico de taxa de engajamento
  const engagementData = [
    {
      name: 'Taxa de Abertura',
      value: metrics.openRate.toFixed(2),
      fill: '#8b8670',
    },
    {
      name: 'Taxa de Clique',
      value: metrics.clickRate.toFixed(2),
      fill: '#adaa96',
    },
    {
      name: 'Taxa de Rejeição',
      value: metrics.bounceRate.toFixed(2),
      fill: '#d4d0c0',
    },
  ];

  // Dados para gráfico de eventos
  const eventData = [
    { name: 'Aberturas', value: metrics.totalOpens },
    { name: 'Cliques', value: metrics.totalClicks },
    { name: 'Rejeições', value: metrics.totalBounces },
    { name: 'Descartados', value: metrics.totalDropped },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Enviado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSent.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">emails</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Aberturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOpens.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{metrics.openRate.toFixed(1)}% de taxa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cliques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{metrics.clickRate.toFixed(1)}% de taxa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejeições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBounces.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{metrics.bounceRate.toFixed(1)}% de taxa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.uniqueOpens + metrics.uniqueClicks).toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">com engajamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Taxa de Engajamento</TabsTrigger>
          <TabsTrigger value="events">Distribuição de Eventos</TabsTrigger>
          <TabsTrigger value="timeline">Histórico de Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Engajamento (%)</CardTitle>
              <CardDescription>Percentual de abertura, clique e rejeição</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b8670" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Eventos</CardTitle>
              <CardDescription>Quantidade total de cada tipo de evento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8b8670"
                    dataKey="value"
                  >
                    {eventData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
              <CardDescription>Últimos 100 eventos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {['open', 'click', 'bounce', 'dropped', 'delivered'].map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedEventType(type)}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedEventType === type
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Tipo de Evento</th>
                        <th className="text-left py-2">Data/Hora</th>
                        <th className="text-left py-2">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.slice(0, 10).map(event => (
                        <tr key={event.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 truncate">{event.email}</td>
                          <td className="py-2">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {event.eventType}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 text-xs text-gray-500">{event.ip || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {events.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum evento registrado para este tipo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
