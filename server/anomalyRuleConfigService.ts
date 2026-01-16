import { db } from './db';
import { anomalyRules } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface AnomalyRuleConfig {
  id?: string;
  name: string;
  description: string;
  ruleType: 'threshold' | 'deviation' | 'pattern' | 'custom';
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
  threshold: number;
  thresholdMax?: number;
  severity: 'high' | 'medium' | 'low';
  enabled: boolean;
  notifyManagers: boolean;
  notifyDirectors: boolean;
  notifyAdmins: boolean;
  escalateAfterDays?: number;
  suggestedAction: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<AnomalyRuleConfig>;
  category: 'performance' | 'compliance' | 'resource' | 'custom';
}

// Templates pré-configurados
export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'high-failure-rate',
    name: 'Taxa de Falha Elevada',
    description: 'Alerta quando taxa de falha de ações ultrapassa 20%',
    category: 'performance',
    config: {
      ruleType: 'threshold',
      metric: 'failureRate',
      operator: 'gt',
      threshold: 20,
      severity: 'high',
      suggestedAction: 'Revisar configurações de ações e logs de erro. Considerar pausar ações até investigação.',
    },
  },
  {
    id: 'slow-actions',
    name: 'Ações Lentas',
    description: 'Alerta quando tempo médio de execução ultrapassa 5 minutos',
    category: 'performance',
    config: {
      ruleType: 'threshold',
      metric: 'avgExecutionTime',
      operator: 'gt',
      threshold: 300, // segundos
      severity: 'medium',
      suggestedAction: 'Otimizar ações lentas. Considerar paralelização ou caching.',
    },
  },
  {
    id: 'milestone-overdue',
    name: 'Marcos Vencidos',
    description: 'Alerta quando marcos permanecem vencidos por mais de 3 dias',
    category: 'compliance',
    config: {
      ruleType: 'threshold',
      metric: 'overdueMillestones',
      operator: 'gt',
      threshold: 3,
      severity: 'high',
      suggestedAction: 'Revisar marcos vencidos. Atualizar cronograma ou reatribuir responsabilidades.',
    },
  },
  {
    id: 'low-compliance-rate',
    name: 'Taxa de Conformidade Baixa',
    description: 'Alerta quando taxa de cumprimento de prazos cai abaixo de 70%',
    category: 'compliance',
    config: {
      ruleType: 'threshold',
      metric: 'complianceRate',
      operator: 'lt',
      threshold: 70,
      severity: 'high',
      suggestedAction: 'Investigar causas de não conformidade. Implementar plano de ação corretiva.',
    },
  },
  {
    id: 'resource-exhaustion',
    name: 'Esgotamento de Recursos',
    description: 'Alerta quando utilização de recursos ultrapassa 85%',
    category: 'resource',
    config: {
      ruleType: 'threshold',
      metric: 'resourceUsage',
      operator: 'gt',
      threshold: 85,
      severity: 'medium',
      suggestedAction: 'Escalar recursos ou otimizar consumo. Considerar distribuição de carga.',
    },
  },
  {
    id: 'anomaly-spike',
    name: 'Pico de Anomalias',
    description: 'Alerta quando número de anomalias aumenta 50% em relação à média',
    category: 'performance',
    config: {
      ruleType: 'deviation',
      metric: 'anomalyCount',
      operator: 'gt',
      threshold: 1.5, // 150% da média
      severity: 'high',
      suggestedAction: 'Investigar causa raiz do pico de anomalias. Verificar mudanças recentes no sistema.',
    },
  },
];

/**
 * Criar nova regra de deteção
 */
