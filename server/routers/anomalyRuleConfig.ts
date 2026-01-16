import { router, protectedProcedure } from './trpc';
import { z } from 'zod';
import {
  createAnomalyRule,
  updateAnomalyRule,
  getAllAnomalyRules,
  getActiveAnomalyRules,
  validateAnomalyRule,
  testAnomalyRule,
  getRuleTemplates,
  createRuleFromTemplate,
  deleteAnomalyRule,
  duplicateAnomalyRule,
  type AnomalyRuleConfig,
} from '../anomalyRuleConfigService';

const AnomalyRuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  ruleType: z.enum(['threshold', 'deviation', 'pattern', 'custom']),
  metric: z.string().min(1, 'Métrica é obrigatória'),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'between']),
  threshold: z.number(),
  thresholdMax: z.number().optional(),
  severity: z.enum(['high', 'medium', 'low']),
  enabled: z.boolean().default(true),
  notifyManagers: z.boolean().default(true),
  notifyDirectors: z.boolean().default(false),
  notifyAdmins: z.boolean().default(false),
  escalateAfterDays: z.number().optional(),
  suggestedAction: z.string().min(1, 'Ação sugerida é obrigatória'),
});

export const anomalyRuleConfigRouter = router({
  /**
   * Criar nova regra de deteção
   */
  createRule: protectedProcedure
    .input(AnomalyRuleSchema)
    .mutation(async ({ input, ctx }) => {
      const validation = validateAnomalyRule({
        ...input,
        createdBy: ctx.user.id,
      });

      if (!validation.valid) {
        throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
      }

      const rule = await createAnomalyRule({
        ...input,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        rule,
        message: 'Regra criada com sucesso',
      };
    }),

  /**
   * Atualizar regra existente
   */
  updateRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        updates: AnomalyRuleSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rule = await updateAnomalyRule(input.ruleId, input.updates);

      return {
        success: true,
        rule,
        message: 'Regra atualizada com sucesso',
      };
    }),

  /**
   * Obter todas as regras
   */
  getAllRules: protectedProcedure.query(async () => {
    const rules = await getAllAnomalyRules();

    return {
      rules,
      total: rules.length,
    };
  }),

  /**
   * Obter regras ativas
   */
  getActiveRules: protectedProcedure.query(async () => {
    const rules = await getActiveAnomalyRules();

    return {
      rules,
      total: rules.length,
    };
  }),

  /**
   * Validar regra
   */
  validateRule: protectedProcedure
    .input(AnomalyRuleSchema)
    .query(({ input }) => {
      const validation = validateAnomalyRule({
        ...input,
        createdBy: 'test',
      });

      return {
        valid: validation.valid,
        errors: validation.errors,
      };
    }),

  /**
   * Testar regra com valor de teste
   */
  testRule: protectedProcedure
    .input(
      z.object({
        rule: AnomalyRuleSchema,
        testValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      const result = await testAnomalyRule(
        {
          ...input.rule,
          createdBy: 'test',
        },
        input.testValue
      );

      return result;
    }),

  /**
   * Obter templates de regras
   */
  getTemplates: protectedProcedure
    .input(
      z.object({
        category: z.enum(['performance', 'compliance', 'resource', 'custom']).optional(),
      })
    )
    .query(({ input }) => {
      const templates = getRuleTemplates(input.category);

      return {
        templates,
        total: templates.length,
      };
    }),

  /**
   * Criar regra a partir de template
   */
  createFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        customizations: AnomalyRuleSchema.partial().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rule = await createRuleFromTemplate(input.templateId, {
        ...input.customizations,
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        rule,
        message: 'Regra criada a partir de template com sucesso',
      };
    }),

  /**
   * Deletar regra
   */
  deleteRule: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await deleteAnomalyRule(input.ruleId);

      return {
        success,
        message: success ? 'Regra deletada com sucesso' : 'Erro ao deletar regra',
      };
    }),

  /**
   * Duplicar regra
   */
  duplicateRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        newName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const rule = await duplicateAnomalyRule(input.ruleId, input.newName);

      return {
        success: true,
        rule,
        message: 'Regra duplicada com sucesso',
      };
    }),

  /**
   * Ativar/Desativar regra
   */
  toggleRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const rule = await updateAnomalyRule(input.ruleId, {
        enabled: input.enabled,
      });

      return {
        success: true,
        rule,
        message: input.enabled ? 'Regra ativada' : 'Regra desativada',
      };
    }),

  /**
   * Obter estatísticas de regras
   */
  getRuleStatistics: protectedProcedure.query(async () => {
    const allRules = await getAllAnomalyRules();
    const activeRules = await getActiveAnomalyRules();

    const statistics = {
      totalRules: allRules.length,
      activeRules: activeRules.length,
      disabledRules: allRules.length - activeRules.length,
      rulesByType: {
        threshold: allRules.filter((r) => r.ruleType === 'threshold').length,
        deviation: allRules.filter((r) => r.ruleType === 'deviation').length,
        pattern: allRules.filter((r) => r.ruleType === 'pattern').length,
        custom: allRules.filter((r) => r.ruleType === 'custom').length,
      },
      rulesBySeverity: {
        high: allRules.filter((r) => r.severity === 'high').length,
        medium: allRules.filter((r) => r.severity === 'medium').length,
        low: allRules.filter((r) => r.severity === 'low').length,
      },
    };

    return statistics;
  }),
});
