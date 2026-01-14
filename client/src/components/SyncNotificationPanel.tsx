import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface SyncStatus {
  provider: 'outlook' | 'sendgrid';
  status: 'idle' | 'syncing' | 'success' | 'error';
  emailsImported: number;
  emailsFailed: number;
  duration: number; // em ms
  error?: string;
  timestamp: Date;
}

interface SyncNotificationPanelProps {
  statuses: SyncStatus[];
  onDismiss: (provider: 'outlook' | 'sendgrid') => void;
  onRetry: (provider: 'outlook' | 'sendgrid') => void;
}

/**
 * Painel de notificações de sincronização
 */
export function SyncNotificationPanel({
  statuses,
  onDismiss,
  onRetry,
}: SyncNotificationPanelProps) {
  const [visible, setVisible] = useState(true);

  if (!visible || statuses.length === 0) {
    return null;
  }

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SyncStatus['status']) => {
    switch (status) {
      case 'syncing':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: SyncStatus['status']) => {
    switch (status) {
      case 'syncing':
        return <Badge className="bg-blue-600">Sincronizando...</Badge>;
      case 'success':
        return <Badge className="bg-green-600">Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-red-600">Erro</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {statuses.map((status) => (
        <Card
          key={status.provider}
          className={`p-4 border ${getStatusColor(status.status)} flex items-start justify-between`}
        >
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon(status.status)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {status.provider === 'outlook' ? 'Outlook' : 'SendGrid'}
                </h3>
                {getStatusBadge(status.status)}
              </div>

              {status.status === 'syncing' && (
                <p className="text-sm text-gray-600">Importando emails...</p>
              )}

              {status.status === 'success' && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {status.emailsImported} email{status.emailsImported !== 1 ? 's' : ''} importado
                    {status.emailsImported !== 1 ? 's' : ''} com sucesso
                  </p>
                  <p className="text-xs text-gray-500">
                    Tempo: {(status.duration / 1000).toFixed(1)}s
                  </p>
                </div>
              )}

              {status.status === 'error' && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {status.emailsImported} sucesso, {status.emailsFailed} falha
                    {status.emailsFailed !== 1 ? 's' : ''}
                  </p>
                  {status.error && (
                    <p className="text-xs text-red-600">{status.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status.status === 'error' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRetry(status.provider)}
                className="text-xs"
              >
                Tentar Novamente
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss(status.provider)}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
