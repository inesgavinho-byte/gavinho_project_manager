import { emailHistory } from '../drizzle/schema';
import { eq, and, or, gte, lte, like, inArray } from 'drizzle-orm';
import { getDb } from './db';

export interface EmailFilter {
  projectId?: number;
  status?: string;
  eventType?: string;
  domain?: string; // Domínio do email (ex: @gmail.com)
  sender?: string; // Remetente específico
  recipient?: string; // Destinatário específico
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  searchText?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filtrar emails com critérios avançados
 */
export async function filterEmails(filters: EmailFilter) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return [];
    }

    let query = db.select().from(emailHistory);
    const conditions: any[] = [];

    // Filtro por projeto
    if (filters.projectId) {
      conditions.push(eq(emailHistory.projectId, filters.projectId));
    }

    // Filtro por status
    if (filters.status) {
      conditions.push(eq(emailHistory.status, filters.status));
    }

    // Filtro por tipo de evento
    if (filters.eventType) {
      conditions.push(eq(emailHistory.eventType, filters.eventType));
    }

    // Filtro por domínio (extrai domínio do email)
    if (filters.domain) {
      conditions.push(like(emailHistory.recipientEmail, `%${filters.domain}`));
    }

    // Filtro por remetente
    if (filters.sender) {
      conditions.push(like(emailHistory.senderEmail, `%${filters.sender}%`));
    }

    // Filtro por destinatário
    if (filters.recipient) {
      conditions.push(like(emailHistory.recipientEmail, `%${filters.recipient}%`));
    }

    // Filtro por período
    if (filters.startDate) {
      conditions.push(gte(emailHistory.sentAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(emailHistory.sentAt, filters.endDate));
    }

    // Filtro por texto (busca no assunto e conteúdo)
    if (filters.searchText) {
      conditions.push(
        or(
          like(emailHistory.subject, `%${filters.searchText}%`),
          like(emailHistory.content, `%${filters.searchText}%`)
        )
      );
    }

    // Aplicar condições
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Aplicar limite e offset
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    // Filtro por tags (após recuperar, pois é JSON)
    if (filters.tags && filters.tags.length > 0) {
      return results.filter((email) => {
        if (!email.tags) return false;
        const emailTags = JSON.parse(email.tags as string);
        return filters.tags!.some((tag) => emailTags.includes(tag));
      });
    }

    return results;
  } catch (error) {
    console.error('Error filtering emails:', error);
    return [];
  }
}

/**
 * Obter domínios únicos de emails
 */
export async function getUniqueDomains(projectId: number): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return [];
    }

    const emails = await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.projectId, projectId));

    const domains = new Set<string>();

    emails.forEach((email) => {
      if (email.recipientEmail) {
        const domain = email.recipientEmail.split('@')[1];
        if (domain) {
          domains.add(domain);
        }
      }
    });

    return Array.from(domains).sort();
  } catch (error) {
    console.error('Error getting unique domains:', error);
    return [];
  }
}

/**
 * Obter remetentes únicos
 */
export async function getUniqueSenders(projectId: number): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return [];
    }

    const emails = await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.projectId, projectId));

    const senders = new Set<string>();

    emails.forEach((email) => {
      if (email.senderEmail) {
        senders.add(email.senderEmail);
      }
    });

    return Array.from(senders).sort();
  } catch (error) {
    console.error('Error getting unique senders:', error);
    return [];
  }
}

/**
 * Obter tags únicas
 */
export async function getUniqueTags(projectId: number): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return [];
    }

    const emails = await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.projectId, projectId));

    const tags = new Set<string>();

    emails.forEach((email) => {
      if (email.tags) {
        const emailTags = JSON.parse(email.tags as string);
        emailTags.forEach((tag: string) => {
          tags.add(tag);
        });
      }
    });

    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error getting unique tags:', error);
    return [];
  }
}

/**
 * Contar emails por filtro
 */
export async function countFilteredEmails(filters: EmailFilter): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return 0;
    }

    let query = db.select().from(emailHistory);
    const conditions: any[] = [];

    // Aplicar mesmos filtros que filterEmails
    if (filters.projectId) {
      conditions.push(eq(emailHistory.projectId, filters.projectId));
    }

    if (filters.status) {
      conditions.push(eq(emailHistory.status, filters.status));
    }

    if (filters.eventType) {
      conditions.push(eq(emailHistory.eventType, filters.eventType));
    }

    if (filters.domain) {
      conditions.push(like(emailHistory.recipientEmail, `%${filters.domain}`));
    }

    if (filters.sender) {
      conditions.push(like(emailHistory.senderEmail, `%${filters.sender}%`));
    }

    if (filters.recipient) {
      conditions.push(like(emailHistory.recipientEmail, `%${filters.recipient}%`));
    }

    if (filters.startDate) {
      conditions.push(gte(emailHistory.sentAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(emailHistory.sentAt, filters.endDate));
    }

    if (filters.searchText) {
      conditions.push(
        or(
          like(emailHistory.subject, `%${filters.searchText}%`),
          like(emailHistory.content, `%${filters.searchText}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;
    return results.length;
  } catch (error) {
    console.error('Error counting filtered emails:', error);
    return 0;
  }
}
