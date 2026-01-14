import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Clock,
  Target,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'follow_up' | 'meeting' | 'support' | 'relationship' | 'analysis';
  actionType: 'email' | 'call' | 'meeting' | 'task' | 'review';
  targetContactId?: number;
  targetContactName?: string;
  targetContactEmail?: string;
  relatedEmailIds?: number[];
  suggestedTemplate?: string;
  estimatedTime?: string;
  reasoning: string;
  createdAt: Date;
}

interface RecommendedActionsDashboardProps {
  projectId: number;
  actions?: RecommendedAction[];
  isLoading?: boolean;
}

export function RecommendedActionsDashboard({
  projectId,
  actions = [],
  isLoading = false,
}: RecommendedActionsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const filteredActions = activeTab === 'all'
    ? actions
    : actions.filter(a => a.priority === activeTab);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta Prioridade';
      case 'medium':
        return 'Média Prioridade';
      case 'low':
        return 'Baixa Prioridade';
      default:
        return priority;
    }
  };

  const getCategoryIcon = (actionType: string) => {
    switch (actionType) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'task':
        return <CheckCircle className="w-4 h-4" />;
      case 'review':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (actionType: string) => {
    switch (actionType) {
      case 'email':
        return 'Email';
      case 'call':
        return 'Chamada';
      case 'meeting':
        return 'Reunião';
      case 'task':
        return 'Tarefa';
      case 'review':
        return 'Revisão';
      default:
        return actionType;
    }
  };

  const handleCompleteAction = (actionId: string) => {
    setCompletedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const stats = {
    total: actions.length,
    high: actions.filter(a => a.priority === 'high').length,
    medium: actions.filter(a => a.priority === 'medium').length,
    low: actions.filter(a => a.priority === 'low').length,
    completed: completedActions.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ações Recomendadas</h2>
          <p className="text-gray-600 mt-1">Sugestões de IA para melhorar comunicação e relacionamentos</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Lightbulb className="w-4 h-4 mr-2" />
          Gerar Novas Ações
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alta Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.high}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Média Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Baixa Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.low}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="high">Alta ({stats.high})</TabsTrigger>
          <TabsTrigger value="medium">Média ({stats.medium})</TabsTrigger>
          <TabsTrigger value="low">Baixa ({stats.low})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Gerando ações recomendadas...</p>
            </div>
          ) : filteredActions.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma ação recomendada nesta categoria</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => (
                <Card
                  key={action.id}
                  className={`p-4 transition-all cursor-pointer ${
                    completedActions.includes(action.id)
                      ? 'bg-gray-50 opacity-60'
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getCategoryIcon(action.actionType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${completedActions.includes(action.id) ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {action.title}
                          </h3>
                          <Badge className={getPriorityColor(action.priority)}>
                            {getPriorityLabel(action.priority)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={completedActions.includes(action.id) ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteAction(action.id);
                        }}
                        className={completedActions.includes(action.id) ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {completedActions.includes(action.id) ? '✓ Concluída' : 'Marcar'}
                      </Button>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {expandedAction === action.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">Tipo de Ação</p>
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-1">
                            {getCategoryIcon(action.actionType)}
                            {getCategoryLabel(action.actionType)}
                          </p>
                        </div>
                        {action.estimatedTime && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Tempo Estimado</p>
                            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-1">
                              <Clock className="w-4 h-4" />
                              {action.estimatedTime}
                            </p>
                          </div>
                        )}
                        {action.targetContactName && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Contato</p>
                            <p className="text-sm font-semibold text-gray-900">{action.targetContactName}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Motivo da Recomendação</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                          {action.reasoning}
                        </p>
                      </div>

                      {action.suggestedTemplate && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Template Sugerido</p>
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-sm text-gray-700 italic">"{action.suggestedTemplate}"</p>
                          </div>
                        </div>
                      )}

                      {action.targetContactEmail && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Email do Contato</p>
                          <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                            {action.targetContactEmail}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button className="bg-blue-600 hover:bg-blue-700 flex-1">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Executar Ação
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Adicionar Nota
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dica */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            Dica
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          As ações recomendadas são geradas pela IA com base em análise de sentimento, padrões de comunicação e histórico de relacionamentos. Clique em uma ação para ver mais detalhes e sugestões de templates.
        </CardContent>
      </Card>
    </div>
  );
}
