import * as deliveriesDb from "./deliveriesDb";
import * as notificationDb from "./notificationDb";
import { notifyOwner } from "./_core/notification";

/**
 * Checklist Templates por tipo de entrega
 */
const CHECKLIST_TEMPLATES: Record<string, Array<{ title: string; description?: string }>> = {
  document: [
    { title: "Documento completo e bem formatado" },
    { title: "Revisão ortográfica e gramatical" },
    { title: "Referências e citações corretas" },
    { title: "Índice e numeração de páginas" },
    { title: "Aprovação interna" },
  ],
  drawing: [
    { title: "Desenho técnico completo" },
    { title: "Escalas e dimensões corretas" },
    { title: "Legendas e anotações" },
    { title: "Formato e qualidade de impressão" },
    { title: "Revisão técnica" },
  ],
  render: [
    { title: "Render em alta resolução" },
    { title: "Iluminação e materiais realistas" },
    { title: "Perspectivas múltiplas" },
    { title: "Sem artefatos ou erros visuais" },
    { title: "Aprovação criativa" },
  ],
  model: [
    { title: "Modelo 3D completo" },
    { title: "Geometria precisa" },
    { title: "Materiais e texturas aplicadas" },
    { title: "Otimização de performance" },
    { title: "Testes de compatibilidade" },
  ],
  report: [
    { title: "Análise completa" },
    { title: "Gráficos e visualizações" },
    { title: "Conclusões e recomendações" },
    { title: "Revisão de dados" },
    { title: "Aprovação executiva" },
  ],
  specification: [
    { title: "Especificações técnicas completas" },
    { title: "Normas e standards aplicados" },
    { title: "Tolerâncias e limites definidos" },
    { title: "Testes de validação" },
    { title: "Aprovação de qualidade" },
  ],
  other: [
    { title: "Conteúdo completo" },
    { title: "Qualidade e formatação" },
    { title: "Revisão interna" },
    { title: "Aprovação final" },
  ],
};

/**
 * Gerar checklist automático para uma entrega
 */
