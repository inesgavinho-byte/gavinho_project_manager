import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bell, Save, RotateCcw, AlertTriangle, Calendar, DollarSign, Clock, Package, Settings } from "lucide-react";

export default function NotificationPreferences() {
  const { toast } = useToast();
  const { data: preferences, isLoading, refetch } = trpc.notifications.getPreferences.useQuery();
  const updateMutation = trpc.notifications.updatePreferences.useMutation();

  // Local state for form
  const [formData, setFormData] = useState({
    aiAlerts: 1,
    deadlineWarnings: 1,
    budgetAlerts: 1,
    projectDelays: 1,
    taskOverdue: 1,
    orderPending: 1,
    systemNotifications: 1,
    deadlineWarningDays: 7,
    budgetThreshold: 90,
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        aiAlerts: preferences.aiAlerts,
        deadlineWarnings: preferences.deadlineWarnings,
        budgetAlerts: preferences.budgetAlerts,
        projectDelays: preferences.projectDelays,
        taskOverdue: preferences.taskOverdue,
        orderPending: preferences.orderPending,
        systemNotifications: preferences.systemNotifications,
        deadlineWarningDays: preferences.deadlineWarningDays,
        budgetThreshold: preferences.budgetThreshold,
      });
    }
  }, [preferences]);

  const handleToggle = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field as keyof typeof prev] === 1 ? 0 : 1,
    }));
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      await refetch();
      toast({
        title: "Preferências guardadas",
        description: "As suas preferências de notificações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao guardar",
        description: "Não foi possível guardar as preferências. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setFormData({
      aiAlerts: 1,
      deadlineWarnings: 1,
      budgetAlerts: 1,
      projectDelays: 1,
      taskOverdue: 1,
      orderPending: 1,
      systemNotifications: 1,
      deadlineWarningDays: 7,
      budgetThreshold: 90,
    });
    toast({
      title: "Preferências restauradas",
      description: "As preferências foram restauradas para os valores padrão. Clique em Guardar para aplicar.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">A carregar preferências...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Preferências de Notificações</h1>
          <p className="text-muted-foreground">
            Configure quais tipos de alertas deseja receber e personalize os thresholds
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={updateMutation.isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </div>
      </div>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tipos de Notificações
          </CardTitle>
          <CardDescription>
            Ative ou desative tipos específicos de notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="aiAlerts" className="text-base font-medium">
                  Sugestões IA
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas e sugestões geradas por inteligência artificial
                </p>
              </div>
            </div>
            <Switch
              id="aiAlerts"
              checked={formData.aiAlerts === 1}
              onCheckedChange={() => handleToggle("aiAlerts")}
            />
          </div>

          {/* Deadline Warnings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="deadlineWarnings" className="text-base font-medium">
                  Avisos de Prazos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notificações quando projetos se aproximam de deadlines
                </p>
              </div>
            </div>
            <Switch
              id="deadlineWarnings"
              checked={formData.deadlineWarnings === 1}
              onCheckedChange={() => handleToggle("deadlineWarnings")}
            />
          </div>

          {/* Budget Alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="budgetAlerts" className="text-base font-medium">
                  Alertas de Orçamento
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notificações quando orçamento atinge thresholds críticos
                </p>
              </div>
            </div>
            <Switch
              id="budgetAlerts"
              checked={formData.budgetAlerts === 1}
              onCheckedChange={() => handleToggle("budgetAlerts")}
            />
          </div>

          {/* Project Delays */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="projectDelays" className="text-base font-medium">
                  Atrasos de Projetos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas quando projetos estão atrasados em relação ao planeado
                </p>
              </div>
            </div>
            <Switch
              id="projectDelays"
              checked={formData.projectDelays === 1}
              onCheckedChange={() => handleToggle("projectDelays")}
            />
          </div>

          {/* Task Overdue */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="taskOverdue" className="text-base font-medium">
                  Tarefas Atrasadas
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notificações de tarefas que ultrapassaram o prazo
                </p>
              </div>
            </div>
            <Switch
              id="taskOverdue"
              checked={formData.taskOverdue === 1}
              onCheckedChange={() => handleToggle("taskOverdue")}
            />
          </div>

          {/* Order Pending */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="orderPending" className="text-base font-medium">
                  Encomendas Pendentes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas de encomendas que requerem atenção
                </p>
              </div>
            </div>
            <Switch
              id="orderPending"
              checked={formData.orderPending === 1}
              onCheckedChange={() => handleToggle("orderPending")}
            />
          </div>

          {/* System Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="systemNotifications" className="text-base font-medium">
                  Notificações do Sistema
                </Label>
                <p className="text-sm text-muted-foreground">
                  Atualizações e avisos importantes do sistema
                </p>
              </div>
            </div>
            <Switch
              id="systemNotifications"
              checked={formData.systemNotifications === 1}
              onCheckedChange={() => handleToggle("systemNotifications")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Thresholds Personalizados</CardTitle>
          <CardDescription>
            Defina quando deseja ser notificado com base em valores específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deadline Warning Days */}
          <div className="space-y-2">
            <Label htmlFor="deadlineWarningDays" className="text-base font-medium">
              Dias de Aviso de Prazo
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Número de dias antes do deadline para receber avisos (padrão: 7 dias)
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="deadlineWarningDays"
                type="number"
                min="1"
                max="90"
                value={formData.deadlineWarningDays}
                onChange={(e) => handleNumberChange("deadlineWarningDays", e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valores comuns: 7 dias (1 semana), 14 dias (2 semanas), 30 dias (1 mês)
            </p>
          </div>

          {/* Budget Threshold */}
          <div className="space-y-2">
            <Label htmlFor="budgetThreshold" className="text-base font-medium">
              Threshold de Orçamento
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Percentagem do orçamento utilizado para receber alertas (padrão: 90%)
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="budgetThreshold"
                type="number"
                min="50"
                max="100"
                value={formData.budgetThreshold}
                onChange={(e) => handleNumberChange("budgetThreshold", e.target.value)}
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valores comuns: 75% (alerta precoce), 90% (alerta padrão), 95% (alerta crítico)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Como funcionam as notificações?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                As notificações são verificadas automaticamente pelo sistema. Quando desativa um tipo de notificação,
                deixará de receber alertas dessa categoria. Os thresholds personalizados permitem ajustar quando
                deseja ser notificado com base nas suas preferências de gestão.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
