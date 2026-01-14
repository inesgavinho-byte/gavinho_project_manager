import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface SyncResult {
  success: number;
  failed: number;
  total: number;
  duration: number; // em ms
}

/**
 * Hook para exibir notificações de sincronização de emails
 */
export function useEmailSyncNotification() {
  const { toast } = useToast();

  const showSyncNotification = useCallback((result: SyncResult, provider: 'outlook' | 'sendgrid') => {
    const providerName = provider === 'outlook' ? 'Outlook' : 'SendGrid';
    const durationSeconds = (result.duration / 1000).toFixed(1);

    if (result.success === 0 && result.failed === 0) {
      // Nenhum email sincronizado
      toast({
        title: 'Sincronização Concluída',
        description: `Nenhum novo email encontrado no ${providerName}`,
        variant: 'default',
      });
      return;
    }

    if (result.failed === 0) {
      // Sucesso completo
      toast({
        title: `✓ Sincronização ${providerName} Concluída`,
        description: `${result.success} email${result.success !== 1 ? 's' : ''} importado${result.success !== 1 ? 's' : ''} com sucesso em ${durationSeconds}s`,
        variant: 'default',
      });
    } else if (result.success === 0) {
      // Falha completa
      toast({
        title: `✗ Erro na Sincronização ${providerName}`,
        description: `Falha ao importar ${result.failed} email${result.failed !== 1 ? 's' : ''}. Tente novamente mais tarde.`,
        variant: 'destructive',
      });
    } else {
      // Sucesso parcial
      toast({
        title: `⚠ Sincronização ${providerName} Parcial`,
        description: `${result.success} email${result.success !== 1 ? 's' : ''} importado${result.success !== 1 ? 's' : ''}, ${result.failed} falha${result.failed !== 1 ? 's' : ''}`,
        variant: 'default',
      });
    }
  }, [toast]);

  const showSyncError = useCallback((error: Error, provider: 'outlook' | 'sendgrid') => {
    const providerName = provider === 'outlook' ? 'Outlook' : 'SendGrid';

    toast({
      title: `Erro na Sincronização ${providerName}`,
      description: error.message || 'Ocorreu um erro desconhecido. Tente novamente.',
      variant: 'destructive',
    });
  }, [toast]);

  const showSyncStarting = useCallback((provider: 'outlook' | 'sendgrid') => {
    const providerName = provider === 'outlook' ? 'Outlook' : 'SendGrid';

    toast({
      title: `Sincronizando com ${providerName}...`,
      description: 'Por favor aguarde enquanto importamos seus emails',
      variant: 'default',
    });
  }, [toast]);

  return {
    showSyncNotification,
    showSyncError,
    showSyncStarting,
  };
}
