import { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

interface MQTAlertsPanelProps {
  projectId: number;
}

export function MQTAlertsPanel({ projectId }: MQTAlertsPanelProps) {
  const [showResolved, setShowResolved] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>(
    'all'
  );

  const { data: alerts, isLoading, refetch } = trpc.mq.getMQTAlerts.useQuery({
    projectId,
    isResolved: showResolved ? undefined : false,
  });

  const resolveAlert = trpc.mq.resolveAlert.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'variance_high':
        return 'Variância Alta';
      case 'variance_critical':
        return 'Variância Crítica';
      case 'missing_data':
        return 'Dados Faltando';
      default:
        return type;
    }
  };

  let filteredAlerts = alerts || [];

  if (severityFilter !== 'all') {
    filteredAlerts = filteredAlerts.filter((alert) => alert.severity === severityFilter);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas MQT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando alertas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alertas MQT</CardTitle>
            <CardDescription>
              {filteredAlerts.length} alerta{filteredAlerts.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={severityFilter}
              onValueChange={(value: any) => setSeverityFilter(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showResolved ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Mostrar Pendentes' : 'Mostrar Resolvidas'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showResolved ? 'Nenhum alerta resolvido' : 'Nenhum alerta pendente'}
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition"
              >
                <div className="mt-1">{getAlertIcon(alert.severity || 'medium')}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {getAlertTypeLabel(alert.alertType || 'unknown')}
                    </span>
                    <Badge className={getSeverityColor(alert.severity || 'medium')}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.createdAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                {!alert.isResolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                    disabled={resolveAlert.isPending}
                    className="shrink-0"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                {alert.isResolved && (
                  <div className="shrink-0 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
