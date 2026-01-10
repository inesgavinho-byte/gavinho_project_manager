/**
 * Notification Scheduler Service
 * Automatically runs notification checks at scheduled times
 */

import cron from "node-cron";
import { runAutoNotifications } from "./autoNotificationService";

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the notification scheduler
 * Runs daily at 9:00 AM
 */
export function startNotificationScheduler() {
  // Stop existing task if any
  if (scheduledTask) {
    scheduledTask.stop();
  }

  // Schedule task to run every day at 9:00 AM
  // Cron format: second minute hour day month dayOfWeek
  // "0 0 9 * * *" = At 9:00 AM every day
  scheduledTask = cron.schedule(
    "0 0 9 * * *",
    async () => {
      console.log("[Notification Scheduler] Running daily notification checks at", new Date().toISOString());
      
      try {
        const result = await runAutoNotifications();
        console.log("[Notification Scheduler] Completed:", result);
      } catch (error) {
        console.error("[Notification Scheduler] Error running notifications:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Europe/Lisbon", // Portugal timezone
    }
  );

  console.log("[Notification Scheduler] Started - will run daily at 9:00 AM (Europe/Lisbon)");
  
  return scheduledTask;
}

/**
 * Stop the notification scheduler
 */
export function stopNotificationScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Notification Scheduler] Stopped");
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): { running: boolean; nextRun?: string } {
  if (!scheduledTask) {
    return { running: false };
  }

  // Calculate next run time (next 9:00 AM)
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(9, 0, 0, 0);
  
  // If it's already past 9 AM today, schedule for tomorrow
  if (now.getHours() >= 9) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return {
    running: true,
    nextRun: nextRun.toISOString(),
  };
}

/**
 * Run notification check manually (for testing)
 */
export async function runManualCheck() {
  console.log("[Notification Scheduler] Running manual notification check");
  
  try {
    const result = await runAutoNotifications();
    console.log("[Notification Scheduler] Manual check completed:", result);
    return result;
  } catch (error) {
    console.error("[Notification Scheduler] Error in manual check:", error);
    throw error;
  }
}
