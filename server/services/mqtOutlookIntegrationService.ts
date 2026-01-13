import { db } from '../db';
import { emailTracking, mqtImports, orders } from '../../drizzle/schema';
import { eq, and, like, ilike } from 'drizzle-orm';

interface MQTOutlookMatch {
  emailId: number;
  mqtItemId: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
  confidence: number;
  reason: string;
}

export class MQTOutlookIntegrationService {
  /**
   * Busca correspondências entre emails de encomendas e itens de MQT
   */
  async matchEmailsToMQT(projectId: number): Promise<MQTOutlookMatch[]> {
    const matches: MQTOutlookMatch[] = [];

    try {
      // Buscar emails de encomendas não processados
      const orderEmails = await db
        .select()
        .from(emailTracking)
        .where(
          and(
            eq(emailTracking.projectId, projectId),
            eq(emailTracking.category, 'order'),
            eq(emailTracking.isRead, false)
          )
        );

      // Buscar itens de MQT do projeto
      const mqtItems = await db
        .select()
        .from(mqtImports)
        .where(eq(mqtImports.projectId, projectId));

      // Processar cada email
      for (const email of orderEmails) {
        const emailKeywords = this.extractKeywords(email.subject || '', email.summary || '');

        // Buscar correspondências em itens de MQT
        for (const item of mqtItems) {
          const itemKeywords = this.extractKeywords(item.description || '', item.supplier || '');

          // Verificar correspondência exata
          if (this.hasExactMatch(emailKeywords, itemKeywords)) {
            matches.push({
              emailId: email.id,
              mqtItemId: item.id,
              matchType: 'exact',
              confidence: 0.95,
              reason: 'Correspondência exata de palavras-chave',
            });
            break;
          }

          // Verificar correspondência parcial
          const partialScore = this.calculatePartialMatch(emailKeywords, itemKeywords);
          if (partialScore > 0.7) {
            matches.push({
              emailId: email.id,
              mqtItemId: item.id,
              matchType: 'partial',
              confidence: partialScore,
              reason: `Correspondência parcial (${Math.round(partialScore * 100)}%)`,
            });
            break;
          }

          // Verificar correspondência fuzzy
          const fuzzyScore = this.calculateFuzzyMatch(email.subject || '', item.description || '');
          if (fuzzyScore > 0.6) {
            matches.push({
              emailId: email.id,
              mqtItemId: item.id,
              matchType: 'fuzzy',
              confidence: fuzzyScore,
              reason: `Correspondência aproximada (${Math.round(fuzzyScore * 100)}%)`,
            });
            break;
          }
        }
      }

      return matches;
    } catch (error) {
      console.error('Error matching emails to MQT:', error);
      throw error;
    }
  }

  /**
   * Vincula um email a um item de MQT
   */
  async linkEmailToMQT(emailId: number, mqtItemId: number, confidence: number = 0.9) {
    try {
      // Atualizar email com referência ao item de MQT
      await db
        .update(emailTracking)
        .set({
          mqtItemId,
          updatedAt: new Date(),
        })
        .where(eq(emailTracking.id, emailId));

      return { success: true, message: 'Email vinculado ao item de MQT' };
    } catch (error) {
      console.error('Error linking email to MQT:', error);
      throw error;
    }
  }

  /**
   * Busca emails vinculados a um item de MQT
   */
  async getEmailsForMQTItem(mqtItemId: number) {
    try {
      return await db
        .select()
        .from(emailTracking)
        .where(eq(emailTracking.mqtItemId, mqtItemId));
    } catch (error) {
      console.error('Error getting emails for MQT item:', error);
      throw error;
    }
  }

  /**
   * Busca itens de MQT vinculados a um email
   */
  async getMQTItemsForEmail(emailId: number) {
    try {
      const email = await db.select().from(emailTracking).where(eq(emailTracking.id, emailId)).limit(1);

      if (!email[0] || !email[0].mqtItemId) {
        return [];
      }

      return await db
        .select()
        .from(mqtImports)
        .where(eq(mqtImports.id, email[0].mqtItemId));
    } catch (error) {
      console.error('Error getting MQT items for email:', error);
      throw error;
    }
  }

