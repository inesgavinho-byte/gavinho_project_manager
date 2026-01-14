import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Mail,
  Clock,
  Zap,
  X,
  RefreshCw,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Alert {
  id: number;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  affectedEmails: number;
  createdAt: Date;
  isResolved: boolean;
}

interface AlertsDashboardProps {
  projectId: number;
}

/**
 * Dashboard de Alertas Inteligentes
 */
export function AlertsDashboard({ projectId }: AlertsDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

  // Queries
  const { data: intelligentAlerts, refetch: refetchAlerts } = trpc.email.getIntelligentAlerts.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // Mutations
  const { mutate: detectAnomalies } = trpc.email.detectAnomalies.useMutation({
    onSuccess: () => {
      setIsDetecting(false);
      refetchAlerts();
    },
    onError: () => {
      setIsDetecting(false);
    },
  });

  const { mutate: markAsResolved } = trpc.email.markAlertAsResolved.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
  });

  useEffect(() => {
    if (intelligentAlerts) {
      setAlerts(intelligentAlerts);
    }
  }, [intelligentAlerts]);

  const handleDetectAnomalies = () => {
    setIsDetecting(true);
    detectAnomalies({ projectId });
  };

  const handleResolveAlert = (alertId: number) => {
    markAsResolved({ alertId });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'low':
        return <AlertCircle className="w-6 h-6 text-blue-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-600">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600">Médio</Badge>;
      case 'low':
        return <Badge className="bg-blue-600">Baixo</Badge>;
      default:
        return null;
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'high_rejection_rate':
        return <TrendingUp className="w-5 h-5" />;
      case 'domain_failure_pattern':
        return <Mail className="w-5 h-5" />;
      case 'sender_reputation_issue':
        return <AlertTriangle className="w-5 h-5" />;
      case 'unusual_volume':
        return <Zap className="w-5 h-5" />;
      case 'time_pattern_anomaly':
        return <Clock className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const unreadCount = alerts.filter((a) => !a.isResolved).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertas Críticos</p>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertas Não Lidos</p>
              <p className="text-3xl font-bold text-yellow-600">{unreadCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Confiança Média</p>
              <p className="text-3xl font-bold text-blue-600">
                {alerts.length > 0 ? (alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length).toFixed(0) : 0}
                %
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Botão de Detecção */}
      <Card className="p-4 border-2 border-dashed border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Detectar Anomalias com IA</h3>
            <p className="text-sm text-gray-600">Analise padrões de falha e gere alertas automáticos</p>
          </div>
          <Button
            onClick={handleDetectAnomalies}
            disabled={isDetecting}
            className="gap-2"
          >
            {isDetecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Detectando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Detectar Agora
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Nenhum Alerta Detectado</AlertTitle>
            <AlertDescription className="text-green-800">
              Seu histórico de emails está saudável. Clique em "Detectar Agora" para executar uma análise completa.
            </AlertDescription>
          </Alert>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border p-4 transition-all ${getSeverityColor(alert.severity)} ${
                alert.isResolved ? 'opacity-50' : ''
              }`}
            >
              <div className="space-y-3">
                {/* Header do Alerta */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {getAnomalyIcon(alert.anomalyType)}
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        </div>
                        {getSeverityBadge(alert.severity)}
                        {alert.isResolved && <Badge className="bg-green-600">Resolvido</Badge>}
                      </div>
                      <p className="text-sm text-gray-700">{alert.description}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={alert.isResolved}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Informações Adicionais */}
                <div className="flex items-center gap-4 text-sm text-gray-600 ml-9">
                  <span>Confiança: {alert.confidence}%</span>
                  <span>Emails Afetados: {alert.affectedEmails}</span>
                  <span>{new Date(alert.createdAt).toLocaleDateString('pt-PT')}</span>
                </div>

                {/* Recomendação (Expandível) */}
                <div className="ml-9">
                  <button
                    onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    {expandedAlert === alert.id ? 'Ocultar' : 'Ver'} Recomendação
                  </button>

                  {expandedAlert === alert.id && (
                    <div className="mt-2 p-3 bg-white bg-opacity-60 rounded border border-gray-300">
                      <p className="text-sm text-gray-800">
                        <strong>Recomendação:</strong> {alert.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Informações de Ajuda */}
      {alerts.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Dicas para Resolver Alertas</AlertTitle>
          <AlertDescription className="text-blue-800 space-y-2">
            <p>
              • <strong>Taxa Alta de Rejeição:</strong> Verifique configuração de autenticação SPF/DKIM/DMARC
            </p>
            <p>
              • <strong>Falhas por Domínio:</strong> Verifique se o domínio tem filtros rigorosos ou lista negra
            </p>
            <p>
              • <strong>Problemas de Reputação:</strong> Considere aquecimento de IP e verifique lista de supressão
            </p>
            <p>
              • <strong>Volume Anormal:</strong> Verifique se há campanhas não planeadas ou loops de envio
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
