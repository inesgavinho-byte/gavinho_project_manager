import { getDb } from "./db";
import { calendarEvents, users, projects } from "../drizzle/schema";
import { and, gte, lte, eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Event Notification Service
 * Handles automatic reminders for calendar events
 */

interface EventReminder {
  eventId: number;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  eventType: string;
  location?: string | null;
  projectName?: string | null;
  userEmail: string;
  userName: string;
  reminderMinutes: number;
}

/**
 * Check for upcoming events that need reminders
 */
export async function checkUpcomingEvents(): Promise<EventReminder[]> {
  const db = await getDb();
  const now = new Date();
  
  // Check events in the next 2 hours
  const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const upcomingEvents = await db
    .select({
      eventId: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startDate: calendarEvents.startDate,
      endDate: calendarEvents.endDate,
      eventType: calendarEvents.eventType,
      location: calendarEvents.location,
      projectName: projects.name,
      userEmail: users.email,
      userName: users.name,
      reminderMinutes: calendarEvents.reminderMinutes,
    })
    .from(calendarEvents)
    .leftJoin(users, eq(calendarEvents.createdById, users.id))
    .leftJoin(projects, eq(calendarEvents.projectId, projects.id))
    .where(
      and(
        gte(calendarEvents.startDate, now),
        lte(calendarEvents.startDate, futureTime),
        eq(calendarEvents.status, "scheduled")
      )
    );

  // Filter events based on their reminder time
  const eventsNeedingReminders = upcomingEvents.filter((event) => {
    if (!event.reminderMinutes) return false;
    
    const reminderTime = new Date(event.startDate.getTime() - event.reminderMinutes * 60 * 1000);
    const timeDiff = reminderTime.getTime() - now.getTime();
    
    // Send reminder if it's within 15 minutes of the reminder time
    return timeDiff >= 0 && timeDiff <= 15 * 60 * 1000;
  });

  return eventsNeedingReminders as EventReminder[];
}

/**
 * Generate email HTML for event reminder
 */
export function generateEventReminderEmail(event: EventReminder): string {
  const eventTypeLabels: Record<string, string> = {
    meeting: "Reunião",
    deadline: "Prazo",
    delivery: "Entrega",
    site_visit: "Visita de Obra",
    presentation: "Apresentação",
    milestone: "Marco",
    personal: "Pessoal",
    other: "Outro",
  };

  const formattedDate = new Date(event.startDate).toLocaleDateString("pt-PT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(event.startDate).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const minutesUntil = Math.round((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #F2F0E7;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #C9A882;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .header h1 {
      color: #5F5C59;
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      margin: 0 0 8px 0;
    }
    .alert-badge {
      display: inline-block;
      background-color: #C9A882;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .event-title {
      font-size: 24px;
      font-weight: 700;
      color: #5F5C59;
      margin: 0 0 16px 0;
    }
    .event-details {
      background-color: #F8F7F4;
      border-left: 4px solid #C9A882;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .detail-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-weight: 600;
      color: #5F5C59;
      min-width: 120px;
    }
    .detail-value {
      color: #666;
    }
    .description {
      background-color: #ffffff;
      border: 1px solid #E5E3DB;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      color: #666;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #E5E3DB;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background-color: #C9A882;
      color: white;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="alert-badge">🔔 Lembrete de Evento</div>
      <h1>GAVINHO Project Manager</h1>
    </div>

    <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
      Olá <strong>${event.userName}</strong>,
    </p>

    <p style="font-size: 16px; color: #666;">
      Este é um lembrete de que o seu evento <strong>"${event.title}"</strong> começa em aproximadamente <strong>${minutesUntil} minutos</strong>.
    </p>

    <div class="event-details">
      <div class="detail-row">
        <span class="detail-label">Tipo:</span>
        <span class="detail-value">${eventTypeLabels[event.eventType] || event.eventType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data:</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Hora:</span>
        <span class="detail-value">${formattedTime}</span>
      </div>
      ${event.location ? `
      <div class="detail-row">
        <span class="detail-label">Localização:</span>
        <span class="detail-value">${event.location}</span>
      </div>
      ` : ''}
      ${event.projectName ? `
      <div class="detail-row">
        <span class="detail-label">Projeto:</span>
        <span class="detail-value">${event.projectName}</span>
      </div>
      ` : ''}
    </div>

    ${event.description ? `
    <div class="description">
      <strong style="color: #5F5C59; display: block; margin-bottom: 8px;">Descrição:</strong>
      ${event.description}
    </div>
    ` : ''}

    <div style="text-align: center;">
      <a href="#" class="cta-button">Ver no Calendário</a>
    </div>

    <div class="footer">
      <p>Este é um lembrete automático do sistema GAVINHO Project Manager.</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} GAVINHO. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send event reminders to users
 */
export async function sendEventReminders(): Promise<{ sent: number; failed: number }> {
  try {
    const upcomingEvents = await checkUpcomingEvents();
    
    let sent = 0;
    let failed = 0;

    for (const event of upcomingEvents) {
      try {
        const emailHtml = generateEventReminderEmail(event);
        
        // Send notification to owner (in production, this would send to event.userEmail)
        const success = await notifyOwner({
          title: `Lembrete: ${event.title}`,
          content: `O evento "${event.title}" começa em ${event.reminderMinutes} minutos.`,
        });

        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send reminder for event ${event.eventId}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error("Error in sendEventReminders:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Get reminder statistics
 */
export async function getReminderStats() {
  const upcomingEvents = await checkUpcomingEvents();
  
  return {
    totalUpcoming: upcomingEvents.length,
    byType: upcomingEvents.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}
