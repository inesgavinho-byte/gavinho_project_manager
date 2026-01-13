import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MailOpen, Archive, RefreshCw, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailDashboardProps {
  projectId: number;
}

export function EmailDashboard({ projectId }: EmailDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.outlook.getEmailStatistics.useQuery({ projectId });
  const { data: emails, refetch: refetchEmails } = trpc.outlook.getProjectEmails.useQuery({
    projectId,
    isArchived,
  });
  const { data: emailDetail } = trpc.outlook.getEmailDetail.useQuery(
    { emailId: selectedEmail || 0 },
    { enabled: selectedEmail !== null }
  );

  // Mutations
  const { mutate: syncEmails, isPending: isSyncing } = trpc.outlook.syncEmails.useMutation({
    onSuccess: () => {
      refetchStats();
      refetchEmails();
    },
  });

  const { mutate: markAsRead } = trpc.outlook.markAsRead.useMutation({
    onSuccess: () => {
      refetchEmails();
      refetchStats();
    },
  });

  const { mutate: markAsArchived } = trpc.outlook.markAsArchived.useMutation({
    onSuccess: () => {
      refetchEmails();
      refetchStats();
    },
  });

  // Filter emails
  const filteredEmails = emails?.filter((email) => {
    const matchesCategory = selectedCategory === 'all' || email.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      order: 'bg-blue-100 text-blue-800',
      adjudication: 'bg-purple-100 text-purple-800',
      purchase: 'bg-green-100 text-green-800',
      delivery: 'bg-orange-100 text-orange-800',
      invoice: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      order: 'Pedido',
      adjudication: 'Adjudicação',
      purchase: 'Compra',
      delivery: 'Entrega',
      invoice: 'Fatura',
      other: 'Outro',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard de Emails</h2>
          <p className="text-sm text-muted-foreground">Sincronize e gerencie seus emails do Outlook</p>
        </div>
        <Button onClick={() => syncEmails({ projectId })} disabled={isSyncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.byCategory.order}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Adjudicações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.byCategory.adjudication}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Não Lidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Arquivados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por assunto, remetente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-40">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Categoria</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="order">Pedidos</SelectItem>
              <SelectItem value="adjudication">Adjudicações</SelectItem>
              <SelectItem value="purchase">Compras</SelectItem>
              <SelectItem value="delivery">Entregas</SelectItem>
              <SelectItem value="invoice">Faturas</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={isArchived ? 'default' : 'outline'}
          onClick={() => setIsArchived(!isArchived)}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          {isArchived ? 'Arquivados' : 'Ativos'}
        </Button>
      </div>

      {/* Emails List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Emails ({filteredEmails?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEmails && filteredEmails.length > 0 ? (
                  filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEmail === email.id
                          ? 'bg-accent border-accent-foreground'
                          : 'hover:bg-muted border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!email.isRead && <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                            {email.isRead && <MailOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                            <h4 className="font-medium text-sm truncate">{email.subject}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{email.senderName}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{email.bodyPreview}</p>
                        </div>
                        <Badge className={getCategoryColor(email.category)}>
                          {getCategoryLabel(email.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(email.receivedAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <div className="flex gap-1">
                          {email.confidence > 0.8 && (
                            <Badge variant="outline" className="text-xs">
                              ✓ {Math.round(email.confidence * 100)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Nenhum email encontrado</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Detail */}
        {emailDetail && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Assunto</label>
                <p className="text-sm font-medium mt-1">{emailDetail.subject}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">De</label>
                <p className="text-sm mt-1">{emailDetail.senderName}</p>
                <p className="text-xs text-muted-foreground">{emailDetail.from}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                <Badge className={`${getCategoryColor(emailDetail.category)} mt-1`}>
                  {getCategoryLabel(emailDetail.category)}
                </Badge>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Confiança</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${emailDetail.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{Math.round(emailDetail.confidence * 100)}%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Resumo</label>
                <p className="text-sm mt-1 text-muted-foreground">{emailDetail.summary}</p>
              </div>

              {emailDetail.keywords && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Palavras-chave</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {JSON.parse(emailDetail.keywords).map((keyword: string) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Data</label>
                <p className="text-sm mt-1">
                  {new Date(emailDetail.receivedAt).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                {!emailDetail.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsRead({ emailId: emailDetail.id })}
                    className="flex-1"
                  >
                    Marcar como Lido
                  </Button>
                )}
                {!emailDetail.isArchived && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsArchived({ emailId: emailDetail.id })}
                    className="flex-1"
                  >
                    Arquivar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
