import axios, { AxiosInstance } from "axios";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isReminder?: boolean;
  reminderMinutes?: number;
}

export interface CalendarIntegrationConfig {
  provider: "outlook" | "google";
  userId: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Serviço de integração com Outlook Calendar
 */
export class OutlookCalendarService {
  private apiClient: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.apiClient = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Cria um evento no calendário Outlook
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    try {
      const outlookEvent = {
        subject: event.title,
        bodyPreview: event.description,
        body: {
          contentType: "HTML",
          content: event.description,
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: "UTC",
        },
        location: event.location
          ? {
              displayName: event.location,
            }
          : undefined,
        attendees: event.attendees
          ? event.attendees.map((email) => ({
              emailAddress: {
                address: email,
                name: email.split("@")[0],
              },
              type: "required",
            }))
          : [],
        isReminderOn: event.isReminder ?? true,
        reminderMinutesBeforeStart: event.reminderMinutes ?? 15,
        categories: ["MQT", "Automated"],
      };

      const response = await this.apiClient.post("/me/events", outlookEvent);
      return response.data.id;
    } catch (error) {
      console.error("Erro ao criar evento no Outlook:", error);
      throw new Error("Falha ao criar evento no Outlook Calendar");
    }
  }

  /**
   * Atualiza um evento no calendário Outlook
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    try {
      const updateData: any = {};

      if (event.title) updateData.subject = event.title;
      if (event.description) {
        updateData.body = {
          contentType: "HTML",
          content: event.description,
        };
      }
      if (event.startTime) {
        updateData.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: "UTC",
        };
      }
      if (event.endTime) {
        updateData.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: "UTC",
        };
      }

      await this.apiClient.patch(`/me/events/${eventId}`, updateData);
    } catch (error) {
      console.error("Erro ao atualizar evento no Outlook:", error);
      throw new Error("Falha ao atualizar evento no Outlook Calendar");
    }
  }

  /**
   * Deleta um evento do calendário Outlook
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/me/events/${eventId}`);
    } catch (error) {
      console.error("Erro ao deletar evento no Outlook:", error);
      throw new Error("Falha ao deletar evento do Outlook Calendar");
    }
  }

  /**
   * Obtém um evento do calendário Outlook
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await this.apiClient.get(`/me/events/${eventId}`);
      const data = response.data;

      return {
        id: data.id,
        title: data.subject,
        description: data.bodyPreview || "",
        startTime: new Date(data.start.dateTime),
        endTime: new Date(data.end.dateTime),
        location: data.location?.displayName,
        isReminder: data.isReminderOn,
        reminderMinutes: data.reminderMinutesBeforeStart,
      };
    } catch (error) {
      console.error("Erro ao obter evento do Outlook:", error);
      return null;
    }
  }

  /**
   * Lista eventos do calendário Outlook
   */
  async listEvents(
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.apiClient.get("/me/events", {
        params: {
          $filter: `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`,
          $orderby: "start/dateTime",
        },
      });

      return response.data.value.map((event: any) => ({
        id: event.id,
        title: event.subject,
        description: event.bodyPreview || "",
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        location: event.location?.displayName,
        isReminder: event.isReminderOn,
        reminderMinutes: event.reminderMinutesBeforeStart,
      }));
    } catch (error) {
      console.error("Erro ao listar eventos do Outlook:", error);
      return [];
    }
  }
}

/**
 * Serviço de integração com Google Calendar
 */
