import { db } from '../db';
import { calendarEvents, calendarAlerts } from '../../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

/**
 * Serviço de Webhook para Sincronização Bidirecional com Outlook Calendar
 * Processa notificações de alterações de eventos do Outlook Calendar
 */

export interface OutlookWebhookNotification {
  value: Array<{
    subscriptionId: string;
    changeType: 'created' | 'updated' | 'deleted';
    resource: string;
    resourceData: {
      id: string;
      '@odata.type': string;
    };
    clientState: string;
    tenantId: string;
  }>;
}

export interface OutlookEventChange {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  categories: string[];
  bodyPreview: string;
  isReminderOn: boolean;
  reminderMinutesBeforeStart: number;
}

/**
 * Processar notificação de webhook do Outlook
 */
export async function processOutlookWebhookNotification(
  notification: OutlookWebhookNotification,
  accessToken: string
) {
  const changes = [];

  for (const change of notification.value) {
    try {
      const eventData = await fetchOutlookEventDetails(change.resourceData.id, accessToken);
      
      if (change.changeType === 'created') {
        await handleEventCreated(eventData);
      } else if (change.changeType === 'updated') {
        await handleEventUpdated(eventData);
      } else if (change.changeType === 'deleted') {
        await handleEventDeleted(eventData.id);
      }

      changes.push({
        eventId: eventData.id,
        changeType: change.changeType,
        status: 'processed',
      });
    } catch (error) {
      console.error(`Erro ao processar webhook para evento ${change.resourceData.id}:`, error);
      changes.push({
        eventId: change.resourceData.id,
        changeType: change.changeType,
        status: 'error',
        error: String(error),
      });
    }
  }

  return changes;
}

/**
 * Buscar detalhes do evento no Outlook
 */
async function fetchOutlookEventDetails(
  eventId: string,
  accessToken: string
): Promise<OutlookEventChange> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar evento: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Processar evento criado no Outlook
 */
async function handleEventCreated(eventData: OutlookEventChange) {
  // Verificar se o evento já existe no banco
  const existing = await db.query.calendarEvents.findFirst({
    where: eq(calendarEvents.outlookEventId, eventData.id),
  });

  if (existing) {
    return; // Evento já sincronizado
  }

  // Classificar categoria automaticamente
  const category = await classifyEventCategory(eventData);

  // Inserir evento no banco
  await db.insert(calendarEvents).values({
    outlookEventId: eventData.id,
    title: eventData.subject,
    description: eventData.bodyPreview,
    startDate: new Date(eventData.start.dateTime),
    endDate: new Date(eventData.end.dateTime),
    eventType: category,
    isReminderEnabled: eventData.isReminderOn,
    reminderMinutes: eventData.reminderMinutesBeforeStart,
    syncedAt: new Date(),
  });

  // Criar alertas automáticos
  await createAutomaticAlerts(eventData, category);
}

/**
 * Processar evento atualizado no Outlook
 */
async function handleEventUpdated(eventData: OutlookEventChange) {
  const existing = await db.query.calendarEvents.findFirst({
    where: eq(calendarEvents.outlookEventId, eventData.id),
  });

  if (!existing) {
    // Se não existe, criar como novo
    await handleEventCreated(eventData);
    return;
  }

  // Atualizar evento
  const category = await classifyEventCategory(eventData);

  await db
    .update(calendarEvents)
    .set({
      title: eventData.subject,
      description: eventData.bodyPreview,
      startDate: new Date(eventData.start.dateTime),
      endDate: new Date(eventData.end.dateTime),
      eventType: category,
      isReminderEnabled: eventData.isReminderOn,
      reminderMinutes: eventData.reminderMinutesBeforeStart,
      syncedAt: new Date(),
    })
    .where(eq(calendarEvents.id, existing.id));

  // Atualizar alertas se necessário
  await updateAutomaticAlerts(existing.id, eventData, category);
}

/**
 * Processar evento deletado no Outlook
 */
