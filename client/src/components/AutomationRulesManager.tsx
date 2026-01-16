import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Play, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: 'milestone_overdue' | 'milestone_due_soon' | 'milestone_completed';
  actions: any[];
  isActive: boolean;
}

export function AutomationRulesManager({ projectId }: { projectId: string }) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'milestone_overdue' as const,
    actions: [] as any[],
  });

  // Queries
  const { data: rulesData, refetch } = trpc.automationRules.listRules.useQuery({ projectId });
  const { data: triggerTemplates } = trpc.automationRules.getTriggerTemplates.useQuery();
  const { data: actionTemplates } = trpc.automationRules.getActionTemplates.useQuery();

  // Mutations
  const createRule = trpc.automationRules.createRule.useMutation({
    onSuccess: () => {
      toast.success('Regra criada com sucesso');
      setIsOpen(false);
      resetForm();
      refetch();
    },
  });

  const updateRule = trpc.automationRules.updateRule.useMutation({
    onSuccess: () => {
      toast.success('Regra atualizada com sucesso');
      setIsOpen(false);
      resetForm();
      refetch();
    },
  });

  const deleteRule = trpc.automationRules.deleteRule.useMutation({
    onSuccess: () => {
      toast.success('Regra deletada com sucesso');
      refetch();
    },
  });

  const toggleRule = trpc.automationRules.toggleRule.useMutation({
    onSuccess: () => {
      toast.success('Regra atualizada');
      refetch();
    },
  });

  const testRule = trpc.automationRules.testRule.useMutation({
    onSuccess: () => {
      toast.success('Regra testada com sucesso');
    },
  });

  useEffect(() => {
    if (rulesData?.data) {
      setRules(rulesData.data);
    }
  }, [rulesData]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: 'milestone_overdue',
      actions: [],
    });
    setSelectedRule(null);
  };

  const handleOpenDialog = (rule?: AutomationRule) => {
    if (rule) {
      setSelectedRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        trigger: rule.trigger,
        actions: rule.actions || [],
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleSaveRule = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (formData.actions.length === 0) {
      toast.error('Adicione pelo menos uma ação');
      return;
    }

    try {
      if (selectedRule) {
        await updateRule.mutateAsync({
          ruleId: selectedRule.id,
          updates: {
            ...formData,
            projectId,
          } as any,
        });
      } else {
        await createRule.mutateAsync({
          ...formData,
          projectId,
        } as any);
      }
    } catch (error) {
      toast.error('Erro ao salvar regra');
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const template = triggerTemplates?.data?.find((t: any) => t.type === trigger);
    return template?.label || trigger;
  };

  const getTriggerDescription = (trigger: string) => {
    const template = triggerTemplates?.data?.find((t: any) => t.type === trigger);
    return template?.description || '';
  };

  const getActionLabel = (actionType: string) => {
    const template = actionTemplates?.data?.find((a: any) => a.type === actionType);
    return template?.label || actionType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Regras de Automação</h2>
          <p className="text-sm text-gray-600 mt-1">Gerencie as regras que automatizam ações quando marcos vencem</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Regra
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length > 0 ? (
          rules.map((rule) => (
            <Card key={rule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  )}

                  {/* Trigger Info */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Trigger: {getTriggerLabel(rule.trigger)}
                    </p>
                    <p className="text-xs text-blue-700">
                      {getTriggerDescription(rule.trigger)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Ações ({rule.actions.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {rule.actions.map((action, idx) => (
                        <Badge key={idx} variant="outline">
                          {getActionLabel(action.type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRule.mutate({ ruleId: rule.id, isActive: !rule.isActive })}
                    title={rule.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {rule.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(rule)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule.mutate({ ruleId: rule.id })}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma regra de automação criada</p>
            <p className="text-sm text-gray-500 mt-1">Crie a primeira regra para começar a automatizar ações</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regra' : 'Nova Regra de Automação'}
            </DialogTitle>
            <DialogDescription>
              Configure uma regra para automatizar ações quando marcos vencem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Regra
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Notificar equipa quando marco vence"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da regra"
              />
            </div>

            {/* Trigger */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quando disparar
              </label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {triggerTemplates?.data?.map((template: any) => (
                  <option key={template.type} value={template.type}>
                    {template.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getTriggerDescription(formData.trigger)}
              </p>
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ações
              </label>
              <div className="space-y-3">
                {formData.actions.length > 0 ? (
                  formData.actions.map((action, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">
                        {getActionLabel(action.type)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            actions: formData.actions.filter((_, i) => i !== idx),
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma ação adicionada</p>
                )}

                {/* Add Action */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const template = actionTemplates?.data?.find((a: any) => a.type === e.target.value);
                        setFormData({
                          ...formData,
                          actions: [...formData.actions, { type: e.target.value, config: template?.config || {} }],
                        });
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">+ Adicionar Ação</option>
                    {actionTemplates?.data?.map((template: any) => (
                      <option key={template.type} value={template.type}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRule} disabled={createRule.isPending || updateRule.isPending}>
                {selectedRule ? 'Atualizar' : 'Criar'} Regra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