export class GoogleCalendarService {
  private apiClient: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.apiClient = axios.create({
      baseURL: "https://www.googleapis.com/calendar/v3",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Cria um evento no calendário Google
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    try {
      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: "UTC",
        },
        location: event.location,
        attendees: event.attendees
          ? event.attendees.map((email) => ({
              email,
              responseStatus: "needsAction",
            }))
          : [],
        reminders: event.isReminder
          ? {
              useDefault: false,
              overrides: [
                {
                  method: "email",
                  minutes: event.reminderMinutes ?? 15,
                },
              ],
            }
          : { useDefault: true },
      };

      const response = await this.apiClient.post(
        "/calendars/primary/events",
        googleEvent
      );
      return response.data.id;
    } catch (error) {
      console.error("Erro ao criar evento no Google Calendar:", error);
      throw new Error("Falha ao criar evento no Google Calendar");
    }
  }

  /**
   * Atualiza um evento no calendário Google
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    try {
      const updateData: any = {};

      if (event.title) updateData.summary = event.title;
      if (event.description) updateData.description = event.description;
      if (event.startTime) {
        updateData.start = {
          dateTime: event.startTime.toISOString(),
          timeZone: "UTC",
        };
      }
      if (event.endTime) {
        updateData.end = {
          dateTime: event.endTime.toISOString(),
          timeZone: "UTC",
        };
      }

      await this.apiClient.patch(
        `/calendars/primary/events/${eventId}`,
        updateData
      );
    } catch (error) {
      console.error("Erro ao atualizar evento no Google Calendar:", error);
      throw new Error("Falha ao atualizar evento no Google Calendar");
    }
  }

  /**
   * Deleta um evento do calendário Google
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/calendars/primary/events/${eventId}`);
    } catch (error) {
      console.error("Erro ao deletar evento no Google Calendar:", error);
      throw new Error("Falha ao deletar evento do Google Calendar");
    }
  }

  /**
   * Obtém um evento do calendário Google
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await this.apiClient.get(
        `/calendars/primary/events/${eventId}`
      );
      const data = response.data;

      return {
        id: data.id,
        title: data.summary,
        description: data.description || "",
        startTime: new Date(data.start.dateTime),
        endTime: new Date(data.end.dateTime),
        location: data.location,
        isReminder: data.reminders?.useDefault ?? true,
        reminderMinutes: data.reminders?.overrides?.[0]?.minutes ?? 15,
      };
    } catch (error) {
      console.error("Erro ao obter evento do Google Calendar:", error);
      return null;
    }
  }

  /**
   * Lista eventos do calendário Google
   */
  async listEvents(
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.apiClient.get("/calendars/primary/events", {
        params: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          orderBy: "startTime",
          singleEvents: true,
        },
      });

      return response.data.items.map((event: any) => ({
        id: event.id,
        title: event.summary,
        description: event.description || "",
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        location: event.location,
        isReminder: event.reminders?.useDefault ?? true,
        reminderMinutes: event.reminders?.overrides?.[0]?.minutes ?? 15,
      }));
    } catch (error) {
      console.error("Erro ao listar eventos do Google Calendar:", error);
      return [];
    }
  }
}

/**
 * Factory para criar serviço de calendário apropriado
 */
export async function createCalendarService(
  userId: number,
  provider: "outlook" | "google"
): Promise<OutlookCalendarService | GoogleCalendarService | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.length === 0) {
      return null;
    }

    const userData = user[0];

    if (provider === "outlook") {
      if (!userData.outlookAccessToken) {
        throw new Error("Outlook access token not available");
      }
      return new OutlookCalendarService(userData.outlookAccessToken);
    } else if (provider === "google") {
      // Google Calendar seria integrado aqui
      // Por enquanto, retorna null
      console.warn("Google Calendar integration not yet implemented");
      return null;
    }

    return null;
  } catch (error) {
    console.error("Erro ao criar serviço de calendário:", error);
    return null;
  }
}

/**
 * Cria um evento de tarefa MQT em ambos os calendários do usuário
 */
export async function createMQTCalendarEvent(
  userId: number,
  taskId: number,
  title: string,
  description: string,
  dueDate: Date,
  assigneeEmail?: string
): Promise<{ outlookEventId?: string; googleEventId?: string }> {
  const result: { outlookEventId?: string; googleEventId?: string } = {};

  try {
    // Criar evento no Outlook
    try {
      const outlookService = await createCalendarService(userId, "outlook");
      if (outlookService) {
        const event: CalendarEvent = {
          title: `[MQT] ${title}`,
          description: `Tarefa MQT #${taskId}\n\n${description}`,
          startTime: dueDate,
          endTime: new Date(dueDate.getTime() + 60 * 60 * 1000), // 1 hora de duração
          location: "Mapa de Quantidades",
          attendees: assigneeEmail ? [assigneeEmail] : undefined,
          isReminder: true,
          reminderMinutes: 15,
        };

        result.outlookEventId = await outlookService.createEvent(event);
        console.log(`Evento Outlook criado: ${result.outlookEventId}`);
      }
    } catch (error) {
      console.error("Erro ao criar evento no Outlook:", error);
    }

    // Criar evento no Google Calendar
    try {
      const googleService = await createCalendarService(userId, "google");
      if (googleService) {
        const event: CalendarEvent = {
          title: `[MQT] ${title}`,
          description: `Tarefa MQT #${taskId}\n\n${description}`,
          startTime: dueDate,
          endTime: new Date(dueDate.getTime() + 60 * 60 * 1000), // 1 hora de duração
          location: "Mapa de Quantidades",
          attendees: assigneeEmail ? [assigneeEmail] : undefined,
          isReminder: true,
          reminderMinutes: 15,
        };

        result.googleEventId = await googleService.createEvent(event);
        console.log(`Evento Google criado: ${result.googleEventId}`);
      }
    } catch (error) {
      console.error("Erro ao criar evento no Google Calendar:", error);
    }

    return result;
  } catch (error) {
    console.error("Erro ao criar eventos de calendário para tarefa MQT:", error);
    return result;
  }
}
