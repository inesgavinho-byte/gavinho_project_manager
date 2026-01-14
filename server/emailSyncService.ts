import { getDb } from './db';
import { emailHistory, emailAnalytics, projects } from '../drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import axios from 'axios';

interface OutlookEmailEvent {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  receivedDateTime: string;
  sentDateTime: string;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  categories: string[];
}

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: 'processed' | 'dropped' | 'delivered' | 'deferred' | 'bounce' | 'open' | 'click' | 'unsubscribe' | 'spamreport';
  sg_message_id: string;
  sg_event_id: string;
  reason?: string;
  status?: string;
  response?: string;
}

/**
 * Sincronizar emails do Outlook para o histórico
 */
export async function syncOutlookEmails(projectId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return 0;
    }

    const accessToken = await getOutlookAccessToken();
    if (!accessToken) {
      console.error('Failed to get Outlook access token');
      return 0;
    }

    // Buscar últimos emails enviados
    const filter = `sentDateTime ge ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`;
    const emails = await fetchOutlookEmails(accessToken, filter);

    let syncedCount = 0;

    for (const email of emails) {
      // Verificar se email já existe
      const existing = await db
        .select()
        .from(emailHistory)
        .where(
          and(
            eq(emailHistory.projectId, projectId),
            eq(emailHistory.externalId, email.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        continue; // Email já sincronizado
      }

      // Classificar tipo de evento baseado no assunto
      const eventType = classifyEmailType(email.subject);

      // Inserir email no histórico
      await db.insert(emailHistory).values({
        projectId,
        externalId: email.id,
        externalProvider: 'outlook',
        subject: email.subject,
        senderEmail: email.from.emailAddress.address,
        senderName: email.from.emailAddress.name,
        recipientEmail: email.toRecipients[0]?.emailAddress.address || '',
        recipientName: email.toRecipients[0]?.emailAddress.name || '',
        content: email.body.content,
        eventType,
        status: 'delivered',
        sentAt: new Date(email.sentDateTime),
        deliveredAt: new Date(email.receivedDateTime),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      syncedCount++;
    }

    return syncedCount;
  } catch (error) {
    console.error('Error syncing Outlook emails:', error);
    return 0;
  }
}

/**
 * Sincronizar eventos de SendGrid para o histórico
 */
export async function syncSendGridEvents(projectId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return 0;
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('SendGrid API key not configured');
      return 0;
    }

    // Buscar eventos dos últimos 30 dias
    const startTime = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const endTime = Math.floor(Date.now() / 1000);

    const response = await axios.get('https://api.sendgrid.com/v3/messages', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        query: `BETWEEN(timestamp, ${startTime}, ${endTime})`,
        limit: 1000,
      },
    });

    const messages = response.data.messages || [];
    let syncedCount = 0;

    for (const message of messages) {
      // Verificar se email já existe
      const existing = await db
        .select()
        .from(emailHistory)
        .where(
          and(
            eq(emailHistory.projectId, projectId),
            eq(emailHistory.externalId, message.msg_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        continue; // Email já sincronizado
      }

      // Mapear status do SendGrid
      const status = mapSendGridStatus(message.status);

      // Inserir email no histórico
      await db.insert(emailHistory).values({
        projectId,
        externalId: message.msg_id,
        externalProvider: 'sendgrid',
        subject: message.subject || 'No Subject',
        senderEmail: message.from_email || '',
        senderName: message.from_name || '',
        recipientEmail: message.to_email || '',
        recipientName: message.to_name || '',
        content: message.html || message.text || '',
        eventType: 'notification',
        status,
        sentAt: new Date(message.timestamp * 1000),
        deliveredAt: message.delivered_at ? new Date(message.delivered_at * 1000) : undefined,
        openedAt: message.opened_at ? new Date(message.opened_at * 1000) : undefined,
        clickedAt: message.clicked_at ? new Date(message.clicked_at * 1000) : undefined,
        errorMessage: message.bounce_reason || message.drop_reason || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      syncedCount++;
    }

    return syncedCount;
  } catch (error) {
    console.error('Error syncing SendGrid events:', error);
    return 0;
  }
}

/**
 * Atualizar analytics baseado no histórico de emails
 */
export async function updateEmailAnalytics(projectId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar emails do dia
    const emails = await db
      .select()
      .from(emailHistory)
      .where(
        and(
          eq(emailHistory.projectId, projectId),
          gte(emailHistory.sentAt, today),
          lte(emailHistory.sentAt, tomorrow)
        )
      );

    if (emails.length === 0) {
      return;
    }

    // Calcular métricas
    const totalSent = emails.length;
    const totalDelivered = emails.filter(e => e.status === 'delivered').length;
    const totalBounced = emails.filter(e => e.status === 'bounced').length;
    const totalFailed = emails.filter(e => e.status === 'failed').length;
    const totalOpened = emails.filter(e => e.openedAt).length;
    const totalClicked = emails.filter(e => e.clickedAt).length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

    // Verificar se já existe registro para o dia
    const existing = await db
      .select()
      .from(emailAnalytics)
      .where(
        and(
          eq(emailAnalytics.projectId, projectId),
          eq(emailAnalytics.date, today)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Atualizar
      await db
        .update(emailAnalytics)
        .set({
          totalSent,
          totalDelivered,
          totalBounced,
          totalFailed,
          totalOpened,
          totalClicked,
          deliveryRate: deliveryRate.toString(),
          bounceRate: bounceRate.toString(),
          openRate: openRate.toString(),
          clickRate: clickRate.toString(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(emailAnalytics.projectId, projectId),
            eq(emailAnalytics.date, today)
          )
        );
    } else {
      // Inserir novo
      await db.insert(emailAnalytics).values({
        projectId,
        date: today,
        totalSent,
        totalDelivered,
        totalBounced,
        totalFailed,
        totalOpened,
        totalClicked,
        deliveryRate: deliveryRate.toString(),
        bounceRate: bounceRate.toString(),
        openRate: openRate.toString(),
        clickRate: clickRate.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error updating email analytics:', error);
  }
}

/**
 * Funções auxiliares
 */

async function getOutlookAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.MICROSOFT_GRAPH_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_GRAPH_CLIENT_SECRET || '',
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Outlook access token:', error);
    return null;
  }
}

async function fetchOutlookEmails(accessToken: string, filter: string): Promise<OutlookEmailEvent[]> {
  try {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me/mailFolders/sentitems/messages', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        $filter: filter,
        $orderby: 'sentDateTime desc',
        $top: 100,
        $select: 'id,subject,from,toRecipients,receivedDateTime,sentDateTime,bodyPreview,body,categories',
      },
    });

    return response.data.value || [];
  } catch (error) {
    console.error('Error fetching Outlook emails:', error);
    return [];
  }
}

function classifyEmailType(subject: string): string {
  const subjectLower = subject.toLowerCase();

  if (subjectLower.includes('entrega') || subjectLower.includes('delivery')) {
    return 'delivery';
  }
  if (subjectLower.includes('adjudicação') || subjectLower.includes('adjudication')) {
    return 'adjudication';
  }
  if (subjectLower.includes('pagamento') || subjectLower.includes('payment')) {
    return 'payment';
  }
  if (subjectLower.includes('convite') || subjectLower.includes('invite')) {
    return 'invitation';
  }
  if (subjectLower.includes('relatório') || subjectLower.includes('report')) {
    return 'report';
  }

  return 'other';
}

function mapSendGridStatus(status: string): string {
  const statusMap: Record<string, string> = {
    processed: 'pending',
    dropped: 'failed',
    delivered: 'delivered',
    deferred: 'pending',
    bounce: 'bounced',
    open: 'delivered',
    click: 'delivered',
    unsubscribe: 'unsubscribed',
    spamreport: 'spam',
  };

  return statusMap[status] || 'pending';
}