  /**
   * Cria uma encomenda baseada em um email de pedido
   */
  async createOrderFromEmail(emailId: number, projectId: number) {
    try {
      const email = await db.select().from(emailTracking).where(eq(emailTracking.id, emailId)).limit(1);

      if (!email[0]) {
        throw new Error('Email não encontrado');
      }

      // Extrair informações do email
      const supplier = email[0].senderName || email[0].from || 'Desconhecido';
      const description = `${email[0].subject} - ${email[0].summary}`;
      const quantity = this.extractQuantity(email[0].body || email[0].bodyPreview || '');
      const price = this.extractPrice(email[0].body || email[0].bodyPreview || '');

      // Criar encomenda
      const result = await db.insert(orders).values({
        projectId,
        supplier,
        description,
        quantity: quantity || 1,
        unitPrice: price || 0,
        totalPrice: (price || 0) * (quantity || 1),
        status: 'pending',
        emailId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        orderId: result.insertId,
        message: 'Encomenda criada a partir do email',
      };
    } catch (error) {
      console.error('Error creating order from email:', error);
      throw error;
    }
  }

  /**
   * Extrai palavras-chave de um texto
   */
  private extractKeywords(text: string, additionalText: string = ''): string[] {
    const combined = `${text} ${additionalText}`.toLowerCase();

    // Remover pontuação e dividir em palavras
    const words = combined
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3); // Apenas palavras com mais de 3 caracteres

    // Remover duplicatas
    return [...new Set(words)];
  }

  /**
   * Verifica correspondência exata entre conjuntos de palavras-chave
   */
  private hasExactMatch(keywords1: string[], keywords2: string[]): boolean {
    const set2 = new Set(keywords2);
    const matches = keywords1.filter((k) => set2.has(k));
    return matches.length >= Math.min(2, Math.min(keywords1.length, keywords2.length));
  }

  /**
   * Calcula score de correspondência parcial
   */
  private calculatePartialMatch(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set2 = new Set(keywords2);
    const matches = keywords1.filter((k) => set2.has(k)).length;

    return matches / Math.max(keywords1.length, keywords2.length);
  }

  /**
   * Calcula score de correspondência fuzzy (Levenshtein)
   */
  private calculateFuzzyMatch(text1: string, text2: string): number {
    const s1 = text1.toLowerCase().replace(/[^\w\s]/g, '');
    const s2 = text2.toLowerCase().replace(/[^\w\s]/g, '');

    if (s1 === s2) return 1.0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula distância de Levenshtein entre duas strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }

    return costs[s2.length];
  }

  /**
   * Extrai quantidade de um texto
   */
  private extractQuantity(text: string): number | null {
    const quantityPatterns = [
      /quantidade[:\s]+(\d+)/i,
      /qty[:\s]+(\d+)/i,
      /(\d+)\s*(unidades?|un\.?|pcs?|peças?)/i,
      /(\d+)\s*x\s*(\d+)/i, // Ex: 10 x 5
    ];

    for (const pattern of quantityPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  /**
   * Extrai preço de um texto
   */
  private extractPrice(text: string): number | null {
    const pricePatterns = [
      /preço[:\s]+€?\s*([\d.,]+)/i,
      /price[:\s]+\$?\s*([\d.,]+)/i,
      /€\s*([\d.,]+)/,
      /\$\s*([\d.,]+)/,
      /([\d.,]+)\s*€/,
      /([\d.,]+)\s*\$/,
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const priceStr = match[1].replace(/,/g, '.');
        return parseFloat(priceStr);
      }
    }

    return null;
  }
}

export const mqtOutlookIntegrationService = new MQTOutlookIntegrationService();
