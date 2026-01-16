import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface EscalationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  escalationLevels: EscalationLevel[];
}

interface EscalationLevel {
  level: 'manager' | 'director' | 'admin' | 'owner';
  daysOverdue: number;
  notifyRoles: string[];
  message?: string;
}

export function EscalationRulesManager({ projectId }: { projectId: string }) {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<EscalationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    escalationLevels: [] as EscalationLevel[],
  });
  const [templates, setTemplates] = useState<any[]>([]);

  // Queries
  const { data: rulesData, refetch } = trpc.escalationRules.listRules.useQuery({ projectId });
  const { data: levelTemplates } = trpc.escalationRules.getLevelTemplates.useQuery();
  const { data: ruleTemplates } = trpc.escalationRules.getRuleTemplates.useQuery();
  const { data: stats } = trpc.escalationRules.getStats.useQuery({ projectId });

  // Mutations
  const createRule = trpc.escalationRules.createRule.useMutation({
    onSuccess: () => {
      toast.success('Regra criada com sucesso');
      setIsOpen(false);
      resetForm();
      refetch();
    },
  });

  const updateRule = trpc.escalationRules.updateRule.useMutation({
    onSuccess: () => {
      toast.success('Regra atualizada com sucesso');
      setIsOpen(false);
      resetForm();
      refetch();
    },
  });

  const deleteRule = trpc.escalationRules.deleteRule.useMutation({
    onSuccess: () => {
      toast.success('Regra deletada com sucesso');
      refetch();
    },
  });

  const toggleRule = trpc.escalationRules.toggleRule.useMutation({
    onSuccess: () => {
      toast.success('Regra atualizada');
      refetch();
    },
  });

  useEffect(() => {
    if (rulesData?.data) {
      setRules(rulesData.data);
    }
    if (ruleTemplates?.data) {
      setTemplates(ruleTemplates.data);
    }
  }, [rulesData, ruleTemplates]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      escalationLevels: [],
    });
    setSelectedRule(null);
  };

  const handleOpenDialog = (rule?: EscalationRule) => {
    if (rule) {
      setSelectedRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        escalationLevels: rule.escalationLevels || [],
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

    if (formData.escalationLevels.length === 0) {
      toast.error('Adicione pelo menos um nível de escalonamento');
      return;
    }

    try {
      if (selectedRule) {
        await updateRule.mutateAsync({
          ruleId: selectedRule.id,
          updates: {
            projectId,
            ...formData,
          } as any,
        });
      } else {
        await createRule.mutateAsync({
          projectId,
          ...formData,
        } as any);
      }
    } catch (error) {
      toast.error('Erro ao salvar regra');
    }
  };

  const handleApplyTemplate = (template: any) => {
    setFormData({
      name: template.name,
      description: template.description,
      escalationLevels: template.escalationLevels,
    });
    toast.success(`Template "${template.name}" aplicado`);
  };

  const getLevelLabel = (level: string) => {
    const template = levelTemplates?.data?.find((t: any) => t.level === level);
    return template?.label || level;
  };

  const getLevelIcon = (level: string) => {
    const template = levelTemplates?.data?.find((t: any) => t.level === level);
    return template?.icon || '📌';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Regras de Escalonamento</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure notificações progressivas quando marcos permanecem vencidos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Regra
        </Button>
      </div>

      {/* Statistics */}
      {stats?.data && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Marcos Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.data.overdueCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Escalonamentos (30d)</p>
                <p className="text-2xl font-bold text-orange-600">{stats.data.recentEscalations}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nível Gestor</p>
                <p className="text-2xl font-bold text-blue-600">{stats.data.escalationsByLevel.manager}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nível Admin</p>
                <p className="text-2xl font-bold text-red-600">{stats.data.escalationsByLevel.admin}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </Card>
        </div>
      )}

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
                    <p className="text-sm text-gray-600 mb-4">{rule.description}</p>
                  )}

                  {/* Escalation Levels */}
                  <div className="space-y-2">
                    {rule.escalationLevels.map((level, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">{getLevelIcon(level.level)}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {getLevelLabel(level.level)} - {level.daysOverdue} dias
                          </p>
                          {level.message && (
                            <p className="text-xs text-gray-600 mt-1">{level.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRule.mutate({ ruleId: rule.id, isActive: !rule.isActive })}
                  >
                    <Edit2 className="w-4 h-4" />
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
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma regra de escalonamento criada</p>
            <p className="text-sm text-gray-500 mt-1">Crie a primeira regra para começar a escalar marcos vencidos</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regra de Escalonamento' : 'Nova Regra de Escalonamento'}
            </DialogTitle>
            <DialogDescription>
              Configure os níveis de escalonamento para notificações automáticas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Templates */}
            {!selectedRule && templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Usar Template Pré-configurado
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left transition-colors"
                    >
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Regra
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Escalonamento Padrão"
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

            {/* Escalation Levels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Níveis de Escalonamento
              </label>
              <div className="space-y-3">
                {formData.escalationLevels.length > 0 ? (
                  formData.escalationLevels.map((level, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">
                          {getLevelLabel(level.level)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              escalationLevels: formData.escalationLevels.filter((_, i) => i !== idx),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600">Dias Vencido</label>
                          <Input
                            type="number"
                            value={level.daysOverdue}
                            onChange={(e) => {
                              const newLevels = [...formData.escalationLevels];
                              newLevels[idx].daysOverdue = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, escalationLevels: newLevels });
                            }}
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Mensagem Customizada</label>
                          <Input
                            value={level.message || ''}
                            onChange={(e) => {
                              const newLevels = [...formData.escalationLevels];
                              newLevels[idx].message = e.target.value;
                              setFormData({ ...formData, escalationLevels: newLevels });
                            }}
                            placeholder="Mensagem opcional"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhum nível adicionado</p>
                )}

                {/* Add Level */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const level = e.target.value as any;
                        const template = levelTemplates?.data?.find((t: any) => t.level === level);
                        setFormData({
                          ...formData,
                          escalationLevels: [
                            ...formData.escalationLevels,
                            {
                              level,
                              daysOverdue: template?.defaultDaysOverdue || 1,
                              notifyRoles: [level],
                            },
                          ],
                        });
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">+ Adicionar Nível</option>
                    {levelTemplates?.data?.map((template: any) => (
                      <option key={template.level} value={template.level}>
                        {template.label} ({template.defaultDaysOverdue} dias)
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
