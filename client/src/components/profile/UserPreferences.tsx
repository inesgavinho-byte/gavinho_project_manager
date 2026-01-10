import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Bell, Palette } from "lucide-react";
import type { UserPreferences as UserPreferencesType } from "@shared/types";

interface UserPreferencesProps {
  preferences: UserPreferencesType | null | undefined;
  loading?: boolean;
  onPasswordChange?: () => void;
}

export function UserPreferences({
  preferences,
  loading,
  onPasswordChange,
}: UserPreferencesProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    emailNotifications: preferences?.emailNotifications || 1,
    pushNotifications: preferences?.pushNotifications || 1,
    notificationFrequency: preferences?.notificationFrequency || "realtime",
    theme: preferences?.theme || "light",
    language: preferences?.language || "pt",
    timezone: preferences?.timezone || "Europe/Lisbon",
    dateFormat: preferences?.dateFormat || "DD/MM/YYYY",
    defaultView: preferences?.defaultView || "dashboard",
    showCompletedProjects: preferences?.showCompletedProjects || 1,
    projectsPerPage: preferences?.projectsPerPage || 12,
  });

  const updatePreferencesMutation = trpc.userProfile.updatePreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Preferências guardadas",
        description: "As suas preferências foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao guardar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Preferências não encontradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-sand" />
            Notificações
          </CardTitle>
          <CardDescription>
            Controle como e quando recebe notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notif">Notificações por Email</Label>
            <Switch
              id="email-notif"
              checked={formData.emailNotifications === 1}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  emailNotifications: checked ? 1 : 0,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-notif">Notificações Push</Label>
            <Switch
              id="push-notif"
              checked={formData.pushNotifications === 1}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  pushNotifications: checked ? 1 : 0,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notif-freq">Frequência de Notificações</Label>
            <Select
              value={formData.notificationFrequency}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  notificationFrequency: value as any,
                }))
              }
            >
              <SelectTrigger id="notif-freq">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Em Tempo Real</SelectItem>
                <SelectItem value="hourly">A Cada Hora</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-sand" />
            Apresentação
          </CardTitle>
          <CardDescription>
            Personalize a aparência da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  theme: value as any,
                }))
              }
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="auto">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select
              value={formData.language}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  language: value,
                }))
              }
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  timezone: value,
                }))
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Lisbon">Lisboa (WET/WEST)</SelectItem>
                <SelectItem value="Europe/London">Londres (GMT/BST)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-format">Formato de Data</Label>
            <Select
              value={formData.dateFormat}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  dateFormat: value,
                }))
              }
            >
              <SelectTrigger id="date-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Configure as preferências do seu dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-view">Vista Padrão</Label>
            <Select
              value={formData.defaultView}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  defaultView: value,
                }))
              }
            >
              <SelectTrigger id="default-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="projects">Projetos</SelectItem>
                <SelectItem value="tasks">Tarefas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-completed">Mostrar Projetos Concluídos</Label>
            <Switch
              id="show-completed"
              checked={formData.showCompletedProjects === 1}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  showCompletedProjects: checked ? 1 : 0,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projects-per-page">Projetos por Página</Label>
            <Select
              value={String(formData.projectsPerPage)}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  projectsPerPage: parseInt(value),
                }))
              }
            >
              <SelectTrigger id="projects-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-sand" />
            Segurança
          </CardTitle>
          <CardDescription>
            Gerir a segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={onPasswordChange}
            className="border-brown/20 text-brown hover:bg-brown/5"
          >
            <Lock className="h-4 w-4 mr-2" />
            Alterar Password
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 justify-end">
        <Button
          className="bg-brown hover:bg-brown/90"
          onClick={handleSave}
          disabled={updatePreferencesMutation.isPending}
        >
          {updatePreferencesMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Guardar Preferências
        </Button>
      </div>
    </div>
  );
}
