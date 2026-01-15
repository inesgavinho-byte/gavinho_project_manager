import React, { useEffect, useState } from 'react';
import { Bell, X, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function MilestoneNotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch notifications
  const { data: notificationsData, refetch } = trpc.milestoneNotifications.getNotifications.useQuery();
  const { data: statsData } = trpc.milestoneNotifications.getStats.useQuery();

  // Mutations
  const dismissNotification = trpc.milestoneNotifications.dismiss.useMutation({
    onSuccess: () => {
      toast.success('Notificação descartada');
      refetch();
    },
  });

  const dismissAll = trpc.milestoneNotifications.dismissAll.useMutation({
    onSuccess: () => {
      toast.success('Todas as notificações foram descartadas');
      refetch();
    },
  });

  useEffect(() => {
    if (notificationsData?.data) {
      setNotifications(notificationsData.data);
    }
  }, [notificationsData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'warning':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'urgent':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'warning':
        return <Bell className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'overdue':
        return 'Atrasado';
      case 'urgent':
        return 'Urgente';
      case 'warning':
        return 'Aviso';
      default:
        return 'Info';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {statsData?.data?.total > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {statsData.data.total > 9 ? '9+' : statsData.data.total}
          </span>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notificações de Marcos</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats */}
          {statsData?.data && (
            <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{statsData.data.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{statsData.data.overdue}</p>
                <p className="text-xs text-gray-600">Atrasados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{statsData.data.urgent}</p>
                <p className="text-xs text-gray-600">Urgentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{statsData.data.warning}</p>
                <p className="text-xs text-gray-600">Avisos</p>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getSeverityColor(
                      notification.severity
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            {notification.message}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getSeverityLabel(notification.severity)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {notification.daysUntilDue > 0
                            ? `${notification.daysUntilDue} dias até o vencimento`
                            : `${Math.abs(notification.daysUntilDue)} dias atrasado`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          dismissNotification.mutate({
                            notificationId: notification.id,
                          })
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">Nenhuma notificação</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={() => dismissAll.mutate()}
              >
                Descartar Todas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
