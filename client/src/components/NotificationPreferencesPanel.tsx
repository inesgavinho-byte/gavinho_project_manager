import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";

interface NotificationPreference {
  id: number;
  userId: number;
  enabledSupplierEvaluated: number;
  enabledProjectStatusChanged: number;
  enabledProjectCompleted: number;
  enabledDeadlineAlert: number;
  enabledBudgetAlert: number;
  enabledOrderUpdate: number;
  enabledTaskAssigned: number;
  frequency: "immediate" | "daily" | "weekly";
  enableEmailNotifications: number;
  enablePushNotifications: number;
  enableInAppNotifications: number;
  createdAt: string;
  updatedAt: string;
}

export function NotificationPreferencesPanel() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getPreferences = trpc.notificationPreferences.get.useQuery();
  const updatePreferences = trpc.notificationPreferences.update.useMutation();
  const toggleNotificationType = trpc.notificationPreferences.toggleNotificationType.useMutation();
  const setFrequency = trpc.notificationPreferences.setFrequency.useMutation();
  const toggleChannel = trpc.notificationPreferences.toggleChannel.useMutation();
  const reset = trpc.notificationPreferences.reset.useMutation();

  useEffect(() => {
    if (getPreferences.data) {
      setPreferences(getPreferences.data);
      setIsLoading(false);
    }
  }, [getPreferences.data]);

  const handleToggleNotificationType = async (type: string, enabled: boolean) => {
    try {
      await toggleNotificationType.mutateAsync({
        notificationType: type,
        enabled,
      });
      toast({
        title: "Sucesso",
        description: "Preferência de notificação atualizada",
      });
      getPreferences.refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar preferência",
        variant: "destructive",
      });
    }
  };

  const handleSetFrequency = async (freq: "immediate" | "daily" | "weekly") => {
    try {
      await setFrequency.mutateAsync({ frequency: freq });
      toast({
        title: "Sucesso",
        description: "Frequência de notificações atualizada",
      });
      getPreferences.refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar frequência",
        variant: "destructive",
      });
    }
  };

  const handleToggleChannel = async (channel: "email" | "push" | "inApp", enabled: boolean) => {
    try {
      await toggleChannel.mutateAsync({
        channel,
        enabled,
      });
      toast({
        title: "Sucesso",
        description: "Canal de notificação atualizado",
      });
      getPreferences.refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar canal",
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    if (confirm("Tem certeza que deseja restaurar as preferências padrão?")) {
      try {
        await reset.mutateAsync();
        toast({
          title: "Sucesso",
          description: "Preferências restauradas para os valores padrão",
        });
        getPreferences.refetch();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao restaurar preferências",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading || !preferences) {
    return <div className="text-center text-muted-foreground">Carregando preferências...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Tipos</TabsTrigger>
          <TabsTrigger value="frequency">Frequência</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
        </TabsList>

        {/* Tab de Tipos de Notificações */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Notificações</CardTitle>
              <CardDescription>Escolha quais tipos de notificações deseja receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avaliação de Fornecedor */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Fornecedor Avaliado</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações quando um fornecedor recebe uma avaliação
                  </p>
                </div>
                <Switch
                  checked={preferences.enabledSupplierEvaluated === 1}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("supplier_evaluated", checked)
                  }
                />
              </div>

              {/* Status do Projeto */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Status do Projeto</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações quando o status de um projeto muda
                  </p>
                </div>
                <Switch
                  checked={preferences.enabledProjectStatusChanged === 1}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("project_status_changed", checked)
                  }
                />
              </div>

              {/* Projeto Concluído */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Projeto Concluído</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações quando um projeto é marcado como concluído
                  </p>
                </div>
                <Switch
                  checked={preferences.enabledProjectCompleted === 1}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("project_completed", checked)
                  }
                />
              </div>

              {/* Alerta de Prazo */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Alerta de Prazo</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre prazos próximos ou vencidos
                  </p>
                </div>
                <Switch
                  checked={preferences.enabledDeadlineAlert === 1}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("deadline_alert", checked)
                  }
                />
              </div>

              {/* Alerta de Orçamento */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Alerta de Orçamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações quando o orçamento é excedido
                  </p>
                </div>
                <Switch
                  checked={preferences.enabledBudgetAlert === 1}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("budget_alert", checked)
                  }
                />
              </div>

              {/* Atualização de Encomenda */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Atualização de Encomenda</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre atualizações de encomendas e entregas
                  </p>
                </div>
                <Switch
                  checked={preferences.enabledOrderUpdate === 1}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("order_update", checked)
                  }
                />
              </div>

              {/* Tarefa Atribuída */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Tarefa Atribuída</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações quando uma tarefa é atribuída a você
                  </p>
                </div>
                <Switch
                  checked={preferences.enabledTaskAssigned === 1}
                  onCheckedChange={(checked) =>
                    handleToggleNotificationType("task_assigned", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Frequência */}
        <TabsContent value="frequency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequência de Notificações</CardTitle>
              <CardDescription>
                Escolha com que frequência deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={preferences.frequency} onValueChange={handleSetFrequency as any}>
                <div className="flex items-center space-x-2 rounded-lg border p-4">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <div className="flex-1">
                    <Label htmlFor="immediate" className="text-base font-medium">
                      Imediato
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações assim que ocorrem
                    </p>
                  </div>
                  <Badge>Padrão</Badge>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border p-4">
                  <RadioGroupItem value="daily" id="daily" />
                  <div className="flex-1">
                    <Label htmlFor="daily" className="text-base font-medium">
                      Diário
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo diário de notificações
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border p-4">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <div className="flex-1">
                    <Label htmlFor="weekly" className="text-base font-medium">
                      Semanal
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo semanal de notificações
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Canais */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canais de Notificação</CardTitle>
              <CardDescription>Escolha por quais canais deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Notificações no App</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações dentro da aplicação
                  </p>
                </div>
                <Switch
                  checked={preferences.enableInAppNotifications === 1}
                  onCheckedChange={(checked) => handleToggleChannel("inApp", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações por email
                  </p>
                </div>
                <Switch
                  checked={preferences.enableEmailNotifications === 1}
                  onCheckedChange={(checked) => handleToggleChannel("email", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Label className="text-base font-medium">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações push no seu dispositivo
                  </p>
                </div>
                <Switch
                  checked={preferences.enablePushNotifications === 1}
                  onCheckedChange={(checked) => handleToggleChannel("push", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Reset */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleReset} disabled={reset.isPending}>
          {reset.isPending ? "Restaurando..." : "Restaurar Padrões"}
        </Button>
      </div>
    </div>
  );
}
