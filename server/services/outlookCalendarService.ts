import axios from 'axios';
import { db } from '../db';
import { calendarEvents, calendarAlerts } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface OutlookEvent {
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  categories?: string[];
  isReminderOn?: boolean;
  reminderMinutesBeforeStart?: number;
  bodyPreview?: string;
}

interface CalendarEventData {
  projectId: number;
  eventType: 'delivery' | 'adjudication' | 'payment' | 'other';
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  outlookEventId?: string;
}

export class OutlookCalendarService {
  private readonly GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
  private readonly CALENDAR_NAME = 'Gavinho Project Manager';

  /**
   * Sincroniza eventos do banco com Outlook Calendar
   */
  async syncToOutlook(accessToken: string, events: CalendarEventData[]): Promise<void> {
    try {
      console.log(`[OutlookCalendarService] Sincronizando ${events.length} eventos para Outlook...`);

      for (const event of events) {
        try {
          const outlookEvent = this.mapToOutlookEvent(event);
          
          if (event.outlookEventId) {
            // Atualizar evento existente
            await this.updateOutlookEvent(accessToken, event.outlookEventId, outlookEvent);
          } else {
            // Criar novo evento
            const createdEvent = await this.createOutlookEvent(accessToken, outlookEvent);
            
            // Salvar ID do Outlook no banco
            if (createdEvent.id) {
              await db
                .update(calendarEvents)
                .set({ outlookEventId: createdEvent.id })
                .where(eq(calendarEvents.id, event.projectId));
            }
          }
        } catch (error) {
          console.error(`Erro ao sincronizar evento ${event.title}:`, error);
        }
      }

      console.log('[OutlookCalendarService] Sincronização concluída');
    } catch (error) {
      console.error('Erro na sincronização com Outlook:', error);
      throw error;
    }
  }

