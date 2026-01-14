import { getDb } from './db';
import { emailHistory } from '../drizzle/schema';
import { sql, like, and, or } from 'drizzle-orm';

/**
 * Busca emails em tempo real com suporte a múltiplos campos
 */
export async function searchEmails(
  projectId: number,
  query: string,
  limit: number = 20
) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const db = await getDb();
  const searchTerm = `%${query}%`;

  try {
    const results = await db
      .select()
      .from(emailHistory)
      .where(
        and(
          sql`${emailHistory.projectId} = ${projectId}`,
          or(
            like(emailHistory.recipientEmail, searchTerm),
            like(emailHistory.subject, searchTerm),
            like(emailHistory.body, searchTerm),
            like(emailHistory.senderEmail, searchTerm),
            like(emailHistory.domain, searchTerm)
          )
        )
      )
      .limit(limit);

    return results;
  } catch (error) {
    console.error('Erro ao buscar emails:', error);
    return [];
  }
}

/**
 * Busca com sugestões de autocomplete
 */
export async function getEmailSuggestions(
  projectId: number,
  query: string,
  type: 'recipient' | 'sender' | 'subject' | 'domain' = 'recipient',
  limit: number = 10
) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const db = await getDb();
  const searchTerm = `%${query}%`;

  try {
    let results: any[] = [];

    switch (type) {
      case 'recipient':
        results = await db
          .selectDistinct({ value: emailHistory.recipientEmail })
          .from(emailHistory)
          .where(
            and(
              sql`${emailHistory.projectId} = ${projectId}`,
              like(emailHistory.recipientEmail, searchTerm)
            )
          )
          .limit(limit);
        break;

      case 'sender':
        results = await db
          .selectDistinct({ value: emailHistory.senderEmail })
          .from(emailHistory)
          .where(
            and(
              sql`${emailHistory.projectId} = ${projectId}`,
              like(emailHistory.senderEmail, searchTerm)
            )
          )
          .limit(limit);
        break;

      case 'subject':
        results = await db
          .selectDistinct({ value: emailHistory.subject })
          .from(emailHistory)
          .where(
            and(
              sql`${emailHistory.projectId} = ${projectId}`,
              like(emailHistory.subject, searchTerm)
            )
          )
          .limit(limit);
        break;

      case 'domain':
        results = await db
          .selectDistinct({ value: emailHistory.domain })
          .from(emailHistory)
          .where(
            and(
              sql`${emailHistory.projectId} = ${projectId}`,
              like(emailHistory.domain, searchTerm)
            )
          )
          .limit(limit);
        break;
    }

    return results.map((r) => r.value).filter(Boolean);
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    return [];
  }
}

/**
 * Busca avançada com múltiplos critérios
 */
export async function advancedEmailSearch(
  projectId: number,
  filters: {
    query?: string;
    recipientEmail?: string;
    senderEmail?: string;
    domain?: string;
    status?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
  },
  limit: number = 50
) {
  const db = await getDb();
  const conditions: any[] = [sql`${emailHistory.projectId} = ${projectId}`];

  // Query geral (busca em múltiplos campos)
  if (filters.query && filters.query.trim()) {
    const searchTerm = `%${filters.query}%`;
    conditions.push(
      or(
        like(emailHistory.recipientEmail, searchTerm),
        like(emailHistory.subject, searchTerm),
        like(emailHistory.body, searchTerm),
        like(emailHistory.senderEmail, searchTerm),
        like(emailHistory.domain, searchTerm)
      )
    );
  }

  // Filtros específicos
  if (filters.recipientEmail) {
    conditions.push(like(emailHistory.recipientEmail, `%${filters.recipientEmail}%`));
  }

  if (filters.senderEmail) {
    conditions.push(like(emailHistory.senderEmail, `%${filters.senderEmail}%`));
  }

  if (filters.domain) {
    conditions.push(like(emailHistory.domain, `%${filters.domain}%`));
  }

  if (filters.status) {
    conditions.push(sql`${emailHistory.status} = ${filters.status}`);
  }

  if (filters.eventType) {
    conditions.push(sql`${emailHistory.eventType} = ${filters.eventType}`);
  }

  if (filters.startDate) {
    const startDate = new Date(filters.startDate).getTime();
    conditions.push(sql`${emailHistory.sentAt} >= ${startDate}`);
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate).getTime();
    conditions.push(sql`${emailHistory.sentAt} <= ${endDate}`);
  }

  try {
    const results = await db
      .select()
      .from(emailHistory)
      .where(and(...conditions))
      .limit(limit);

    return results;
  } catch (error) {
    console.error('Erro ao buscar emails com filtros avançados:', error);
    return [];
  }
}

/**
 * Busca com destaque de termos encontrados
 */
export function highlightSearchTerms(text: string, searchTerm: string): string {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Extrai contexto ao redor do termo encontrado
 */
export function extractContext(text: string, searchTerm: string, contextLength: number = 50): string {
  if (!searchTerm || !text) return text;

  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  if (index === -1) return text.substring(0, contextLength * 2);

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + searchTerm.length + contextLength);

  let context = text.substring(start, end);
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context;
}
