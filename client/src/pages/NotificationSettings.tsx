import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, Save, Loader2 } from "lucide-react";

export default function NotificationSettings() {
  const { data: preferences, isLoading } = trpc.notifications.getPreferences.useQuery();
  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferências atualizadas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar preferências: " + error.message);
    },
  });

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

  const handleToggle = (field: keyof typeof formData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] === 1 ? 0 : 1,
    }));
  };

  const handleNumberChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Configurações de Notificações
        </h1>
        <p className="text-muted-foreground mt-2">
          Personalize os tipos de alertas e notificações que deseja receber
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipos de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Alertas</CardTitle>
            <CardDescription>
              Ative ou desative tipos específicos de notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="aiAlerts">Alertas de IA</Label>
                <p className="text-sm text-muted-foreground">
                  Sugestões e insights gerados por inteligência artificial
                </p>
              </div>
              <Switch
                id="aiAlerts"
                checked={formData.aiAlerts === 1}
                onCheckedChange={() => handleToggle("aiAlerts")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deadlineWarnings">Avisos de Prazos</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações sobre prazos próximos de projetos e tarefas
                </p>
              </div>
              <Switch
                id="deadlineWarnings"
                checked={formData.deadlineWarnings === 1}
                onCheckedChange={() => handleToggle("deadlineWarnings")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="budgetAlerts">Alertas de Orçamento</Label>
                <p className="text-sm text-muted-foreground">
                  Avisos quando o orçamento atinge o limite definido
                </p>
              </div>
              <Switch
                id="budgetAlerts"
                checked={formData.budgetAlerts === 1}
                onCheckedChange={() => handleToggle("budgetAlerts")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="projectDelays">Atrasos de Projeto</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações sobre projetos com atrasos
                </p>
              </div>
              <Switch
                id="projectDelays"
                checked={formData.projectDelays === 1}
                onCheckedChange={() => handleToggle("projectDelays")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="taskOverdue">Tarefas Atrasadas</Label>
                <p className="text-sm text-muted-foreground">
                  Avisos sobre tarefas que passaram do prazo
                </p>
              </div>
              <Switch
                id="taskOverdue"
                checked={formData.taskOverdue === 1}
                onCheckedChange={() => handleToggle("taskOverdue")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="orderPending">Pedidos Pendentes</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações sobre pedidos aguardando aprovação
                </p>
              </div>
              <Switch
                id="orderPending"
                checked={formData.orderPending === 1}
                onCheckedChange={() => handleToggle("orderPending")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="systemNotifications">Notificações do Sistema</Label>
                <p className="text-sm text-muted-foreground">
                  Avisos gerais do sistema e atualizações
                </p>
              </div>
              <Switch
                id="systemNotifications"
                checked={formData.systemNotifications === 1}
                onCheckedChange={() => handleToggle("systemNotifications")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Avançadas</CardTitle>
            <CardDescription>
              Ajuste os parâmetros de quando receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deadlineWarningDays">
                Dias de Antecedência para Avisos de Prazo
              </Label>
              <Input
                id="deadlineWarningDays"
                type="number"
                min="1"
                max="30"
                value={formData.deadlineWarningDays}
                onChange={(e) => handleNumberChange("deadlineWarningDays", e.target.value)}
                disabled={formData.deadlineWarnings === 0}
              />
              <p className="text-sm text-muted-foreground">
                Receba avisos com {formData.deadlineWarningDays} dias de antecedência
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetThreshold">
                Limite de Orçamento para Alertas (%)
              </Label>
              <Input
                id="budgetThreshold"
                type="number"
                min="50"
                max="100"
                value={formData.budgetThreshold}
                onChange={(e) => handleNumberChange("budgetThreshold", e.target.value)}
                disabled={formData.budgetAlerts === 0}
              />
              <p className="text-sm text-muted-foreground">
                Receba alertas quando o orçamento atingir {formData.budgetThreshold}%
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Preferências
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
