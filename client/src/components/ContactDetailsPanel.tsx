import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Building2, User, Tag, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import CommunicationTimeline from './CommunicationTimeline';
import ContactSentimentChart from './ContactSentimentChart';

interface ContactDetailsPanelProps {
  contactId: number;
  onClose?: () => void;
}

export default function ContactDetailsPanel({ contactId, onClose }: ContactDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Queries
  const { data: contact, isLoading: contactLoading } = trpc.crm.getContactDetails.useQuery({
    contactId,
  });

  const { data: communicationHistory } = trpc.crm.getCommunicationHistory.useQuery({
    contactId,
    limit: 50,
  });

  const { data: sentimentAnalysis } = trpc.crm.getContactSentimentAnalysis.useQuery({
    contactId,
  });

  if (contactLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contact || contact.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Contato não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const contactData = contact[0];
  const tags = contactData.tags ? JSON.parse(contactData.tags) : [];

  // Determinar cor do badge de tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'supplier':
        return 'bg-green-100 text-green-800';
      case 'partner':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determinar cor do badge de sentimento
  const getSentimentColor = (sentiment: string | null) => {
    if (!sentiment) return 'bg-gray-100 text-gray-800';
    if (sentiment.includes('very_negative') || sentiment.includes('negative')) {
      return 'bg-red-100 text-red-800';
    }
    if (sentiment.includes('positive')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="w-full space-y-4">
      {/* Header com informações principais */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{contactData.name}</CardTitle>
                <Badge className={getTypeColor(contactData.type)}>
                  {contactData.type === 'client' && 'Cliente'}
                  {contactData.type === 'supplier' && 'Fornecedor'}
                  {contactData.type === 'partner' && 'Parceiro'}
                  {contactData.type === 'other' && 'Outro'}
                </Badge>
              </div>

              {/* Informações de contato */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${contactData.email}`} className="text-blue-600 hover:underline">
                    {contactData.email}
                  </a>
                </div>

                {contactData.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${contactData.phone}`} className="text-blue-600 hover:underline">
                      {contactData.phone}
                    </a>
                  </div>
                )}

                {contactData.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{contactData.company}</span>
                  </div>
                )}

                {contactData.role && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{contactData.role}</span>
                  </div>
                )}

                {contactData.address && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{contactData.address}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-2 flex-wrap">
                    {tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Estatísticas rápidas */}
            <div className="flex flex-col gap-2 text-right">
              <div>
                <p className="text-xs text-muted-foreground">Emails Enviados</p>
                <p className="text-2xl font-bold">{contactData.emailCount || 0}</p>
              </div>
              {sentimentAnalysis && (
                <div>
                  <p className="text-xs text-muted-foreground">Sentimento Médio</p>
                  <p className={`text-lg font-bold ${getSentimentColor(sentimentAnalysis.averageSentiment?.toString())}`}>
                    {Math.round(sentimentAnalysis.averageSentiment * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Abas de conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
          <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactData.notes && (
                <div>
                  <p className="text-sm font-semibold mb-2">Notas</p>
                  <p className="text-sm text-muted-foreground">{contactData.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Último Email</p>
                  <p className="text-sm font-medium">
                    {contactData.lastEmailDate
                      ? new Date(contactData.lastEmailDate).toLocaleDateString('pt-PT')
                      : 'Nenhum email'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status de Comunicação</p>
                  <Badge variant="outline">{contactData.communicationStatus}</Badge>
                </div>
              </div>

              {sentimentAnalysis && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-blue-900">Tendência de Sentimento</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {sentimentAnalysis.trend === 'improving' && 'Melhorando 📈'}
                        {sentimentAnalysis.trend === 'declining' && 'Piorando 📉'}
                        {sentimentAnalysis.trend === 'stable' && 'Estável →'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Comunicação */}
        <TabsContent value="communication">
          <CommunicationTimeline emails={communicationHistory || []} />
        </TabsContent>

        {/* Aba: Sentimento */}
        <TabsContent value="sentiment">
          {sentimentAnalysis ? (
            <ContactSentimentChart contactId={contactId} sentimentAnalysis={sentimentAnalysis} />
          ) : (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground">Nenhuma análise de sentimento disponível</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Detalhes */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Detalhadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID do Contato</p>
                  <p className="text-sm font-mono">{contactData.id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <p className="text-sm">{contactData.type}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data de Criação</p>
                  <p className="text-sm">
                    {new Date(contactData.createdAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Última Atualização</p>
                  <p className="text-sm">
                    {new Date(contactData.updatedAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>

              {contactData.sentimentScore && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-yellow-900">Score de Sentimento</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {contactData.sentimentScore}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {onClose && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
