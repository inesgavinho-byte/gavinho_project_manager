import * as deliveriesDb from "./deliveriesDb";
import { notifyOwner } from "./_core/notification";

/**
 * Check for deliveries needing notification (3 days before due date)
 * and send notifications to owner
 */
export async function checkAndNotifyDeliveries() {
  try {
    const deliveries = await deliveriesDb.getDeliveriesNeedingNotification();
    
    if (deliveries.length === 0) {
      console.log("[DeliveryNotification] No deliveries need notification");
      return { notified: 0 };
    }

    console.log(`[DeliveryNotification] Found ${deliveries.length} deliveries needing notification`);

    let notifiedCount = 0;

    for (const delivery of deliveries) {
      try {
        const daysUntilDue = Math.ceil(
          (new Date(delivery.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        const success = await notifyOwner({
          title: `⏰ Entrega Próxima: ${delivery.name}`,
          content: `A entrega "${delivery.name}" está prevista para ${new Date(delivery.dueDate).toLocaleDateString("pt-PT")} (em ${daysUntilDue} dias).\n\nPrioridade: ${delivery.priority}\nStatus: ${delivery.status}`,
        });

        if (success) {
          await deliveriesDb.markNotificationSent(delivery.id);
          notifiedCount++;
          console.log(`[DeliveryNotification] Notified for delivery ${delivery.id}: ${delivery.name}`);
        } else {
          console.warn(`[DeliveryNotification] Failed to notify for delivery ${delivery.id}`);
        }
      } catch (error) {
        console.error(`[DeliveryNotification] Error notifying delivery ${delivery.id}:`, error);
      }
    }

    console.log(`[DeliveryNotification] Successfully notified ${notifiedCount}/${deliveries.length} deliveries`);
    return { notified: notifiedCount, total: deliveries.length };
  } catch (error) {
    console.error("[DeliveryNotification] Error in checkAndNotifyDeliveries:", error);
    throw error;
  }
}

/**
 * Schedule periodic checks (should be called from a cron job or scheduled task)
 * Recommended: Run once per day at 9:00 AM
 */
export async function scheduleDeliveryNotifications() {
  console.log("[DeliveryNotification] Running scheduled notification check");
  return checkAndNotifyDeliveries();
}
