import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, AlertTriangle, Info, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { ValidationRule } from '@/lib/mqtValidationService';
import { getDefaultValidationRules } from '@/lib/mqtValidationService';

interface MQTValidationRulesProps {
  constructionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ruleTypeLabels: Record<string, string> = {
  price_min: 'Preço Mínimo',
  price_max: 'Preço Máximo',
  code_pattern: 'Padrão de Código',
  quantity_min: 'Quantidade Mínima',
  quantity_max: 'Quantidade Máxima',
  duplicate_check: 'Verificação de Duplicados',
};

const severityLabels: Record<string, { label: string; icon: any; color: string }> = {
  error: { label: 'Erro (Bloqueia)', icon: XCircle, color: 'text-red-600' },
  warning: { label: 'Aviso', icon: AlertTriangle, color: 'text-yellow-600' },
  info: { label: 'Informativo', icon: Info, color: 'text-blue-600' },
};

export function MQTValidationRules({ constructionId, open, onOpenChange }: MQTValidationRulesProps) {
  const [editingRule, setEditingRule] = useState<Partial<ValidationRule> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const utils = trpc.useUtils();
  const { data: rules = [], isLoading } = trpc.mqt.getValidationRules.useQuery(
    { constructionId },
    { enabled: open }
  );

  const createMutation = trpc.mqt.createValidationRule.useMutation({
    onSuccess: () => {
      utils.mqt.getValidationRules.invalidate({ constructionId });
      setIsCreating(false);
      setEditingRule(null);
    },
  });

  const updateMutation = trpc.mqt.updateValidationRule.useMutation({
    onSuccess: () => {
      utils.mqt.getValidationRules.invalidate({ constructionId });
      setEditingRule(null);
    },
  });

  const deleteMutation = trpc.mqt.deleteValidationRule.useMutation({
    onSuccess: () => {
      utils.mqt.getValidationRules.invalidate({ constructionId });
    },
  });

  const toggleMutation = trpc.mqt.toggleValidationRule.useMutation({
    onSuccess: () => {
      utils.mqt.getValidationRules.invalidate({ constructionId });
    },
  });

  const handleCreateDefault = () => {
    const defaults = getDefaultValidationRules();
    defaults.forEach(rule => {
      createMutation.mutate({
        constructionId,
        ...rule as any,
      });
    });
  };

  const handleSave = () => {
    if (!editingRule) return;

    if (isCreating) {
      createMutation.mutate({
        constructionId,
        ...editingRule as any,
      });
    } else if (editingRule.id) {
      updateMutation.mutate({
        id: editingRule.id,
        ...editingRule as any,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja apagar esta regra?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggle = (id: number, enabled: boolean) => {
    toggleMutation.mutate({ id, enabled: !enabled });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#8B0000]">Regras de Validação MQT</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure regras customizáveis para validar importações de MQT
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">A carregar regras...</div>
          ) : rules.length === 0 && !isCreating ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma regra de validação configurada</p>
              <button
                onClick={handleCreateDefault}
                className="px-4 py-2 bg-[#8B0000] text-white rounded-lg hover:bg-[#6B0000]"
              >
                Criar Regras Padrão
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className={`border rounded-lg p-4 ${
                    rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  {editingRule?.id === rule.id ? (
                    <RuleForm
                      rule={editingRule}
                      onChange={setEditingRule}
                      onSave={handleSave}
                      onCancel={() => setEditingRule(null)}
                      isSaving={updateMutation.isLoading}
                    />
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-medium ${rule.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                            {rule.name}
                          </h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {ruleTypeLabels[rule.ruleType]}
                          </span>
                          {severityLabels[rule.severity] && (() => {
                            const SeverityIcon = severityLabels[rule.severity].icon;
                            return (
                              <span className={`flex items-center gap-1 text-xs ${severityLabels[rule.severity].color}`}>
                                {SeverityIcon && <SeverityIcon className="w-3 h-3" />}
                                {severityLabels[rule.severity].label}
                              </span>
                            );
                          })()}
                        </div>
                        {rule.message && (
                          <p className="text-sm text-gray-600 mb-2">{rule.message}</p>
                        )}
                        {rule.category && (
                          <p className="text-xs text-gray-500">
                            Categoria: {rule.category}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggle(rule.id, rule.enabled)}
                            className="w-4 h-4 text-[#8B0000] rounded"
                          />
                          <span className="text-sm text-gray-600">Ativa</span>
                        </label>
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="p-2 text-gray-400 hover:text-[#8B0000]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isCreating && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <RuleForm
                    rule={editingRule || {}}
                    onChange={setEditingRule}
                    onSave={handleSave}
                    onCancel={() => {
                      setIsCreating(false);
                      setEditingRule(null);
                    }}
                    isSaving={createMutation.isLoading}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => {
              setIsCreating(true);
              setEditingRule({
                name: '',
                ruleType: 'price_min',
                field: 'unitPrice',
                condition: '{}',
                severity: 'warning',
                enabled: true,
              });
            }}
            disabled={isCreating || editingRule !== null}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] text-white rounded-lg hover:bg-[#6B0000] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Nova Regra
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

interface RuleFormProps {
  rule: Partial<ValidationRule>;
  onChange: (rule: Partial<ValidationRule>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function RuleForm({ rule, onChange, onSave, onCancel, isSaving }: RuleFormProps) {
  const handleConditionChange = (key: string, value: any) => {
    try {
      const condition = rule.condition ? JSON.parse(rule.condition) : {};
      condition[key] = value;
      onChange({ ...rule, condition: JSON.stringify(condition) });
    } catch (error) {
      console.error('Error updating condition:', error);
    }
  };

  const getConditionValue = (key: string) => {
    try {
      const condition = rule.condition ? JSON.parse(rule.condition) : {};
      return condition[key];
    } catch (error) {
      return undefined;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Regra</label>
        <input
          type="text"
          value={rule.name || ''}
          onChange={(e) => onChange({ ...rule, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Ex: Preço Mínimo Razoável"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Regra</label>
          <select
            value={rule.ruleType || 'price_min'}
            onChange={(e) => onChange({ ...rule, ruleType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {Object.entries(ruleTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severidade</label>
          <select
            value={rule.severity || 'warning'}
            onChange={(e) => onChange({ ...rule, severity: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {Object.entries(severityLabels).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Condition fields based on rule type */}
      {(rule.ruleType === 'price_min' || rule.ruleType === 'price_max') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor (€)</label>
          <input
            type="number"
            step="0.01"
            value={getConditionValue('value') || ''}
            onChange={(e) => handleConditionChange('value', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      )}

      {rule.ruleType === 'code_pattern' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Padrão Regex</label>
          <input
            type="text"
            value={getConditionValue('pattern') || ''}
            onChange={(e) => handleConditionChange('pattern', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Ex: ^[A-Z]{2}\\d{4}$"
          />
        </div>
      )}

      {(rule.ruleType === 'quantity_min' || rule.ruleType === 'quantity_max') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
          <input
            type="number"
            step="0.01"
            value={getConditionValue('value') || ''}
            onChange={(e) => handleConditionChange('value', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem Personalizada</label>
        <textarea
          value={rule.message || ''}
          onChange={(e) => onChange({ ...rule, message: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={2}
          placeholder="Mensagem que será exibida quando a regra for violada"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (Opcional)</label>
        <input
          type="text"
          value={rule.category || ''}
          onChange={(e) => onChange({ ...rule, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Aplicar apenas a uma categoria específica"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={isSaving || !rule.name}
          className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] text-white rounded-lg hover:bg-[#6B0000] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
