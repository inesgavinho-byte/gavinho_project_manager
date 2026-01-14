import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, User, Phone, Building2, MessageSquare, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface CRMDashboardProps {
  projectId: number;
}

export function CRMDashboard({ projectId }: CRMDashboardProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'communication'>('contacts');
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    type: 'client' as 'client' | 'supplier' | 'partner',
    company: '',
  });

  // Queries
  const { data: contacts = [], isLoading: contactsLoading, refetch: refetchContacts } = trpc.crmContacts.getAllContacts.useQuery({
    projectId,
    limit: 100,
  });

  const { data: selectedContactData, isLoading: contactLoading } = trpc.crmContacts.getContactById.useQuery(
    { contactId: selectedContact || 0 },
    { enabled: !!selectedContact }
  );

  const { data: communicationHistory = [], isLoading: historyLoading } = trpc.crmContacts.getContactCommunicationHistory.useQuery(
    { contactId: selectedContact || 0, limit: 50 },
    { enabled: !!selectedContact }
  );

  // Mutations
  const { mutate: createContactMutation, isPending: isCreating } = trpc.crmContacts.createContact.useMutation({
    onSuccess: () => {
      setNewContact({ name: '', email: '', type: 'client', company: '' });
      setShowNewContactForm(false);
      refetchContacts();
    },
  });

  const { mutate: updateContactMutation, isPending: isUpdating } = trpc.crmContacts.updateContact.useMutation({
    onSuccess: () => {
      refetchContacts();
    },
  });

  const handleCreateContact = () => {
    if (newContact.name && newContact.email) {
      createContactMutation({
        projectId,
        ...newContact,
      });
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'supplier':
        return 'bg-purple-100 text-purple-800';
      case 'partner':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'client':
        return 'Cliente';
      case 'supplier':
        return 'Fornecedor';
      case 'partner':
        return 'Parceiro';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Contatos</h2>
          <p className="text-gray-600 mt-1">Rastreie clientes, fornecedores e parceiros</p>
        </div>
        <Button
          onClick={() => setShowNewContactForm(!showNewContactForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {/* Novo Contato Form */}
      {showNewContactForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Novo Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <Input
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={newContact.type}
                  onChange={(e) => setNewContact({ ...newContact, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="client">Cliente</option>
                  <option value="supplier">Fornecedor</option>
                  <option value="partner">Parceiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <Input
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateContact}
                disabled={isCreating || !newContact.name || !newContact.email}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? 'Criando...' : 'Criar Contato'}
              </Button>
              <Button
                onClick={() => setShowNewContactForm(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contacts">Contatos ({contacts.length})</TabsTrigger>
          <TabsTrigger value="communication">Histórico de Comunicação</TabsTrigger>
        </TabsList>

        {/* Tab: Contatos */}
        <TabsContent value="contacts" className="space-y-4">
          {contactsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando contatos...</p>
            </div>
          ) : contacts.length === 0 ? (
            <Card className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum contato cadastrado</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact: any) => (
                <Card
                  key={contact.id}
                  className={`cursor-pointer transition-all ${
                    selectedContact === contact.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedContact(contact.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                        <Badge className={`mt-2 ${getContactTypeColor(contact.type)}`}>
                          {getContactTypeLabel(contact.type)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </div>
                    {contact.company && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        {contact.company}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                      {contact.communicationCount || 0} comunicações
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Histórico de Comunicação */}
        <TabsContent value="communication" className="space-y-4">
          {!selectedContact ? (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Selecione um contato para ver o histórico de comunicação</p>
            </Card>
          ) : contactLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando histórico...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Informações do Contato */}
              {selectedContactData && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle>{selectedContactData.name}</CardTitle>
                    <CardDescription>{selectedContactData.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tipo</p>
                        <p className="font-semibold">{getContactTypeLabel(selectedContactData.type)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Empresa</p>
                        <p className="font-semibold">{selectedContactData.company || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total de Comunicações</p>
                        <p className="font-semibold">{communicationHistory.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Última Comunicação</p>
                        <p className="font-semibold">
                          {communicationHistory[0]
                            ? format(new Date(communicationHistory[0].createdAt), 'dd MMM', { locale: pt })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline de Comunicação */}
              {historyLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Carregando histórico...</p>
                </div>
              ) : communicationHistory.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma comunicação registrada</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {communicationHistory.map((comm: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{comm.subject || 'Sem assunto'}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comm.createdAt), 'dd MMM HH:mm', { locale: pt })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{comm.body || comm.content}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{comm.status || 'enviado'}</Badge>
                        {comm.sentiment && (
                          <Badge className={comm.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {comm.sentiment === 'positive' ? 'Positivo' : 'Negativo'}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
