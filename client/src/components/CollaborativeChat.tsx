import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, Plus, CheckCircle, AlertCircle, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatTopic {
  id: string;
  name: string;
  description?: string;
  category: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  content: string;
  userName: string;
  createdAt: Date;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  approvedBy?: string;
}

export default function CollaborativeChat({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  
  // Queries
  const { data: topics = [], isLoading: topicsLoading } = trpc.chat.getTopics.useQuery({ projectId });
  const { data: messages = [], isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { topicId: selectedTopic?.id || '' },
    { enabled: !!selectedTopic?.id }
  );
  const { data: suggestions = [], isLoading: suggestionsLoading } = trpc.chat.getSuggestions.useQuery({ projectId });
  
  // Mutations
  const createTopicMutation = trpc.chat.createTopic.useMutation();
  const createMessageMutation = trpc.chat.createMessage.useMutation();
  const approveSuggestionMutation = trpc.chat.approveSuggestion.useMutation();
  const rejectSuggestionMutation = trpc.chat.rejectSuggestion.useMutation();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    
    try {
      await createTopicMutation.mutateAsync({
        projectId,
        name: newTopicName,
        category: 'general',
        createdBy: 'current-user', // TODO: Get from auth
      });
      setNewTopicName('');
      setShowNewTopicForm(false);
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTopic) return;
    
    try {
      await createMessageMutation.mutateAsync({
        topicId: selectedTopic.id,
        projectId,
        content: newMessage,
        userName: 'Current User', // TODO: Get from auth
        userId: 'current-user',
      });
      setNewMessage('');
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
    <div className="w-full h-full flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topics">Tópicos</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões IA</TabsTrigger>
        </TabsList>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-4">
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
                topics.map((topic) => (
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
        <TabsContent value="chat" className="space-y-4">
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

              <ScrollArea className="h-[350px] border rounded-lg p-4">
                <div className="space-y-4">
                  {messagesLoading ? (
                    <p className="text-gray-500">Carregando mensagens...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-gray-500 text-center">Nenhuma mensagem ainda</p>
                  ) : (
                    messages.map((msg) => (
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
        <TabsContent value="suggestions" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {suggestionsLoading ? (
                <p className="text-gray-500">Carregando sugestões...</p>
              ) : suggestions.length === 0 ? (
                <p className="text-gray-500">Nenhuma sugestão da IA ainda</p>
              ) : (
                suggestions.map((suggestion: AISuggestion) => (
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
