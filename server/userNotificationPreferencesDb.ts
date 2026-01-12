import { getDb } from "./db";
import { userNotificationPreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface UserNotificationPreferencesInput {
  userId: number;
  enabledSupplierEvaluated?: boolean;
  enabledProjectStatusChanged?: boolean;
  enabledProjectCompleted?: boolean;
  enabledDeadlineAlert?: boolean;
  enabledBudgetAlert?: boolean;
  enabledOrderUpdate?: boolean;
  enabledTaskAssigned?: boolean;
  frequency?: "immediate" | "daily" | "weekly";
  enableEmailNotifications?: boolean;
  enablePushNotifications?: boolean;
  enableInAppNotifications?: boolean;
}

/**
 * Obtém as preferências de notificação de um usuário
 */
export async function getUserNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId));

  return result[0] || null;
}

/**
 * Cria as preferências de notificação padrão para um novo usuário
 */
export async function createDefaultUserNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();

  return db.insert(userNotificationPreferences).values({
    userId,
    enabledSupplierEvaluated: 1,
    enabledProjectStatusChanged: 1,
    enabledProjectCompleted: 1,
    enabledDeadlineAlert: 1,
    enabledBudgetAlert: 1,
    enabledOrderUpdate: 1,
    enabledTaskAssigned: 1,
    frequency: "immediate",
    enableEmailNotifications: 1,
    enablePushNotifications: 1,
    enableInAppNotifications: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}

/**
 * Atualiza as preferências de notificação de um usuário
 */
export async function updateUserNotificationPreferences(
  userId: number,
  input: Partial<UserNotificationPreferencesInput>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Verificar se já existe registro
  const existing = await getUserNotificationPreferences(userId);

  if (!existing) {
    // Criar com valores padrão se não existir
    await createDefaultUserNotificationPreferences(userId);
  }

  const updateData: any = {};

  if (input.enabledSupplierEvaluated !== undefined) {
    updateData.enabledSupplierEvaluated = input.enabledSupplierEvaluated ? 1 : 0;
  }
  if (input.enabledProjectStatusChanged !== undefined) {
    updateData.enabledProjectStatusChanged = input.enabledProjectStatusChanged ? 1 : 0;
  }
  if (input.enabledProjectCompleted !== undefined) {
    updateData.enabledProjectCompleted = input.enabledProjectCompleted ? 1 : 0;
  }
  if (input.enabledDeadlineAlert !== undefined) {
    updateData.enabledDeadlineAlert = input.enabledDeadlineAlert ? 1 : 0;
  }
  if (input.enabledBudgetAlert !== undefined) {
    updateData.enabledBudgetAlert = input.enabledBudgetAlert ? 1 : 0;
  }
  if (input.enabledOrderUpdate !== undefined) {
    updateData.enabledOrderUpdate = input.enabledOrderUpdate ? 1 : 0;
  }
  if (input.enabledTaskAssigned !== undefined) {
    updateData.enabledTaskAssigned = input.enabledTaskAssigned ? 1 : 0;
  }
  if (input.frequency !== undefined) {
    updateData.frequency = input.frequency;
  }
  if (input.enableEmailNotifications !== undefined) {
    updateData.enableEmailNotifications = input.enableEmailNotifications ? 1 : 0;
  }
  if (input.enablePushNotifications !== undefined) {
    updateData.enablePushNotifications = input.enablePushNotifications ? 1 : 0;
  }
  if (input.enableInAppNotifications !== undefined) {
    updateData.enableInAppNotifications = input.enableInAppNotifications ? 1 : 0;
  }

  updateData.updatedAt = new Date().toISOString();

  return db
    .update(userNotificationPreferences)
    .set(updateData)
    .where(eq(userNotificationPreferences.userId, userId));
}

/**
 * Ativa ou desativa um tipo específico de notificação
 */
export async function toggleNotificationType(
  userId: number,
  notificationType: string,
  enabled: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Verificar se já existe registro
  const existing = await getUserNotificationPreferences(userId);

  if (!existing) {
    // Criar com valores padrão se não existir
    await createDefaultUserNotificationPreferences(userId);
  }

  const fieldMap: Record<string, string> = {
    supplier_evaluated: "enabledSupplierEvaluated",
    project_status_changed: "enabledProjectStatusChanged",
    project_completed: "enabledProjectCompleted",
    deadline_alert: "enabledDeadlineAlert",
    budget_alert: "enabledBudgetAlert",
    order_update: "enabledOrderUpdate",
    task_assigned: "enabledTaskAssigned",
  };

  const field = fieldMap[notificationType];
  if (!field) {
    throw new Error(`Unknown notification type: ${notificationType}`);
  }

  const updateData: any = {};
  updateData[field] = enabled ? 1 : 0;
  updateData.updatedAt = new Date().toISOString();

  return db
    .update(userNotificationPreferences)
    .set(updateData)
    .where(eq(userNotificationPreferences.userId, userId));
}

/**
 * Define a frequência de notificações para um usuário
 */
export async function setNotificationFrequency(
  userId: number,
  frequency: "immediate" | "daily" | "weekly"
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Verificar se já existe registro
  const existing = await getUserNotificationPreferences(userId);

  if (!existing) {
    // Criar com valores padrão se não existir
    await createDefaultUserNotificationPreferences(userId);
  }

  return db
    .update(userNotificationPreferences)
    .set({
      frequency,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userNotificationPreferences.userId, userId));
}

/**
 * Ativa ou desativa um canal de notificação
 */
export async function toggleNotificationChannel(
  userId: number,
  channel: "email" | "push" | "inApp",
  enabled: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Verificar se já existe registro
  const existing = await getUserNotificationPreferences(userId);

  if (!existing) {
    // Criar com valores padrão se não existir
    await createDefaultUserNotificationPreferences(userId);
  }

  const fieldMap: Record<string, string> = {
    email: "enableEmailNotifications",
    push: "enablePushNotifications",
    inApp: "enableInAppNotifications",
  };

  const field = fieldMap[channel];
  if (!field) {
    throw new Error(`Unknown notification channel: ${channel}`);
  }

  const updateData: any = {};
  updateData[field] = enabled ? 1 : 0;
  updateData.updatedAt = new Date().toISOString();

  return db
    .update(userNotificationPreferences)
    .set(updateData)
    .where(eq(userNotificationPreferences.userId, userId));
}

/**
 * Reseta as preferências de notificação para os valores padrão
 */
export async function resetNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .update(userNotificationPreferences)
    .set({
      enabledSupplierEvaluated: 1,
      enabledProjectStatusChanged: 1,
      enabledProjectCompleted: 1,
      enabledDeadlineAlert: 1,
      enabledBudgetAlert: 1,
      enabledOrderUpdate: 1,
      enabledTaskAssigned: 1,
      frequency: "immediate",
      enableEmailNotifications: 1,
      enablePushNotifications: 1,
      enableInAppNotifications: 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userNotificationPreferences.userId, userId));
}
