import { getDb } from "./db";
import { tasks, mqtAlerts, mqtLines, users, projects } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notifyMQTTaskGenerated, notifyProjectTeamMQTTask, notifyOwnerMQTTask, notifyBulkMQTTasksGenerated, notifyMQTProcessingStatus } from "./mqtNotificationService";

export interface MQTTaskAutomationConfig {
  projectId: number;
  enableAutoTaskGeneration: boolean;
  criticalThreshold: number; // percentage
  warningThreshold: number; // percentage
  autoAssignToUserId?: number;
  taskPriority: "low" | "medium" | "high" | "urgent";
  taskDueOffsetDays: number; // days from now
}

export interface GeneratedTaskInfo {
  taskId: number;
  title: string;
  description: string;
  priority: string;
  assignedToId?: number;
  dueDate: string;
}

/**
 * Gera uma tarefa automaticamente quando uma discrepância é detetada
 */
export async function generateTaskFromMQTAlert(
  alert: {
    id: number;
    mqtLineId: number;
    projectId: number;
    alertType: string;
    severity: string;
    message?: string;
  },
  config: MQTTaskAutomationConfig
): Promise<GeneratedTaskInfo | null> {
  try {
    if (!config.enableAutoTaskGeneration) {
      return null;
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Obter dados da linha MQT
    const mqtLine = await db
      .select()
      .from(mqtLines)
      .where(eq(mqtLines.id, alert.mqtLineId))
      .limit(1);

    if (!mqtLine || mqtLine.length === 0) {
      throw new Error(`MQT Line ${alert.mqtLineId} not found`);
    }

    const line = mqtLine[0];

    // Calcular variância
    const planned = parseFloat(String(line.plannedQuantity));
    const executed = parseFloat(String(line.executedQuantity));
    const variance = executed - planned;
    const variancePercentage = (variance / planned) * 100;

    // Construir título e descrição da tarefa
    const taskTitle = `MQT: Discrepância em ${line.itemCode}`;
    const taskDescription = `
Discrepância detetada no Mapa de Quantidades

**Item:** ${line.itemCode}
**Descrição:** ${line.itemDescription || "N/A"}
**Planejado:** ${planned} ${line.unit || ""}
**Executado:** ${executed} ${line.unit || ""}
**Variância:** ${variance > 0 ? "+" : ""}${variance.toFixed(2)} (${variancePercentage.toFixed(1)}%)

**Tipo de Alerta:** ${alert.alertType}
**Severidade:** ${alert.severity}
${alert.message ? `**Mensagem:** ${alert.message}` : ""}

**Ação Recomendada:** Investigar a causa da discrepância e tomar medidas corretivas.
    `.trim();

    // Determinar prioridade com base na severidade
    let priority = config.taskPriority;
    if (alert.severity === "critical") {
      priority = "urgent";
    } else if (alert.severity === "high") {
      priority = "high";
    } else if (alert.severity === "medium") {
      priority = "medium";
    } else {
      priority = "low";
    }

    // Calcular data de vencimento
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + config.taskDueOffsetDays);

    // Criar tarefa
    const result = await db!.insert(tasks).values({
      projectId: config.projectId,
      title: taskTitle,
      description: taskDescription,
      status: "todo",
      priority: priority as any,
      urgency: alert.severity === "critical" ? "high" : "medium",
      importance: alert.severity === "critical" ? "high" : "medium",
      assignedToId: config.autoAssignToUserId || null,
      dueDate: dueDate.toISOString(),
      createdById: null, // Sistema
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const taskId = (result as any)[0].insertId as number;
    const taskInfo = {
      taskId,
      title: taskTitle,
      description: taskDescription,
      priority,
      assignedToId: config.autoAssignToUserId,
      dueDate: dueDate.toISOString(),
    };

    try {
      const notificationPayload = {
        taskId,
        title: taskTitle,
        description: taskDescription,
        priority,
        severity: alert.severity as any,
        itemCode: line.itemCode,
        variance: variance,
        variancePercentage: variancePercentage,
        plannedQuantity: planned,
        executedQuantity: executed,
        projectId: config.projectId,
        assignedToId: config.autoAssignToUserId,
        dueDate: dueDate.toISOString(),
      };

      if (config.autoAssignToUserId) {
        await notifyMQTTaskGenerated(config.autoAssignToUserId, notificationPayload);
      }
      await notifyProjectTeamMQTTask(config.projectId, notificationPayload);
      await notifyOwnerMQTTask(notificationPayload);
    } catch (notificationError) {
      console.error("Erro ao enviar notificacoes de tarefa MQT:", notificationError);
    }

    return taskInfo;
  } catch (error) {
    console.error("Erro ao gerar tarefa a partir de alerta MQT:", error);
    throw error;
  }
}

/**
 * Processa todos os alertas não resolvidos e gera tarefas
 */
export async function processUnresolvedMQTAlerts(
  projectId: number,
  config: MQTTaskAutomationConfig
): Promise<GeneratedTaskInfo[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const unresolvedAlerts = await db
      .select()
      .from(mqtAlerts)
      .where(
        and(
          eq(mqtAlerts.projectId, projectId),
          eq(mqtAlerts.isResolved, 0)
        )
      );

    await notifyMQTProcessingStatus(projectId, "started");

    const generatedTasks: GeneratedTaskInfo[] = [];

    for (const alert of unresolvedAlerts) {
      try {
        const taskInfo = await generateTaskFromMQTAlert(alert, config);
        if (taskInfo) {
          generatedTasks.push(taskInfo);
        }
      } catch (error) {
        console.error(`Erro ao processar alerta ${alert.id}:`, error);
      }
    }

    await notifyMQTProcessingStatus(projectId, "completed", {
      tasksGenerated: generatedTasks.length,
      timestamp: new Date().toISOString(),
    });

    return generatedTasks;
  } catch (error) {
    console.error("Erro ao processar alertas MQT não resolvidos:", error);
    throw error;
  }
}

/**
 * Obtém configuração de automação para um projeto
 */
export async function getMQTAutomationConfig(
  projectId: number
): Promise<MQTTaskAutomationConfig> {
  // Por enquanto, retorna configuração padrão
  // Futuramente, pode ser armazenada em banco de dados
  return {
    projectId,
    enableAutoTaskGeneration: true,
    criticalThreshold: 10, // 10%
    warningThreshold: 5, // 5%
    taskPriority: "high",
    taskDueOffsetDays: 3,
  };
}

/**
 * Atualiza configuração de automação para um projeto
 */
export async function updateMQTAutomationConfig(
  projectId: number,
  config: Partial<MQTTaskAutomationConfig>
): Promise<MQTTaskAutomationConfig> {
  // Futuramente, armazenar em banco de dados
  const currentConfig = await getMQTAutomationConfig(projectId);
  return { ...currentConfig, ...config, projectId };
}

/**
 * Conta tarefas geradas a partir de alertas MQT
 */
export async function countMQTGeneratedTasks(projectId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    return result.filter((t) => t.title.includes("MQT:")).length;
  } catch (error) {
    console.error("Erro ao contar tarefas MQT geradas:", error);
    return 0;
  }
}

/**
 * Obtém tarefas geradas a partir de alertas MQT
 */
export async function getMQTGeneratedTasks(
  projectId: number,
  limit: number = 10
): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .limit(limit);

    return result.filter((t) => t.title.includes("MQT:"));
  } catch (error) {
    console.error("Erro ao obter tarefas MQT geradas:", error);
    return [];
  }
}

/**
 * Vincula uma tarefa a um alerta MQT (para rastreamento)
 * Nota: Pode ser necessário adicionar uma coluna taskId à tabela mqtAlerts
 */
export async function linkTaskToMQTAlert(
  alertId: number,
  taskId: number
): Promise<void> {
  try {
    // Futuramente, atualizar tabela mqtAlerts com taskId
    console.log(`Linking task ${taskId} to alert ${alertId}`);
  } catch (error) {
    console.error("Erro ao vincular tarefa a alerta MQT:", error);
    throw error;
  }
}