  /**
   * Cria evento no Outlook Calendar
   */
  private async createOutlookEvent(accessToken: string, event: OutlookEvent): Promise<any> {
    try {
      const response = await axios.post(
        `${this.GRAPH_API_URL}/me/events`,
        event,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento no Outlook:', error);
      throw error;
    }
  }

  /**
   * Atualiza evento no Outlook Calendar
   */
  private async updateOutlookEvent(accessToken: string, eventId: string, event: OutlookEvent): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.GRAPH_API_URL}/me/events/${eventId}`,
        event,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar evento no Outlook:', error);
      throw error;
    }
  }

  /**
   * Deleta evento do Outlook Calendar
   */
  async deleteOutlookEvent(accessToken: string, eventId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.GRAPH_API_URL}/me/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log(`[OutlookCalendarService] Evento ${eventId} deletado do Outlook`);
    } catch (error) {
      console.error('Erro ao deletar evento do Outlook:', error);
      throw error;
    }
  }

  /**
   * Mapeia evento interno para formato Outlook
   */
  private mapToOutlookEvent(event: CalendarEventData): OutlookEvent {
    const categoryMap: Record<string, string> = {
      delivery: 'Entrega',
      adjudication: 'Adjudicação',
      payment: 'Pagamento',
      other: 'Outro',
    };

    return {
      subject: event.title,
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: event.endDate.toISOString(),
        timeZone: 'Europe/Lisbon',
      },
      categories: [categoryMap[event.eventType]],
      isReminderOn: true,
      reminderMinutesBeforeStart: 60,
      bodyPreview: event.description,
    };
  }

  /**
   * Cria eventos automáticos para entregas
   */
  async createDeliveryEvents(projectId: number, deliveryDates: Array<{ date: Date; description: string }>): Promise<void> {
    try {
      for (const delivery of deliveryDates) {
        const endDate = new Date(delivery.date);
        endDate.setHours(endDate.getHours() + 1);

        const event: CalendarEventData = {
          projectId,
          eventType: 'delivery',
          title: `📦 Entrega: ${delivery.description}`,
          description: `Entrega agendada para o projeto ${projectId}`,
          startDate: delivery.date,
          endDate,
          location: 'Local de Entrega',
        };

        await db.insert(calendarEvents).values({
          projectId,
          eventType: 'delivery',
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          createdAt: new Date(),
        });

        // Criar alertas
        await this.createAlerts(projectId, event.startDate);
      }

      console.log(`[OutlookCalendarService] ${deliveryDates.length} eventos de entrega criados`);
    } catch (error) {
      console.error('Erro ao criar eventos de entrega:', error);
      throw error;
    }
  }

  /**
   * Cria eventos automáticos para adjudicações
   */
  async createAdjudicationEvents(projectId: number, adjudicationDates: Array<{ date: Date; description: string }>): Promise<void> {
    try {
      for (const adjudication of adjudicationDates) {
        const endDate = new Date(adjudication.date);
        endDate.setHours(endDate.getHours() + 2);

        const event: CalendarEventData = {
          projectId,
          eventType: 'adjudication',
          title: `🏆 Adjudicação: ${adjudication.description}`,
          description: `Prazo de adjudicação para o projeto ${projectId}`,
          startDate: adjudication.date,
          endDate,
          location: 'Online',
        };

        await db.insert(calendarEvents).values({
          projectId,
          eventType: 'adjudication',
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          createdAt: new Date(),
        });

        // Criar alertas
        await this.createAlerts(projectId, event.startDate);
      }

      console.log(`[OutlookCalendarService] ${adjudicationDates.length} eventos de adjudicação criados`);
    } catch (error) {
      console.error('Erro ao criar eventos de adjudicação:', error);
      throw error;
    }
  }

  /**
   * Cria eventos automáticos para pagamentos
   */
  async createPaymentEvents(projectId: number, paymentDates: Array<{ date: Date; amount: number; description: string }>): Promise<void> {
    try {
      for (const payment of paymentDates) {
        const endDate = new Date(payment.date);
        endDate.setHours(endDate.getHours() + 1);

        const event: CalendarEventData = {
          projectId,
          eventType: 'payment',
          title: `💰 Pagamento: ${payment.description} (€${payment.amount.toFixed(2)})`,
          description: `Pagamento de €${payment.amount.toFixed(2)} para o projeto ${projectId}`,
          startDate: payment.date,
          endDate,
          location: 'Transferência Bancária',
        };

        await db.insert(calendarEvents).values({
          projectId,
          eventType: 'payment',
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          createdAt: new Date(),
        });

        // Criar alertas
        await this.createAlerts(projectId, event.startDate);
      }

      console.log(`[OutlookCalendarService] ${paymentDates.length} eventos de pagamento criados`);
    } catch (error) {
      console.error('Erro ao criar eventos de pagamento:', error);
      throw error;
    }
  }

  /**
   * Cria alertas automáticos (1 dia antes, 1 hora antes)
   */
  private async createAlerts(projectId: number, eventDate: Date): Promise<void> {
    try {
      // Alerta 1 dia antes
      const oneDayBefore = new Date(eventDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      await db.insert(calendarAlerts).values({
        projectId,
        alertType: 'one_day_before',
        alertDate: oneDayBefore,
        message: `Lembrete: Evento agendado para amanhã`,
        isRead: 0,
        createdAt: new Date(),
      });

      // Alerta 1 hora antes
      const oneHourBefore = new Date(eventDate);
      oneHourBefore.setHours(oneHourBefore.getHours() - 1);

      await db.insert(calendarAlerts).values({
        projectId,
        alertType: 'one_hour_before',
        alertDate: oneHourBefore,
        message: `Lembrete: Evento em 1 hora`,
        isRead: 0,
        createdAt: new Date(),
      });

      console.log(`[OutlookCalendarService] Alertas criados para o evento`);
    } catch (error) {
      console.error('Erro ao criar alertas:', error);
      throw error;
    }
  }

  /**
   * Retorna eventos do calendário
   */
  async getCalendarEvents(projectId?: number, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      let query = db.select().from(calendarEvents);

      if (projectId) {
        query = query.where(eq(calendarEvents.projectId, projectId));
      }

      if (startDate && endDate) {
        query = query.where(
          and(
            gte(calendarEvents.startDate, startDate),
            lte(calendarEvents.endDate, endDate)
          )
        );
      }

      const events = await query;
      return events;
    } catch (error) {
      console.error('Erro ao buscar eventos do calendário:', error);
      throw error;
    }
  }

  /**
   * Retorna alertas pendentes
   */
  async getPendingAlerts(): Promise<any[]> {
    try {
      const now = new Date();
      
      const alerts = await db
        .select()
        .from(calendarAlerts)
        .where(
          and(
            lte(calendarAlerts.alertDate, now),
            eq(calendarAlerts.isRead, 0)
          )
        );

      return alerts;
    } catch (error) {
      console.error('Erro ao buscar alertas pendentes:', error);
      throw error;
    }
  }

  /**
   * Marca alerta como lido
   */
  async markAlertAsRead(alertId: number): Promise<void> {
    try {
      await db
        .update(calendarAlerts)
        .set({ isRead: 1 })
        .where(eq(calendarAlerts.id, alertId));

      console.log(`[OutlookCalendarService] Alerta ${alertId} marcado como lido`);
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      throw error;
    }
  }

  /**
   * Deleta evento do calendário
   */
  async deleteCalendarEvent(eventId: number): Promise<void> {
    try {
      // Buscar evento
      const event = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, eventId))
        .limit(1);

      if (!event[0]) {
        throw new Error('Evento não encontrado');
      }

      // Deletar evento
      await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));

      // Deletar alertas associados
      await db.delete(calendarAlerts).where(eq(calendarAlerts.projectId, event[0].projectId));

      console.log(`[OutlookCalendarService] Evento ${eventId} deletado`);
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  }
}

export const outlookCalendarService = new OutlookCalendarService();