async function handleEventDeleted(outlookEventId: string) {
  const event = await db.query.calendarEvents.findFirst({
    where: eq(calendarEvents.outlookEventId, outlookEventId),
  });

  if (event) {
    // Deletar alertas associados
    await db.delete(calendarAlerts).where(eq(calendarAlerts.eventId, event.id));

    // Deletar evento
    await db.delete(calendarEvents).where(eq(calendarEvents.id, event.id));
  }
}

/**
 * Classificar categoria do evento automaticamente
 */
async function classifyEventCategory(eventData: OutlookEventChange): Promise<string> {
  // Se tem categoria definida, usar
  if (eventData.categories && eventData.categories.length > 0) {
    const category = eventData.categories[0].toLowerCase();
    if (['delivery', 'adjudication', 'payment'].includes(category)) {
      return category;
    }
  }

  // Usar IA para classificar baseado no título e descrição
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Você é um classificador de eventos de calendário. Classifique o evento em uma das categorias: 'delivery' (entrega), 'adjudication' (adjudicação), 'payment' (pagamento) ou 'other' (outro). Responda APENAS com a categoria, sem explicações.`,
        },
        {
          role: 'user',
          content: `Título: ${eventData.subject}\nDescrição: ${eventData.bodyPreview}`,
        },
      ],
    });

    const category = response.choices[0].message.content?.toLowerCase().trim() || 'other';
    return ['delivery', 'adjudication', 'payment'].includes(category) ? category : 'other';
  } catch (error) {
    console.error('Erro ao classificar evento com IA:', error);
    return 'other';
  }
}

/**
 * Criar alertas automáticos para evento
 */
async function createAutomaticAlerts(eventData: OutlookEventChange, category: string) {
  const eventDate = new Date(eventData.start.dateTime);
  const now = new Date();

  // Alerta 1 dia antes
  const alertDate1Day = new Date(eventDate);
  alertDate1Day.setDate(alertDate1Day.getDate() - 1);

  if (alertDate1Day > now) {
    await db.insert(calendarAlerts).values({
      eventId: eventData.id, // Será atualizado após inserir evento
      alertType: 'warning',
      message: `Lembrete: ${eventData.subject} acontece amanhã`,
      alertDate: alertDate1Day,
      isResolved: false,
    });
  }

  // Alerta 1 hora antes
  const alertDate1Hour = new Date(eventDate);
  alertDate1Hour.setHours(alertDate1Hour.getHours() - 1);

  if (alertDate1Hour > now) {
    await db.insert(calendarAlerts).values({
      eventId: eventData.id,
      alertType: 'critical',
      message: `Alerta crítico: ${eventData.subject} acontece em 1 hora`,
      alertDate: alertDate1Hour,
      isResolved: false,
    });
  }
}

/**
 * Atualizar alertas automáticos quando evento é modificado
 */
async function updateAutomaticAlerts(
  eventId: string,
  eventData: OutlookEventChange,
  category: string
) {
  // Deletar alertas antigos
  await db.delete(calendarAlerts).where(eq(calendarAlerts.eventId, eventId));

  // Criar novos alertas
  await createAutomaticAlerts(eventData, category);
}

/**
 * Validar assinatura de webhook (segurança)
 */
export function validateWebhookSignature(
  token: string,
  expectedToken: string
): boolean {
  return token === expectedToken;
}

/**
 * Registrar webhook com Outlook
 */
export async function registerOutlookWebhook(
  accessToken: string,
  webhookUrl: string,
  changeTypes: string[] = ['created', 'updated', 'deleted']
): Promise<string> {
  const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      changeType: changeTypes.join(','),
      notificationUrl: webhookUrl,
      resource: '/me/events',
      expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      clientState: process.env.WEBHOOK_CLIENT_STATE || 'gavinho-calendar-sync',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao registrar webhook: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Renovar webhook (válido por 24h)
 */
export async function renewOutlookWebhook(
  accessToken: string,
  subscriptionId: string
): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao renovar webhook: ${response.statusText}`);
  }
}
