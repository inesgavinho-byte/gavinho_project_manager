import axios from 'axios';
import { invokeLLM } from '../_core/llm';
import { db } from '../db';
import { emailTracking, emailSyncLog } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

interface OutlookEmail {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  categories: string[];
}

interface EmailClassification {
  category: 'order' | 'adjudication' | 'purchase' | 'delivery' | 'invoice' | 'other';
  confidence: number;
  keywords: string[];
  summary: string;
}

export class OutlookSyncService {
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

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

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get Microsoft Graph access token');
    }
  }

  async fetchEmails(filter?: string): Promise<OutlookEmail[]> {
    try {
      const token = await this.getAccessToken();

      const query = new URLSearchParams({
        $top: '50',
        $orderby: 'receivedDateTime desc',
        $select: 'id,subject,from,receivedDateTime,bodyPreview,body,categories',
      });

      if (filter) {
        query.append('$filter', filter);
      }

      const response = await axios.get(`https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.value || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails from Outlook');
    }
  }

  async classifyEmail(email: OutlookEmail): Promise<EmailClassification> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are an email classification expert for a construction project management system.
Classify emails into these categories:
- order: Purchase orders, order confirmations
- adjudication: Adjudication notices, tender results
- purchase: Purchase requests, quotations
- delivery: Delivery notifications, shipping updates
- invoice: Invoices, payment requests
- other: Everything else

Respond with JSON: { "category": "...", "confidence": 0.0-1.0, "keywords": [...], "summary": "..." }`,
          },
          {
            role: 'user',
            content: `Subject: ${email.subject}\n\nFrom: ${email.from.emailAddress.name} <${email.from.emailAddress.address}>\n\nContent:\n${email.body.content.substring(0, 1000)}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'email_classification',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: ['order', 'adjudication', 'purchase', 'delivery', 'invoice', 'other'],
                },
                confidence: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                },
                summary: {
                  type: 'string',
                },
              },
              required: ['category', 'confidence', 'keywords', 'summary'],
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      if (typeof content === 'string') {
        return JSON.parse(content);
      }
      return content as EmailClassification;
    } catch (error) {
      console.error('Error classifying email:', error);
      return {
        category: 'other',
        confidence: 0,
        keywords: [],
        summary: 'Classification failed',
      };
    }
  }

  async syncEmails(projectId: number): Promise<number> {
    const syncStartTime = new Date();
    let syncedCount = 0;

    try {
      // Get last sync time
      const lastSync = await db
        .select()
        .from(emailSyncLog)
        .where(eq(emailSyncLog.projectId, projectId))
        .orderBy(desc(emailSyncLog.syncedAt))
        .limit(1);

      const lastSyncTime = lastSync[0]?.syncedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

      // Fetch emails from last sync
      const filter = `receivedDateTime ge ${lastSyncTime.toISOString()}`;
      const emails = await this.fetchEmails(filter);

      // Process each email
      for (const email of emails) {
        try {
          // Check if email already exists
          const existing = await db
            .select()
            .from(emailTracking)
            .where(and(eq(emailTracking.projectId, projectId), eq(emailTracking.outlookMessageId, email.id)))
            .limit(1);

          if (existing.length > 0) {
            continue; // Skip if already synced
          }

          // Classify email
          const classification = await this.classifyEmail(email);

          // Store email
          await db.insert(emailTracking).values({
            projectId,
            outlookMessageId: email.id,
            subject: email.subject,
            from: email.from.emailAddress.address,
            senderName: email.from.emailAddress.name,
            receivedAt: new Date(email.receivedDateTime),
            category: classification.category,
            confidence: classification.confidence,
            keywords: JSON.stringify(classification.keywords),
            summary: classification.summary,
            bodyPreview: email.bodyPreview,
            body: email.body.content,
            isRead: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          syncedCount++;
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
        }
      }

      // Log sync
      await db.insert(emailSyncLog).values({
        projectId,
        syncedAt: syncStartTime,
        emailsCount: syncedCount,
        status: 'success',
        errorMessage: null,
      });

      return syncedCount;
    } catch (error) {
      console.error('Error syncing emails:', error);

      // Log failed sync
      await db.insert(emailSyncLog).values({
        projectId,
        syncedAt: syncStartTime,
        emailsCount: 0,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  async getEmailsByCategory(projectId: number, category: string, limit: number = 50) {
    return db
      .select()
      .from(emailTracking)
      .where(and(eq(emailTracking.projectId, projectId), eq(emailTracking.category, category)))
      .orderBy(desc(emailTracking.receivedAt))
      .limit(limit);
  }

  async markEmailAsRead(emailId: number) {
    return db.update(emailTracking).set({ isRead: true }).where(eq(emailTracking.id, emailId));
  }

  async markEmailAsArchived(emailId: number) {
    return db.update(emailTracking).set({ isArchived: true }).where(eq(emailTracking.id, emailId));
  }

  async searchEmails(projectId: number, query: string, limit: number = 50) {
    return db
      .select()
      .from(emailTracking)
      .where(
        and(
          eq(emailTracking.projectId, projectId),
          // Search in subject, from, summary
        )
      )
      .orderBy(desc(emailTracking.receivedAt))
      .limit(limit);
  }
}

export const outlookSyncService = new OutlookSyncService();
