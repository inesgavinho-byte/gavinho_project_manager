'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Zap, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alert {
  id: string;
  actionType: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestedAction: string;
  createdAt: Date;
  resolvedAt?: Date;
  escalationLevel?: 'manager' | 'director' | 'admin';
}

export function AnomalyAlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const { data: recentAlerts, isLoading } = trpc.anomalyAlerts.getRecentAlerts.useQuery(
    { limit: 20 },
    { staleTime: 2 * 60 * 1000 }
  );

  const { data: statistics } = trpc.anomalyAlerts.getAlertStatistics.useQuery(
    { timeWindowDays: 7 },
    { staleTime: 5 * 60 * 1000 }
  );

  const escalateAlertMutation = trpc.anomalyAlerts.escalateAlert.useMutation();
  const resolveAlertMutation = trpc.anomalyAlerts.resolveAlert.useMutation();

  useEffect(() => {
    if (recentAlerts?.alerts) {
      setAlerts(recentAlerts.alerts);
    }
  }, [recentAlerts]);

  const filteredAlerts = alerts.filter(
    (alert) => filterSeverity === 'all' || alert.severity === filterSeverity
  );

  const unreadCount = alerts.filter((a) => !a.resolvedAt).length;
  const criticalCount = alerts.filter((a) => a.severity === 'high' && !a.resolvedAt).length;

  const handleEscalate = async (alertId: string, level: 'manager' | 'director' | 'admin') => {
    try {
      await escalateAlertMutation.mutateAsync({
        alertId,
        escalationLevel: level,
      });
      // Atualizar UI
    } catch (error) {
      console.error('Erro ao escalar alerta:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlertMutation.mutateAsync({
        alertId,
      });
      // Remover do painel
      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <Zap className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta Crítico */}
      {criticalCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalCount} alerta(s) crítica(s)</strong> requer(em) ação imediata. Verifique os
            detalhes abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alertas Não Lidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unreadCount}</div>
            <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{statistics?.criticalAlerts || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statistics?.totalAlerts ? Math.round((statistics.resolvedAlerts / statistics.totalAlerts) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Alertas resolvidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics?.averageResolutionTime || 0}h</div>
            <p className="text-xs text-gray-500 mt-1">Para resolver</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['all', 'high', 'medium', 'low'].map((severity) => (
          <Button
            key={severity}
            variant={filterSeverity === severity ? 'default' : 'outline'}
            onClick={() => setFilterSeverity(severity as any)}
            className="text-sm"
          >
            {severity === 'all' ? 'Todos' : severity === 'high' ? 'Críticos' : severity === 'medium' ? 'Médios' : 'Baixos'}
          </Button>
        ))}
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum alerta para exibir</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-l-4 ${getSeverityColor(alert.severity)} cursor-pointer hover:shadow-md transition`}
              onClick={() =>
                setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <CardTitle className="text-base">{alert.actionType}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <ChevronDown
                      className={`h-5 w-5 transition ${
                        expandedAlertId === alert.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </CardHeader>

              {expandedAlertId === alert.id && (
                <CardContent className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">Ação Sugerida:</h4>
                    <p className="text-sm text-gray-700">{alert.suggestedAction}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Criado em {format(new Date(alert.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    {alert.resolvedAt && (
                      <span>Resolvido em {format(new Date(alert.resolvedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    )}
                  </div>

                  {!alert.resolvedAt && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(alert.id);
                        }}
                      >
                        Marcar como Resolvido
                      </Button>

                      {alert.severity === 'high' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEscalar(alert.id, 'director');
                          }}
                        >
                          Escalar para Diretor
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <p>
              <strong>{statistics?.totalAlerts || 0}</strong> alertas nos últimos 7 dias
            </p>
            <p className="mt-2">
              <strong>{statistics?.resolvedAlerts || 0}</strong> resolvidos |{' '}
              <strong>{(statistics?.totalAlerts || 0) - (statistics?.resolvedAlerts || 0)}</strong> pendentes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
