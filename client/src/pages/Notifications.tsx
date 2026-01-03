import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Clock,
  Settings,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const typeIcons = {
  ai_alert: AlertTriangle,
  deadline_warning: Calendar,
  budget_exceeded: DollarSign,
  project_delayed: Clock,
  task_overdue: Clock,
  order_pending: Bell,
  system: Bell,
};

const typeLabels = {
  ai_alert: "Alerta de IA",
  deadline_warning: "Aviso de Prazo",
  budget_exceeded: "Orçamento Excedido",
  project_delayed: "Projeto Atrasado",
  task_overdue: "Tarefa Atrasada",
  order_pending: "Encomenda Pendente",
  system: "Sistema",
};

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "settings">("unread");

  const { data: allNotifications = [], refetch: refetchAll } = trpc.notifications.list.useQuery(
    { unreadOnly: false },
    { enabled: activeTab === "all" }
  );

  const { data: unreadNotifications = [], refetch: refetchUnread } = trpc.notifications.list.useQuery(
    { unreadOnly: true },
    { enabled: activeTab === "unread" }
  );

  const { data: unreadCount = 0, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery();

  const { data: preferences, refetch: refetchPreferences } = trpc.notifications.getPreferences.useQuery();

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchAll();
      refetchUnread();
      refetchCount();
      toast.success("Notificação marcada como lida");
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchAll();
      refetchUnread();
      refetchCount();
      toast.success("Todas as notificações marcadas como lidas");
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetchAll();
      refetchUnread();
      refetchCount();
      toast.success("Notificação excluída");
    },
  });

  const runChecksMutation = trpc.notifications.runChecks.useMutation({
    onSuccess: () => {
      refetchAll();
      refetchUnread();
      refetchCount();
      toast.success("Verificação de notificações concluída");
    },
  });

  const updatePreferencesMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      refetchPreferences();
      toast.success("Preferências atualizadas");
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (notification.link) {
      setLocation(notification.link);
    }
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }
  };

  const handleTogglePreference = (field: string, value: boolean) => {
    updatePreferencesMutation.mutate({ [field]: value ? 1 : 0 });
  };

  const handleUpdateThreshold = (field: string, value: number) => {
    updatePreferencesMutation.mutate({ [field]: value });
  };

  const notifications = activeTab === "unread" ? unreadNotifications : allNotifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notificações
            {unreadCount > 0 && (
              <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie alertas, prazos e notificações do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => runChecksMutation.mutate()}
            disabled={runChecksMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${runChecksMutation.isPending ? "animate-spin" : ""}`} />
            Verificar Agora
          </Button>
          {unreadCount > 0 && (
            <Button onClick={() => markAllAsReadMutation.mutate()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="unread">
            <BellOff className="h-4 w-4 mr-2" />
            Não Lidas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            <Bell className="h-4 w-4 mr-2" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4 mt-6">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <BellOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma notificação não lida</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification: any) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
              return (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${priorityColors[notification.priority as keyof typeof priorityColors]}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {typeLabels[notification.type as keyof typeof typeLabels]}
                              </span>
                              <span>{new Date(notification.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate({ id: notification.id });
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate({ id: notification.id });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma notificação</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification: any) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
              return (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${priorityColors[notification.priority as keyof typeof priorityColors]}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {typeLabels[notification.type as keyof typeof typeLabels]}
                              </span>
                              <span>{new Date(notification.createdAt).toLocaleString()}</span>
                              {notification.isRead && notification.readAt && (
                                <span className="text-green-600">
                                  ✓ Lida em {new Date(notification.readAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate({ id: notification.id });
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate({ id: notification.id });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure quais tipos de notificações você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="aiAlerts" className="text-base font-medium">
                      Alertas de IA
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receber sugestões e alertas críticos da análise de IA
                    </p>
                  </div>
                  <Switch
                    id="aiAlerts"
                    checked={preferences?.aiAlerts === 1}
                    onCheckedChange={(checked) => handleTogglePreference("aiAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="deadlineWarnings" className="text-base font-medium">
                      Avisos de Prazo
                    </Label>
                    <p className="text-sm text-gray-600">
                      Alertas quando prazos de projetos e tarefas estão próximos
                    </p>
                  </div>
                  <Switch
                    id="deadlineWarnings"
                    checked={preferences?.deadlineWarnings === 1}
                    onCheckedChange={(checked) => handleTogglePreference("deadlineWarnings", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="budgetAlerts" className="text-base font-medium">
                      Alertas de Orçamento
                    </Label>
                    <p className="text-sm text-gray-600">
                      Notificações quando orçamentos estão próximos do limite
                    </p>
                  </div>
                  <Switch
                    id="budgetAlerts"
                    checked={preferences?.budgetAlerts === 1}
                    onCheckedChange={(checked) => handleTogglePreference("budgetAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="projectDelays" className="text-base font-medium">
                      Projetos Atrasados
                    </Label>
                    <p className="text-sm text-gray-600">
                      Alertas quando projetos ultrapassam o prazo
                    </p>
                  </div>
                  <Switch
                    id="projectDelays"
                    checked={preferences?.projectDelays === 1}
                    onCheckedChange={(checked) => handleTogglePreference("projectDelays", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="taskOverdue" className="text-base font-medium">
                      Tarefas Atrasadas
                    </Label>
                    <p className="text-sm text-gray-600">
                      Notificações de tarefas que ultrapassaram o prazo
                    </p>
                  </div>
                  <Switch
                    id="taskOverdue"
                    checked={preferences?.taskOverdue === 1}
                    onCheckedChange={(checked) => handleTogglePreference("taskOverdue", checked)}
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Configurações Avançadas</h3>

                <div className="space-y-2">
                  <Label htmlFor="deadlineWarningDays">
                    Dias de Antecedência para Avisos de Prazo
                  </Label>
                  <Input
                    id="deadlineWarningDays"
                    type="number"
                    min="1"
                    max="30"
                    value={preferences?.deadlineWarningDays || 7}
                    onChange={(e) =>
                      handleUpdateThreshold("deadlineWarningDays", parseInt(e.target.value))
                    }
                    className="w-32"
                  />
                  <p className="text-sm text-gray-600">
                    Receber avisos quando faltarem X dias para o prazo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetThreshold">Limite de Orçamento (%)</Label>
                  <Input
                    id="budgetThreshold"
                    type="number"
                    min="50"
                    max="100"
                    value={preferences?.budgetThreshold || 90}
                    onChange={(e) =>
                      handleUpdateThreshold("budgetThreshold", parseInt(e.target.value))
                    }
                    className="w-32"
                  />
                  <p className="text-sm text-gray-600">
                    Receber alertas quando o orçamento atingir X% do total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