export async function generateChecklistForDelivery(deliveryId: number, deliveryType: string) {
  try {
    const template = CHECKLIST_TEMPLATES[deliveryType] || CHECKLIST_TEMPLATES.other;
    
    const checklistResult = await deliveriesDb.createDeliveryChecklist({
      deliveryId,
      deliveryType,
      title: `Checklist de ${deliveryType}`,
      description: `Checklist automático para entrega do tipo ${deliveryType}`,
    });

    const checklistId = Array.isArray(checklistResult) ? checklistResult[0].insertId : checklistResult;
    for (let i = 0; i < template.length; i++) {
      const item = template[i];
      await deliveriesDb.addChecklistItem({
        checklistId: Number(checklistId),
        title: item.title,
        description: item.description,
        order: i + 1,
      });
    }

    return { success: true, checklistId };
  } catch (error) {
    console.error("Error generating checklist:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Criar lembretes automáticos para uma entrega
 */
export async function createRemindersForDelivery(deliveryId: number, dueDate: Date) {
  try {
    const reminders = [
      { type: "7_days_before", daysOffset: -7 },
      { type: "3_days_before", daysOffset: -3 },
      { type: "1_day_before", daysOffset: -1 },
      { type: "1_day_after", daysOffset: 1 },
      { type: "3_days_after", daysOffset: 3 },
      { type: "7_days_after", daysOffset: 7 },
    ];

    for (const reminder of reminders) {
      const scheduledDate = new Date(dueDate);
      scheduledDate.setDate(scheduledDate.getDate() + reminder.daysOffset);

      await deliveriesDb.createDeliveryReminder({
        deliveryId,
        reminderType: reminder.type as any,
        scheduledFor: scheduledDate,
      });
    }

    return { success: true, remindersCreated: reminders.length };
  } catch (error) {
    console.error("Error creating reminders:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Processar lembretes pendentes e enviar notificações
 */
export async function processPendingReminders() {
  try {
    const pendingReminders = await deliveriesDb.getPendingReminders();
    let processed = 0;

    for (const reminder of pendingReminders) {
      const delivery = await deliveriesDb.getDeliveryById(reminder.deliveryId);
      if (!delivery) continue;

      let message = "";
      let recipientId = delivery.assignedToId || delivery.uploadedById;

      switch (reminder.reminderType) {
        case "7_days_before":
          message = `Lembrete: Entrega "${delivery.name}" vence em 7 dias`;
          break;
        case "3_days_before":
          message = `Lembrete: Entrega "${delivery.name}" vence em 3 dias`;
          break;
        case "1_day_before":
          message = `Urgente: Entrega "${delivery.name}" vence amanhã`;
          break;
        case "1_day_after":
          message = `Acompanhamento: Entrega "${delivery.name}" venceu há 1 dia`;
          break;
        case "3_days_after":
          message = `Acompanhamento: Entrega "${delivery.name}" está atrasada há 3 dias`;
          break;
        case "7_days_after":
          message = `Alerta Crítico: Entrega "${delivery.name}" está atrasada há 7 dias`;
          break;
      }

      if (recipientId) {
        await deliveriesDb.createDeliveryNotification({
          deliveryId: reminder.deliveryId,
          type: reminder.reminderType.includes("before") ? "deadline_reminder" : "follow_up",
          recipientId,
          message,
        });
      }

      await deliveriesDb.markReminderAsSent(reminder.id);
      processed++;
    }

    return { success: true, processed };
  } catch (error) {
    console.error("Error processing reminders:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Verificar entregas atrasadas e enviar alertas
 */
export async function checkOverdueDeliveries() {
  try {
    const overdueDeliveries = await deliveriesDb.getOverdueDeliveries();
    let alerted = 0;

    for (const delivery of overdueDeliveries) {
      const now = new Date();
      const daysLate = Math.floor(
        (now.getTime() - delivery.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const recipientId = delivery.assignedToId || delivery.uploadedById;
      if (recipientId) {
        await deliveriesDb.createDeliveryNotification({
          deliveryId: delivery.id,
          type: "follow_up",
          recipientId,
          message: `Entrega "${delivery.name}" está ${daysLate} dias atrasada`,
        });
      }

      alerted++;
    }

    if (alerted > 0) {
      await notifyOwner({
        title: "Alerta de Entregas Atrasadas",
        content: `${alerted} entrega(s) estão atrasadas. Verifique o Dashboard.`,
      });
    }

    return { success: true, alerted };
  } catch (error) {
    console.error("Error checking overdue deliveries:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Verificar entregas próximas do prazo
 */
export async function checkUpcomingDeadlines(daysAhead: number = 7) {
  try {
    const upcomingDeliveries = await deliveriesDb.getUpcomingDeliveriesAdvanced(undefined, daysAhead);
    let notified = 0;

    for (const delivery of upcomingDeliveries) {
      const recipientId = delivery.assignedToId || delivery.uploadedById;
      if (!recipientId) continue;

      const daysUntilDue = Math.ceil(
        (delivery.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      await deliveriesDb.createDeliveryNotification({
        deliveryId: delivery.id,
        type: "deadline_reminder",
        recipientId,
        message: `Entrega "${delivery.name}" vence em ${daysUntilDue} dias`,
      });

      notified++;
    }

    return { success: true, notified };
  } catch (error) {
    console.error("Error checking upcoming deadlines:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Solicitar aprovação do cliente automaticamente
 */
export async function requestClientApprovalForDelivery(
  deliveryId: number,
  clientIds: number[]
) {
  try {
    const delivery = await deliveriesDb.getDeliveryById(deliveryId);
    if (!delivery) return { success: false, error: "Delivery not found" };

    let approvalRequests = 0;

    for (const clientId of clientIds) {
      await deliveriesDb.createClientApprovalRequest(deliveryId, clientId);

      await deliveriesDb.createDeliveryNotification({
        deliveryId,
        type: "approval_request",
        recipientId: clientId,
        message: `Solicitação de aprovação: "${delivery.name}" está pronta para revisão`,
      });

      approvalRequests++;
    }

    return { success: true, approvalRequests };
  } catch (error) {
    console.error("Error requesting client approval:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Notificar quando cliente aprova/rejeita entrega
 */
export async function notifyDeliveryApprovalStatus(
  deliveryId: number,
  approvalStatus: "approved" | "rejected" | "revision_requested",
  clientId: number
) {
  try {
    const delivery = await deliveriesDb.getDeliveryById(deliveryId);
    if (!delivery) return { success: false, error: "Delivery not found" };

    const recipientId = delivery.uploadedById;
    if (!recipientId) return { success: false, error: "No recipient found" };

    let message = "";
    let notificationType: "approval_received" | "rejection_notice" | "revision_requested" = "approval_received";

    switch (approvalStatus) {
      case "approved":
        message = `Entrega "${delivery.name}" foi aprovada pelo cliente`;
        notificationType = "approval_received";
        break;
      case "rejected":
        message = `Entrega "${delivery.name}" foi rejeitada pelo cliente`;
        notificationType = "rejection_notice";
        break;
      case "revision_requested":
        message = `Cliente solicitou revisão para "${delivery.name}"`;
        notificationType = "revision_requested";
        break;
    }

    await deliveriesDb.createDeliveryNotification({
      deliveryId,
      type: notificationType,
      recipientId,
      message,
    });

    return { success: true };
  } catch (error) {
    console.error("Error notifying approval status:", error);
    return { success: false, error: String(error) };
  }
}