export async function createAnomalyRule(config: AnomalyRuleConfig): Promise<AnomalyRuleConfig> {
  const newRule = {
    id: crypto.randomUUID(),
    ...config,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Aqui você inseriria no banco de dados
  // await db.insert(anomalyRules).values(newRule);

  return newRule;
}

/**
 * Atualizar regra existente
 */
export async function updateAnomalyRule(
  ruleId: string,
  updates: Partial<AnomalyRuleConfig>
): Promise<AnomalyRuleConfig> {
  const updatedRule = {
    ...updates,
    updatedAt: new Date(),
  };

  // await db.update(anomalyRules).set(updatedRule).where(eq(anomalyRules.id, ruleId));

  return updatedRule as AnomalyRuleConfig;
}

/**
 * Obter todas as regras
 */
export async function getAllAnomalyRules(): Promise<AnomalyRuleConfig[]> {
  // const rules = await db.select().from(anomalyRules).orderBy(desc(anomalyRules.createdAt));
  // return rules;
  return [];
}

/**
 * Obter regras ativas
 */
export async function getActiveAnomalyRules(): Promise<AnomalyRuleConfig[]> {
  // const rules = await db
  //   .select()
  //   .from(anomalyRules)
  //   .where(eq(anomalyRules.enabled, true))
  //   .orderBy(desc(anomalyRules.severity));
  // return rules;
  return [];
}

/**
 * Validar regra antes de salvar
 */
export function validateAnomalyRule(config: AnomalyRuleConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push('Nome da regra é obrigatório');
  }

  if (!config.metric || config.metric.trim().length === 0) {
    errors.push('Métrica é obrigatória');
  }

  if (!['threshold', 'deviation', 'pattern', 'custom'].includes(config.ruleType)) {
    errors.push('Tipo de regra inválido');
  }

  if (!['gt', 'lt', 'eq', 'gte', 'lte', 'between'].includes(config.operator)) {
    errors.push('Operador inválido');
  }

  if (config.operator === 'between' && (!config.threshold || !config.thresholdMax)) {
    errors.push('Para operador "between", ambos os limites são obrigatórios');
  }

  if (config.threshold === undefined || config.threshold === null) {
    errors.push('Limite (threshold) é obrigatório');
  }

  if (!['high', 'medium', 'low'].includes(config.severity)) {
    errors.push('Severidade inválida');
  }

  if (!config.suggestedAction || config.suggestedAction.trim().length === 0) {
    errors.push('Ação sugerida é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Testar regra com dados de exemplo
 */
export async function testAnomalyRule(
  rule: AnomalyRuleConfig,
  testValue: number
): Promise<{ triggered: boolean; reason: string }> {
  let triggered = false;
  let reason = '';

  switch (rule.operator) {
    case 'gt':
      triggered = testValue > rule.threshold;
      reason = triggered ? `Valor ${testValue} é maior que ${rule.threshold}` : `Valor ${testValue} não é maior que ${rule.threshold}`;
      break;
    case 'lt':
      triggered = testValue < rule.threshold;
      reason = triggered ? `Valor ${testValue} é menor que ${rule.threshold}` : `Valor ${testValue} não é menor que ${rule.threshold}`;
      break;
    case 'eq':
      triggered = testValue === rule.threshold;
      reason = triggered ? `Valor ${testValue} é igual a ${rule.threshold}` : `Valor ${testValue} não é igual a ${rule.threshold}`;
      break;
    case 'gte':
      triggered = testValue >= rule.threshold;
      reason = triggered ? `Valor ${testValue} é maior ou igual a ${rule.threshold}` : `Valor ${testValue} não é maior ou igual a ${rule.threshold}`;
      break;
    case 'lte':
      triggered = testValue <= rule.threshold;
      reason = triggered ? `Valor ${testValue} é menor ou igual a ${rule.threshold}` : `Valor ${testValue} não é menor ou igual a ${rule.threshold}`;
      break;
    case 'between':
      triggered = testValue >= rule.threshold && testValue <= (rule.thresholdMax || rule.threshold);
      reason = triggered
        ? `Valor ${testValue} está entre ${rule.threshold} e ${rule.thresholdMax}`
        : `Valor ${testValue} não está entre ${rule.threshold} e ${rule.thresholdMax}`;
      break;
  }

  return { triggered, reason };
}

/**
 * Obter templates de regras
 */
export function getRuleTemplates(category?: string): RuleTemplate[] {
  if (category) {
    return RULE_TEMPLATES.filter((t) => t.category === category);
  }
  return RULE_TEMPLATES;
}

/**
 * Criar regra a partir de template
 */
export async function createRuleFromTemplate(
  templateId: string,
  customizations?: Partial<AnomalyRuleConfig>
): Promise<AnomalyRuleConfig> {
  const template = RULE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template não encontrado: ${templateId}`);
  }

  const ruleConfig: AnomalyRuleConfig = {
    ...template.config,
    ...customizations,
    name: customizations?.name || template.name,
    description: customizations?.description || template.description,
    enabled: customizations?.enabled !== undefined ? customizations.enabled : true,
    createdBy: customizations?.createdBy || 'system',
  } as AnomalyRuleConfig;

  const validation = validateAnomalyRule(ruleConfig);
  if (!validation.valid) {
    throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
  }

  return createAnomalyRule(ruleConfig);
}

/**
 * Deletar regra
 */
export async function deleteAnomalyRule(ruleId: string): Promise<boolean> {
  // await db.delete(anomalyRules).where(eq(anomalyRules.id, ruleId));
  return true;
}

/**
 * Duplicar regra existente
 */
export async function duplicateAnomalyRule(ruleId: string, newName: string): Promise<AnomalyRuleConfig> {
  // const originalRule = await db.select().from(anomalyRules).where(eq(anomalyRules.id, ruleId));
  // if (!originalRule || originalRule.length === 0) {
  //   throw new Error(`Regra não encontrada: ${ruleId}`);
  // }

  // const newRule = {
  //   ...originalRule[0],
  //   id: crypto.randomUUID(),
  //   name: newName,
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // };

  // await db.insert(anomalyRules).values(newRule);
  // return newRule;

  return {} as AnomalyRuleConfig;
}
