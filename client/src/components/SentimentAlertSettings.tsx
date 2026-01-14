import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface SentimentAlertSettingsProps {
  onSave?: (settings: AlertSettings) => void;
  defaultSettings?: AlertSettings;
}

export interface AlertSettings {
  negativeThreshold: number; // 0-100
  persistenceDays: number; // 1-30
  minEmailsRequired: number; // 1-20
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  alertSeverity: 'all' | 'medium' | 'high' | 'critical';
}

const DEFAULT_SETTINGS: AlertSettings = {
  negativeThreshold: 40,
  persistenceDays: 7,
  minEmailsRequired: 3,
  enableNotifications: true,
  enableEmailAlerts: true,
  alertSeverity: 'medium',
};

export function SentimentAlertSettings({
  onSave,
  defaultSettings = DEFAULT_SETTINGS,
}: SentimentAlertSettingsProps) {
  const [settings, setSettings] = useState<AlertSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Salvar em localStorage
      localStorage.setItem('sentimentAlertSettings', JSON.stringify(settings));
      onSave?.(settings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração de Alertas de Sentimento
          </CardTitle>
          <CardDescription>
            Ajuste os limiares para detectar contatos com sentimento consistentemente negativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Limiar de Sentimento Negativo */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Limiar de Sentimento Negativo
              </label>
              <span className="text-lg font-semibold text-red-600">
                {settings.negativeThreshold}%
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Emails com sentimento abaixo deste valor são considerados negativos
            </p>
            <Slider
              value={[settings.negativeThreshold]}
              onValueChange={(value) =>
                setSettings({ ...settings, negativeThreshold: value[0] })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Muito Positivo (100%)</span>
              <span>Muito Negativo (0%)</span>
            </div>
          </div>

          {/* Dias de Persistência */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Período de Análise
              </label>
              <span className="text-lg font-semibold text-blue-600">
                {settings.persistenceDays} dias
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Número de dias anteriores para analisar sentimento consistente
            </p>
            <Slider
              value={[settings.persistenceDays]}
              onValueChange={(value) =>
                setSettings({ ...settings, persistenceDays: value[0] })
              }
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1 dia</span>
              <span>30 dias</span>
            </div>
          </div>

          {/* Número Mínimo de Emails */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Número Mínimo de Emails
              </label>
              <span className="text-lg font-semibold text-green-600">
                {settings.minEmailsRequired} emails
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Número mínimo de emails para considerar alerta válido
            </p>
            <Slider
              value={[settings.minEmailsRequired]}
              onValueChange={(value) =>
                setSettings({ ...settings, minEmailsRequired: value[0] })
              }
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1 email</span>
              <span>20 emails</span>
            </div>
          </div>

          {/* Severidade de Alerta */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Mostrar Alertas de Severidade</label>
            <div className="grid grid-cols-2 gap-2">
              {(['all', 'medium', 'high', 'critical'] as const).map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSettings({ ...settings, alertSeverity: severity })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.alertSeverity === severity
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {severity === 'all' && 'Todos'}
                  {severity === 'medium' && 'Médio+'}
                  {severity === 'high' && 'Alto+'}
                  {severity === 'critical' && 'Crítico'}
                </button>
              ))}
            </div>
          </div>

          {/* Notificações */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold">Preferências de Notificação</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Notificações em Tempo Real</label>
                <p className="text-xs text-gray-500">
                  Receber notificações quando alerta é criado
                </p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Alertas por Email</label>
                <p className="text-xs text-gray-500">
                  Enviar resumo diário de alertas por email
                </p>
              </div>
              <Switch
                checked={settings.enableEmailAlerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableEmailAlerts: checked })
                }
              />
            </div>
          </div>

          {/* Preview de Configuração */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Exemplo de Alerta</p>
                <p className="text-xs mt-1">
                  Um contato com sentimento médio de {settings.negativeThreshold}% ou menos
                  nos últimos {settings.persistenceDays} dias (com pelo menos{' '}
                  {settings.minEmailsRequired} emails) gerará um alerta de severidade{' '}
                  <strong>{settings.alertSeverity}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              variant="outline"
              className="flex-1"
            >
              Restaurar Padrões
            </Button>
          </div>

          {/* Confirmação de Sucesso */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-900 hidden">
            <CheckCircle className="w-4 h-4" />
            Configurações salvas com sucesso
          </div>
        </CardContent>
      </Card>

      {/* Dicas de Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dicas de Configuração</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-gray-600">
          <div>
            <p className="font-medium text-gray-900">Limiares Recomendados:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>
                <strong>Conservador:</strong> 50% negativo, 14 dias, 5+ emails (menos falsos
                positivos)
              </li>
              <li>
                <strong>Moderado:</strong> 40% negativo, 7 dias, 3+ emails (equilíbrio)
              </li>
              <li>
                <strong>Agressivo:</strong> 30% negativo, 3 dias, 2+ emails (máxima sensibilidade)
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-900">Interpretação de Severidade:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>
                <strong>Crítico:</strong> Sentimento &lt; 20% - Ação imediata necessária
              </li>
              <li>
                <strong>Alto:</strong> Sentimento 20-30% - Contactar em 24h
              </li>
              <li>
                <strong>Médio:</strong> Sentimento 30-40% - Follow-up amigável
              </li>
              <li>
                <strong>Baixo:</strong> Sentimento 40%+ - Monitorar
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
