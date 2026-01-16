import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Clock, Play, Plus, Settings, Trash2 } from 'lucide-react';

interface AdvancedAction {
  type: string;
  label: string;
  description: string;
  configFields: Array<{
    name: string;
    label: string;
    type: string;
    options?: string[];
    required?: boolean;
    defaultValue?: any;
  }>;
}

export function AdvancedActionsManager() {
  const [availableActions, setAvailableActions] = useState<AdvancedAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<Array<{ type: string; config: Record<string, any> }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<string>('');
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch available actions
  const { data: actionsData } = trpc.advancedActions.getAvailableActions.useQuery();

  useEffect(() => {
    if (actionsData?.data) {
      setAvailableActions(actionsData.data);
    }
  }, [actionsData]);

  const handleAddAction = () => {
    if (selectedActionType && actionConfig) {
      setSelectedActions([
        ...selectedActions,
        {
          type: selectedActionType,
          config: actionConfig,
        },
      ]);
      setSelectedActionType('');
      setActionConfig({});
      setIsOpen(false);
    }
  };

  const handleRemoveAction = (index: number) => {
    setSelectedActions(selectedActions.filter((_, i) => i !== index));
  };

  const handleConfigChange = (fieldName: string, value: any) => {
    setActionConfig({
      ...actionConfig,
      [fieldName]: value,
    });
  };

  const handleExecuteActions = async () => {
    setIsExecuting(true);
    try {
      // Simular execução de ações
      const results = await Promise.all(
        selectedActions.map(async (action) => ({
          action: action.type,
          success: true,
          result: {
            message: `Ação ${action.type} executada com sucesso`,
            timestamp: new Date(),
          },
        }))
      );
      setExecutionResults(results);
    } catch (error) {
      console.error('Erro ao executar ações:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getActionLabel = (type: string) => {
    const action = availableActions.find((a) => a.type === type);
    return action?.label || type;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ações Automáticas Avançadas
          </CardTitle>
          <CardDescription>Configure ações customizáveis para escalonamento de marcos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ações Selecionadas */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Ações Configuradas</Label>
            {selectedActions.length === 0 ? (
              <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                Nenhuma ação configurada. Adicione uma ação para começar.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-1">
                        {getActionLabel(action.type)}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {Object.entries(action.config)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAction(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão Adicionar Ação */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Ação Automática</DialogTitle>
                <DialogDescription>Selecione o tipo de ação e configure os parâmetros</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Seleção de Tipo de Ação */}
                <div className="space-y-2">
                  <Label>Tipo de Ação</Label>
                  <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma ação..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableActions.map((action) => (
                        <SelectItem key={action.type} value={action.type}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedActionType && (
                    <p className="text-xs text-muted-foreground">
                      {availableActions.find((a) => a.type === selectedActionType)?.description}
                    </p>
                  )}
                </div>

                {/* Campos de Configuração */}
                {selectedActionType &&
                  availableActions
                    .find((a) => a.type === selectedActionType)
                    ?.configFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>

                        {field.type === 'text' && (
                          <Input
                            id={field.name}
                            placeholder={field.label}
                            value={actionConfig[field.name] || ''}
                            onChange={(e) => handleConfigChange(field.name, e.target.value)}
                          />
                        )}

                        {field.type === 'textarea' && (
                          <Textarea
                            id={field.name}
                            placeholder={field.label}
                            value={actionConfig[field.name] || ''}
                            onChange={(e) => handleConfigChange(field.name, e.target.value)}
                            rows={3}
                          />
                        )}

                        {field.type === 'number' && (
                          <Input
                            id={field.name}
                            type="number"
                            placeholder={field.label}
                            value={actionConfig[field.name] || field.defaultValue || ''}
                            onChange={(e) => handleConfigChange(field.name, parseInt(e.target.value))}
                          />
                        )}

                        {field.type === 'select' && (
                          <Select value={actionConfig[field.name] || ''} onValueChange={(v) => handleConfigChange(field.name, v)}>
                            <SelectTrigger>
                              <SelectValue placeholder={field.label} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}

                <Button onClick={handleAddAction} className="w-full" disabled={!selectedActionType}>
                  Adicionar Ação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Botão Executar */}
          {selectedActions.length > 0 && (
            <Button onClick={handleExecuteActions} disabled={isExecuting} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Executando...' : 'Executar Ações'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Resultados da Execução */}
      {executionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resultados da Execução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {executionResults.map((result, index) => (
              <div key={index} className="p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">{getActionLabel(result.action)}</p>
                    <p className="text-sm text-green-700 mt-1">{result.result?.message}</p>
                    <p className="text-xs text-green-600 mt-1">{result.result?.timestamp?.toLocaleString('pt-PT')}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ações Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Disponíveis</CardTitle>
          <CardDescription>Tipos de ações que podem ser executadas automaticamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableActions.map((action) => (
            <div key={action.type} className="p-3 border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{action.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </div>
                <Badge variant="secondary">{action.type}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
