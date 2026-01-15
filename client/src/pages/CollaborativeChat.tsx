import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, Plus, CheckCircle, AlertCircle, Lightbulb, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CollaborativeChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: topics = [], isLoading: topicsLoading, refetch: refetchTopics } = trpc.chat.getTopics.useQuery(
    { projectId: projectId || '' },
    { enabled: !!projectId }
  );

  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { topicId: selectedTopic?.id || '' },
    { enabled: !!selectedTopic?.id }
  );

  const { data: suggestions = [], isLoading: suggestionsLoading, refetch: refetchSuggestions } = trpc.chat.getSuggestions.useQuery(
    { projectId: projectId || '' },
    { enabled: !!projectId }
  );
  
  // Mutations
  const createTopicMutation = trpc.chat.createTopic.useMutation({
    onSuccess: () => {
      refetchTopics();
      setNewTopicName('');
      setShowNewTopicForm(false);
    },
  });

  const createMessageMutation = trpc.chat.createMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setNewMessage('');
    },
  });

  const approveSuggestionMutation = trpc.chat.approveSuggestion.useMutation({
    onSuccess: () => {
      refetchSuggestions();
    },
  });

  const rejectSuggestionMutation = trpc.chat.rejectSuggestion.useMutation({
    onSuccess: () => {
      refetchSuggestions();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || !projectId) return;
    
    try {
      await createTopicMutation.mutateAsync({
        projectId,
        name: newTopicName,
        category: 'general',
        createdBy: 'current-user',
      });
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTopic || !projectId) return;
    
    try {
      await createMessageMutation.mutateAsync({
        topicId: selectedTopic.id,
        projectId,
        content: newMessage,
        userName: 'Current User',
        userId: 'current-user',
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleApproveSuggestion = async (suggestionId: string) => {
    try {
      await approveSuggestionMutation.mutateAsync({
        suggestionId,
        approvedBy: 'current-user',
      });
    } catch (error) {
      console.error('Erro ao aprovar sugestão:', error);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      await rejectSuggestionMutation.mutateAsync({ suggestionId });
    } catch (error) {
      console.error('Erro ao rejeitar sugestão:', error);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'action':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Chat Colaborativo com IA</h1>
        <p className="text-gray-600 mt-2">Converse com sua equipa e deixe a IA aprender com o contexto do projeto</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topics">Tópicos</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões IA</TabsTrigger>
        </TabsList>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-4 flex-1">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowNewTopicForm(!showNewTopicForm)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Tópico
            </Button>
          </div>

          {showNewTopicForm && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <Input
                  placeholder="Nome do tópico..."
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateTopic}
                    size="sm"
                    disabled={createTopicMutation.isPending}
                  >
                    {createTopicMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Criar
                  </Button>
                  <Button
                    onClick={() => setShowNewTopicForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {topicsLoading ? (
                <p className="text-gray-500">Carregando tópicos...</p>
              ) : topics.length === 0 ? (
                <p className="text-gray-500">Nenhum tópico criado ainda</p>
              ) : (
                topics.map((topic: any) => (
                  <Card
                    key={topic.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTopic?.id === topic.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{topic.name}</h3>
                          {topic.description && (
                            <p className="text-xs text-gray-600 mt-1">{topic.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {topic.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(topic.createdAt), 'PPp', { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4 flex-1 flex flex-col">
          {!selectedTopic ? (
            <Card>
              <CardContent className="pt-4 text-center text-gray-500">
                Selecione um tópico para começar a conversa
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{selectedTopic.name}</CardTitle>
                </CardHeader>
              </Card>

              <ScrollArea className="flex-1 border rounded-lg p-4">
                <div className="space-y-4">
                  {messagesLoading ? (
                    <p className="text-gray-500">Carregando mensagens...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-gray-500 text-center">Nenhuma mensagem ainda</p>
                  ) : (
                    messages.map((msg: any) => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{msg.userName}</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={createMessageMutation.isPending || !newMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4 flex-1">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {suggestionsLoading ? (
                <p className="text-gray-500">Carregando sugestões...</p>
              ) : suggestions.length === 0 ? (
                <p className="text-gray-500">Nenhuma sugestão da IA ainda</p>
              ) : (
                suggestions.map((suggestion: any) => (
                  <Card key={suggestion.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{suggestion.title}</h3>
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline">
                              {suggestion.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{suggestion.description}</p>
                        </div>
                      </div>

                      {suggestion.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleApproveSuggestion(suggestion.id)}
                            size="sm"
                            variant="default"
                            disabled={approveSuggestionMutation.isPending}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => handleRejectSuggestion(suggestion.id)}
                            size="sm"
                            variant="outline"
                            disabled={rejectSuggestionMutation.isPending}
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
