import React, { useState, useCallback, useMemo } from 'react';
import { Bell, X, Archive, Trash2, Settings, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export interface CustomNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  archived: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

interface CustomNotificationCenterProps {
  notifications: CustomNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  onActionClick?: (notification: CustomNotification) => void;
  maxHeight?: string;
}

const typeColors = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  alert: 'bg-orange-50 border-orange-200 text-orange-900',
};

const severityBadgeColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const typeIcons = {
  info: '🔵',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  alert: '🚨',
};

export function CustomNotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onDelete,
  onClearAll,
  onActionClick,
  maxHeight = 'max-h-96',
}: CustomNotificationCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (showArchived && !notif.archived) return false;
      if (!showArchived && notif.archived) return false;

      const matchesSearch =
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || notif.type === filterType;
      const matchesSeverity =
        filterSeverity === 'all' || notif.severity === filterSeverity;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [notifications, searchTerm, filterType, filterSeverity, showArchived]);

  // Contar notificações não lidas
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && !n.archived).length,
    [notifications]
  );

  // Formatar tempo relativo
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)}d atrás`;
  };

  const handleNotificationClick = (notif: CustomNotification) => {
    if (!notif.read) {
      onMarkAsRead?.(notif.id);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#8b8670]" />
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              Marcar como lido
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-xs"
            >
              Limpar tudo
            </Button>
          )}
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="info">Informação</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="alert">Alerta</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>

          <Tabs
            value={showArchived ? 'archived' : 'active'}
            onValueChange={(v) => setShowArchived(v === 'archived')}
            className="w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Ativas</TabsTrigger>
              <TabsTrigger value="archived">Arquivadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Lista de notificações */}
      <ScrollArea className={maxHeight}>
        <div className="space-y-2 pr-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {showArchived
                  ? 'Nenhuma notificação arquivada'
                  : 'Nenhuma notificação'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <Card
                key={notif.id}
                className={`p-3 cursor-pointer transition-all border ${
                  typeColors[notif.type]
                } ${!notif.read ? 'ring-2 ring-offset-1 ring-[#8b8670]' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex gap-3">
                  {/* Ícone */}
                  <div className="text-xl flex-shrink-0">
                    {notif.icon || typeIcons[notif.type]}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{notif.title}</h4>
                        <p className="text-xs opacity-75 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-[#8b8670] rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs opacity-60">
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                        <Badge
                          className={`text-xs ${
                            severityBadgeColors[notif.severity]
                          }`}
                        >
                          {notif.severity}
                        </Badge>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-1">
                        {notif.actionUrl && notif.actionLabel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionClick?.(notif);
                            }}
                          >
                            {notif.actionLabel}
                          </Button>
                        )}
                        {!notif.archived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchive?.(notif.id);
                            }}
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(notif.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Rodapé com configurações */}
      <div className="flex justify-between items-center pt-2 border-t">
        <span className="text-xs text-gray-500">
          {filteredNotifications.length} notificação
          {filteredNotifications.length !== 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => {
            /* Abrir configurações */
          }}
        >
          <Settings className="w-3 h-3 mr-1" />
          Configurações
        </Button>
      </div>
    </div>
  );
}
