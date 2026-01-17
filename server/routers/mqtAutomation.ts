import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generateTaskFromMQTAlert,
  processUnresolvedMQTAlerts,
  getMQTAutomationConfig,
  updateMQTAutomationConfig,
  countMQTGeneratedTasks,
  getMQTGeneratedTasks,
} from "../mqtTaskAutomationService";

export const mqtAutomationRouter = router({
  /**
   * Gera uma tarefa a partir de um alerta MQT específico
   */
  generateTaskFromAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
        projectId: z.number(),
        alertType: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        message: z.string().optional(),
        mqtLineId: z.number(),
        autoAssignToUserId: z.number().optional(),
        taskPriority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        taskDueOffsetDays: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (!ctx.user) throw new Error("Unauthorized");

      const config = await getMQTAutomationConfig(input.projectId);

      if (input.autoAssignToUserId) {
        config.autoAssignToUserId = input.autoAssignToUserId;
      }
      if (input.taskPriority) {
        config.taskPriority = input.taskPriority;
      }
      if (input.taskDueOffsetDays) {
        config.taskDueOffsetDays = input.taskDueOffsetDays;
      }

      const alert = {
        id: input.alertId,
        mqtLineId: input.mqtLineId,
        projectId: input.projectId,
        alertType: input.alertType,
        severity: input.severity,
        message: input.message,
      };

      const taskInfo = await generateTaskFromMQTAlert(alert, config);

      return {
        success: true,
        data: taskInfo,
      };
    }),

  /**
   * Processa todos os alertas não resolvidos e gera tarefas
   */
  processAllUnresolvedAlerts: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        autoAssignToUserId: z.number().optional(),
        taskPriority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        taskDueOffsetDays: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar permissão
      if (!ctx.user) throw new Error("Unauthorized");

      const config = await getMQTAutomationConfig(input.projectId);

      if (input.autoAssignToUserId) {
        config.autoAssignToUserId = input.autoAssignToUserId;
      }
      if (input.taskPriority) {
        config.taskPriority = input.taskPriority;
      }
      if (input.taskDueOffsetDays) {
        config.taskDueOffsetDays = input.taskDueOffsetDays;
      }

      const generatedTasks = await processUnresolvedMQTAlerts(
        input.projectId,
        config
      );

      return {
        success: true,
        data: {
          tasksGenerated: generatedTasks.length,
          tasks: generatedTasks,
        },
      };
    }),

  /**
   * Obtém configuração de automação para um projeto
   */
  getAutomationConfig: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const config = await getMQTAutomationConfig(input.projectId);

      return {
        success: true,
        data: config,
      };
    }),

  /**
   * Atualiza configuração de automação para um projeto
   */
  updateAutomationConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        enableAutoTaskGeneration: z.boolean().optional(),
        criticalThreshold: z.number().optional(),
        warningThreshold: z.number().optional(),
        autoAssignToUserId: z.number().optional(),
        taskPriority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        taskDueOffsetDays: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const { projectId, ...configUpdates } = input;

      const updatedConfig = await updateMQTAutomationConfig(
        projectId,
        configUpdates
      );

      return {
        success: true,
        data: updatedConfig,
      };
    }),

  /**
   * Conta tarefas geradas a partir de alertas MQT
   */
  countGeneratedTasks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const count = await countMQTGeneratedTasks(input.projectId);

      return {
        success: true,
        data: { count },
      };
    }),

  /**
   * Obtém tarefas geradas a partir de alertas MQT
   */
  getGeneratedTasks: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const tasks = await getMQTGeneratedTasks(
        input.projectId,
        input.limit || 10
      );

      return {
        success: true,
        data: tasks,
      };
    }),

  /**
   * Ativa automação de tarefas para um projeto
   */
  enableAutomation: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const config = await updateMQTAutomationConfig(input.projectId, {
        enableAutoTaskGeneration: true,
      });

      return {
        success: true,
        data: config,
      };
    }),

  /**
   * Desativa automação de tarefas para um projeto
   */
  disableAutomation: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const config = await updateMQTAutomationConfig(input.projectId, {
        enableAutoTaskGeneration: false,
      });

      return {
        success: true,
        data: config,
      };
    }),
});
