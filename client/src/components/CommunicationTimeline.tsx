import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Reply, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EmailItem {
  id: number;
  subject: string;
  from: string;
  to: string;
  date: string | Date;
  type: 'sent' | 'received' | 'failed';
  status: 'delivered' | 'bounced' | 'pending' | 'failed';
  preview?: string;
  sentiment?: string;
  sentimentScore?: number;
}

interface CommunicationTimelineProps {
  emails: EmailItem[];
}

export default function CommunicationTimeline({ emails }: CommunicationTimelineProps) {
  if (!emails || emails.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Nenhum email neste histórico</p>
        </CardContent>
      </Card>
    );
  }

  // Determinar cor do badge de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determinar cor do badge de tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determinar ícone de tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'received':
        return <Reply className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  // Determinar cor de sentimento
  const getSentimentColor = (sentiment: string | undefined) => {
    if (!sentiment) return 'text-gray-500';
    if (sentiment.includes('very_negative') || sentiment.includes('negative')) {
      return 'text-red-500';
    }
    if (sentiment.includes('positive')) {
      return 'text-green-500';
    }
    return 'text-yellow-500';
  };

  // Formatar data
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Comunicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emails.map((email, index) => (
              <div key={email.id} className="border-l-4 border-blue-300 pl-4 pb-4">
                {/* Header do email */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${getTypeColor(email.type)}`}>
                      {getTypeIcon(email.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{email.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {email.type === 'sent' ? 'Enviado para' : 'Recebido de'}: {email.type === 'sent' ? email.to : email.from}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(email.status)}>
                      {email.status === 'delivered' && 'Entregue'}
                      {email.status === 'bounced' && 'Rejeitado'}
                      {email.status === 'pending' && 'Pendente'}
                      {email.status === 'failed' && 'Falhou'}
                    </Badge>
                    {email.status === 'delivered' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {email.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Data e hora */}
                <p className="text-xs text-muted-foreground mb-2">{formatDate(email.date)}</p>

                {/* Preview do email */}
                {email.preview && (
                  <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded mb-2 line-clamp-2">
                    {email.preview}
                  </p>
                )}

                {/* Análise de sentimento */}
                {email.sentiment && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-semibold ${getSentimentColor(email.sentiment)}`}>
                      {email.sentiment === 'very_positive' && '😊 Muito Positivo'}
                      {email.sentiment === 'positive' && '🙂 Positivo'}
                      {email.sentiment === 'neutral' && '😐 Neutro'}
                      {email.sentiment === 'negative' && '😞 Negativo'}
                      {email.sentiment === 'very_negative' && '😠 Muito Negativo'}
                    </span>
                    {email.sentimentScore && (
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            email.sentimentScore > 0.5
                              ? 'bg-green-500'
                              : email.sentimentScore > 0
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(email.sentimentScore) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Linha de separação */}
                {index < emails.length - 1 && <div className="mt-4 border-t border-gray-200"></div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Enviados</p>
            <p className="text-2xl font-bold">
              {emails.filter((e) => e.type === 'sent').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Recebidos</p>
            <p className="text-2xl font-bold">
              {emails.filter((e) => e.type === 'received').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Entregues</p>
            <p className="text-2xl font-bold">
              {emails.filter((e) => e.status === 'delivered').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Falhados</p>
            <p className="text-2xl font-bold text-red-600">
              {emails.filter((e) => e.status === 'failed' || e.status === 'bounced').length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
