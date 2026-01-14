import { getDb } from './db';
import { crmContacts, emailTracking, emailSentimentAnalysis } from '../drizzle/schema';
import { eq, and, desc, like } from 'drizzle-orm';

// ============================================
// CRM INTEGRATION SERVICE
// ============================================

export interface CreateCRMContactInput {
  projectId: number;
  type: 'client' | 'supplier' | 'partner' | 'other';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

// Criar contato no CRM
export async function createCRMContact(input: CreateCRMContactInput) {
  const db = await getDb();
  
  return await db.insert(crmContacts).values({
    projectId: input.projectId,
    type: input.type,
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company,
    role: input.role,
    address: input.address,
    notes: input.notes,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    communicationStatus: 'active',
  });
}

// Obter contatos de um projeto
export async function getProjectContacts(projectId: number, type?: string) {
  const db = await getDb();
  
  let query = db.select().from(crmContacts)
    .where(eq(crmContacts.projectId, projectId));

  if (type) {
    query = query.where(and(
      eq(crmContacts.projectId, projectId),
      eq(crmContacts.type, type as any)
    ));
  }

  return await query.orderBy(desc(crmContacts.lastEmailDate));
}

// Obter contato por ID
export async function getCRMContact(contactId: number) {
  const db = await getDb();
  
  return await db.select().from(crmContacts)
    .where(eq(crmContacts.id, contactId))
    .limit(1);
}

// Atualizar contato
export async function updateCRMContact(contactId: number, updates: Partial<CreateCRMContactInput>) {
  const db = await getDb();
  
  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.email) updateData.email = updates.email;
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.company) updateData.company = updates.company;
  if (updates.role) updateData.role = updates.role;
  if (updates.address) updateData.address = updates.address;
  if (updates.notes) updateData.notes = updates.notes;
  if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

  return await db.update(crmContacts)
    .set(updateData)
    .where(eq(crmContacts.id, contactId));
}

// Vincular email a contato
export async function linkEmailToContact(emailId: number, contactId: number) {
  const db = await getDb();
  
  // Atualizar email com contactId
  await db.update(emailTracking)
    .set({ contactId })
    .where(eq(emailTracking.id, emailId));

  // Atualizar estatísticas do contato
  const contact = await getCRMContact(contactId);
  if (contact[0]) {
    const emailCount = (contact[0].emailCount || 0) + 1;
    
    await db.update(crmContacts)
      .set({
        emailCount,
        lastEmailDate: new Date().toISOString().split('T')[0],
      })
      .where(eq(crmContacts.id, contactId));
  }
}

// Obter histórico de comunicação com um contato
export async function getContactCommunicationHistory(contactId: number, limit = 50) {
  const db = await getDb();
  
  return await db.select().from(emailTracking)
    .where(eq(emailTracking.contactId, contactId))
    .orderBy(desc(emailTracking.sentAt))
    .limit(limit);
}

// Obter análise de sentimento de um contato
export async function getContactSentimentAnalysis(contactId: number) {
  const db = await getDb();
  
  const sentimentData = await db.select().from(emailSentimentAnalysis)
    .where(eq(emailSentimentAnalysis.contactId, contactId))
    .orderBy(desc(emailSentimentAnalysis.analyzedAt));

  if (sentimentData.length === 0) return null;

  // Calcular sentimento médio
  const avgSentiment = sentimentData.reduce((sum, s) => sum + parseFloat(s.sentimentScore), 0) / sentimentData.length;
  
  // Contar sentimentos por tipo
  const sentimentCounts = {
    very_negative: sentimentData.filter(s => s.sentiment === 'very_negative').length,
    negative: sentimentData.filter(s => s.sentiment === 'negative').length,
    neutral: sentimentData.filter(s => s.sentiment === 'neutral').length,
    positive: sentimentData.filter(s => s.sentiment === 'positive').length,
    very_positive: sentimentData.filter(s => s.sentiment === 'very_positive').length,
  };

  return {
    averageSentiment: Math.round(avgSentiment * 100) / 100,
    sentimentCounts,
    recentSentiments: sentimentData.slice(0, 10),
    trend: calculateSentimentTrend(sentimentData),
  };
}

// Atualizar score de sentimento do contato
export async function updateContactSentimentScore(contactId: number) {
  const db = await getDb();
  
  const analysis = await getContactSentimentAnalysis(contactId);
  
  if (analysis) {
    await db.update(crmContacts)
      .set({
        sentimentScore: analysis.averageSentiment.toString(),
      })
      .where(eq(crmContacts.id, contactId));
  }
}

// Buscar contatos por email
export async function searchContactsByEmail(projectId: number, email: string) {
  const db = await getDb();
  
  return await db.select().from(crmContacts)
    .where(and(
      eq(crmContacts.projectId, projectId),
      like(crmContacts.email, `%${email}%`)
    ));
}

// Buscar contatos por nome
export async function searchContactsByName(projectId: number, name: string) {
  const db = await getDb();
  
  return await db.select().from(crmContacts)
    .where(and(
      eq(crmContacts.projectId, projectId),
      like(crmContacts.name, `%${name}%`)
    ));
}

// Obter contatos com sentimento negativo
export async function getNegativeSentimentContacts(projectId: number) {
  const db = await getDb();
  
  return await db.select().from(crmContacts)
    .where(and(
      eq(crmContacts.projectId, projectId),
      // sentimentScore < 0 (negativo)
    ))
    .orderBy(crmContacts.sentimentScore);
}

// Adicionar tag a contato
export async function addTagToContact(contactId: number, tag: string) {
  const db = await getDb();
  
  const contact = await getCRMContact(contactId);
  if (!contact[0]) return;

  const tags = contact[0].tags ? JSON.parse(contact[0].tags) : [];
  if (!tags.includes(tag)) {
    tags.push(tag);
    
    await db.update(crmContacts)
      .set({ tags: JSON.stringify(tags) })
      .where(eq(crmContacts.id, contactId));
  }
}

// Remover tag de contato
export async function removeTagFromContact(contactId: number, tag: string) {
  const db = await getDb();
  
  const contact = await getCRMContact(contactId);
  if (!contact[0]) return;

  const tags = contact[0].tags ? JSON.parse(contact[0].tags) : [];
  const updatedTags = tags.filter((t: string) => t !== tag);
  
  await db.update(crmContacts)
    .set({ tags: JSON.stringify(updatedTags) })
    .where(eq(crmContacts.id, contactId));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateSentimentTrend(sentimentData: any[]): 'improving' | 'declining' | 'stable' {
  if (sentimentData.length < 2) return 'stable';

  const firstHalf = sentimentData.slice(0, Math.floor(sentimentData.length / 2));
  const secondHalf = sentimentData.slice(Math.floor(sentimentData.length / 2));

  const avgFirst = firstHalf.reduce((sum, s) => sum + parseFloat(s.sentimentScore), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, s) => sum + parseFloat(s.sentimentScore), 0) / secondHalf.length;

  if (avgSecond > avgFirst) return 'improving';
  if (avgSecond < avgFirst) return 'declining';
  return 'stable';
}
