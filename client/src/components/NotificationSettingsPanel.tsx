import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  criticalOnly: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
  mutedKeywords: string[];
}

interface NotificationSettingsPanelProps {
  onSave?: (settings: NotificationSettings) => Promise<void>;
  initialSettings?: NotificationSettings;
  isLoading?: boolean;
}

export function NotificationSettingsPanel({
  onSave,
  initialSettings,
  isLoading = false,
}: NotificationSettingsPanelProps) {
  const [settings, setSettings] = useState<NotificationSettings>(
    initialSettings || {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      criticalOnly: false,
      notificationFrequency: 'instant',
      timezone: 'Europe/Lisbon',
      mutedKeywords: [],
    }
  );

  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectChange = (
    key: keyof NotificationSettings,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTimeChange = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setSettings((prev) => ({
        ...prev,
        mutedKeywords: [...(prev.mutedKeywords || []), newKeyword.trim()],
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSettings((prev) => ({
      ...prev,
      mutedKeywords: (prev.mutedKeywords || []).filter((k) => k !== keyword),
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setErrorMessage('');

      if (onSave) {
        await onSave(settings);
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao salvar configurações'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="timing">Horários</TabsTrigger>
          <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
        </TabsList>

        {/* Aba de Canais */}
        <TabsContent value="channels" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-4">Canais de Notificação</h3>

            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium text-sm">Email</Label>
                  <p className="text-xs text-gray-500">
                    Receber notificações por email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Push */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium text-sm">Notificações Push</Label>
                  <p className="text-xs text-gray-500">
                    Receber notificações no navegador
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={() => handleToggle('pushNotifications')}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* SMS */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium text-sm">SMS</Label>
                  <p className="text-xs text-gray-500">
                    Receber notificações por SMS (apenas críticas)
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={() => handleToggle('smsNotifications')}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* In-app */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium text-sm">Notificações In-app</Label>
                  <p className="text-xs text-gray-500">
                    Receber notificações dentro da aplicação
                  </p>
                </div>
                <Switch
                  checked={settings.inAppNotifications}
                  onCheckedChange={() => handleToggle('inAppNotifications')}
                  disabled={isLoading || isSaving}
                />
              </div>
            </div>
          </Card>

          {/* Opções Gerais */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-4">Opções Gerais</h3>

            <div className="space-y-4">
              {/* Apenas Críticas */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-medium text-sm">Apenas Críticas</Label>
                  <p className="text-xs text-gray-500">
                    Receber apenas notificações críticas
                  </p>
                </div>
                <Switch
                  checked={settings.criticalOnly}
                  onCheckedChange={() => handleToggle('criticalOnly')}
                  disabled={isLoading || isSaving}
                />
              </div>

              {/* Frequência */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Frequência</Label>
                <Select
                  value={settings.notificationFrequency}
                  onValueChange={(value) =>
                    handleSelectChange(
                      'notificationFrequency',
                      value as 'instant' | 'daily' | 'weekly'
                    )
                  }
                  disabled={isLoading || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instantânea</SelectItem>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="font-medium text-sm">Fuso Horário</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    handleSelectChange('timezone', value)
                  }
                  disabled={isLoading || isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Lisbon">
                      Portugal (WET/WEST)
                    </SelectItem>
                    <SelectItem value="Europe/London">
                      Reino Unido (GMT/BST)
                    </SelectItem>
                    <SelectItem value="Europe/Paris">
                      Europa Central (CET/CEST)
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      Nova Iorque (EST/EDT)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Los Angeles (PST/PDT)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Aba de Horários */}
        <TabsContent value="timing" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-4">Horas Silenciosas</h3>
            <p className="text-xs text-gray-500 mb-4">
              Defina o período em que não deseja receber notificações (exceto críticas)
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Início</Label>
                  <Input
                    type="time"
                    value={settings.quietHoursStart || '22:00'}
                    onChange={(e) =>
                      handleTimeChange('quietHoursStart', e.target.value)
                    }
                    disabled={isLoading || isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Fim</Label>
                  <Input
                    type="time"
                    value={settings.quietHoursEnd || '08:00'}
                    onChange={(e) =>
                      handleTimeChange('quietHoursEnd', e.target.value)
                    }
                    disabled={isLoading || isSaving}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  ℹ️ Notificações críticas serão entregues mesmo durante as horas
                  silenciosas
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Aba de Palavras-chave */}
        <TabsContent value="keywords" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-4">Palavras-chave Silenciadas</h3>
            <p className="text-xs text-gray-500 mb-4">
              Notificações contendo estas palavras serão silenciadas
            </p>

            <div className="space-y-4">
              {/* Input para nova palavra-chave */}
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar palavra-chave..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddKeyword();
                    }
                  }}
                  disabled={isLoading || isSaving}
                />
                <Button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || isLoading || isSaving}
                  size="sm"
                >
                  Adicionar
                </Button>
              </div>

              {/* Lista de palavras-chave */}
              <ScrollArea className="h-40 border rounded-lg p-3">
                {settings.mutedKeywords && settings.mutedKeywords.length > 0 ? (
                  <div className="space-y-2">
                    {settings.mutedKeywords.map((keyword) => (
                      <div
                        key={keyword}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <span className="text-sm">{keyword}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveKeyword(keyword)}
                          disabled={isLoading || isSaving}
                          className="h-6 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Nenhuma palavra-chave silenciada
                  </p>
                )}
              </ScrollArea>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status e Ações */}
      <div className="space-y-3">
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800">
              Configurações salvas com sucesso
            </p>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="w-full bg-[#8b8670] hover:bg-[#7a7667]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
