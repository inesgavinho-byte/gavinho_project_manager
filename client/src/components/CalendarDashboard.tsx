import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  Trophy,
  DollarSign,
  Bell,
  RefreshCw,
} from 'lucide-react';
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
import { toast } from 'sonner';

interface CalendarEvent {
  id: number;
  projectId: number;
  eventType: 'delivery' | 'adjudication' | 'payment' | 'other';
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  createdAt: Date;
}

interface CalendarAlert {
  id: number;
  projectId: number;
  alertType: 'one_day_before' | 'one_hour_before';
  alertDate: Date;
  message: string;
  isRead: number;
  createdAt: Date;
}

export function CalendarDashboard({ projectId }: { projectId?: number }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = trpc.calendar.getCalendarEvents.useQuery({
    projectId,
    startDate: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1),
    endDate: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0),
  });

  const { data: alerts, refetch: refetchAlerts } = trpc.calendar.getPendingAlerts.useQuery();

  const { data: stats } = trpc.calendar.getCalendarStats.useQuery({ projectId });

  const syncMutation = trpc.calendar.syncToOutlook.useMutation({
    onSuccess: () => {
      toast.success('Calendário sincronizado com Outlook!');
      refetchEvents();
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });

  const markAlertAsReadMutation = trpc.calendar.markAlertAsRead.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const deleteEventMutation = trpc.calendar.deleteCalendarEvent.useMutation({
    onSuccess: () => {
      toast.success('Evento deletado');
      refetchEvents();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const COLORS = ['#8b8670', '#adaa96', '#f2f0e7', '#e5e3d9'];

  const eventTypeIcons: Record<string, React.ReactNode> = {
    delivery: <Truck className="h-4 w-4" />,
    adjudication: <Trophy className="h-4 w-4" />,
    payment: <DollarSign className="h-4 w-4" />,
    other: <Calendar className="h-4 w-4" />,
  };

  const eventTypeColors: Record<string, string> = {
    delivery: 'bg-blue-100 text-blue-800',
    adjudication: 'bg-purple-100 text-purple-800',
    payment: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  };

  // Preparar dados para gráficos
  const chartData = stats
    ? [
        { name: 'Entregas', value: stats.eventsByType.delivery || 0 },
        { name: 'Adjudicações', value: stats.eventsByType.adjudication || 0 },
        { name: 'Pagamentos', value: stats.eventsByType.payment || 0 },
        { name: 'Outros', value: stats.eventsByType.other || 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Calendário de Projetos
        </h1>
        <p className="text-muted-foreground mt-1">
          Sincronize eventos com Outlook Calendar e receba alertas automáticos
        </p>
      </div>

      {/* Alertas Pendentes */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.id} className="border-yellow-200 bg-yellow-50">
              <Bell className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.alertDate).toLocaleString('pt-PT')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAlertAsReadMutation.mutate({ alertId: alert.id })}
                >
                  Marcar como lido
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">{stats.upcomingEvents} próximos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">Ação necessária</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eventsByType.delivery || 0}</div>
              <p className="text-xs text-muted-foreground">Agendadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sincronização</CardTitle>
              <RefreshCw className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => syncMutation.mutate({ projectId })}
                disabled={syncMutation.isPending}
                size="sm"
                className="w-full"
              >
                {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs com Gráficos e Eventos */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Eventos</CardTitle>
              <CardDescription>Eventos por tipo de atividade</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-4">Gráfico de Pizza</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-4">Gráfico de Barras</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b8670" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum evento agendado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Eventos */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Eventos do Calendário</CardTitle>
              <CardDescription>
                {selectedMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events && events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded ${eventTypeColors[event.eventType]}`}>
                            {eventTypeIcons[event.eventType]}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(event.startDate).toLocaleString('pt-PT')}
                              </span>
                              {event.location && <span>📍 {event.location}</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteEventMutation.mutate({ eventId: event.id })}
                          disabled={deleteEventMutation.isPending}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum evento neste mês</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas do Calendário</CardTitle>
              <CardDescription>Lembretes automáticos para eventos próximos</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts && alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {alert.isRead === 0 ? (
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.alertDate).toLocaleString('pt-PT')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={alert.isRead === 0 ? 'default' : 'secondary'}>
                        {alert.isRead === 0 ? 'Pendente' : 'Lido'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum alerta pendente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
