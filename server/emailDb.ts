import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { emails, type InsertEmail, type Email } from "../drizzle/schema";

/**
 * Insert new email
 */
export async function insertEmail(email: InsertEmail): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(emails).values(email);
}

/**
 * Get email by Outlook ID
 */
export async function getEmailByOutlookId(outlookId: string): Promise<Email | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(emails).where(eq(emails.outlookId, outlookId)).limit(1);
  return result[0];
}

/**
 * Get emails by user ID
 */
export async function getEmailsByUserId(userId: number, limit: number = 50): Promise<Email[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(emails)
    .where(eq(emails.userId, userId))
    .orderBy(desc(emails.receivedDateTime))
    .limit(limit);
}

/**
 * Get emails by project ID
 */
export async function getEmailsByProjectId(projectId: number): Promise<Email[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(emails)
    .where(eq(emails.projectId, projectId))
    .orderBy(desc(emails.receivedDateTime));
}

/**
 * Get emails by category
 */
export async function getEmailsByCategory(
  userId: number,
  category: Email["category"]
): Promise<Email[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(emails)
    .where(and(eq(emails.userId, userId), eq(emails.category, category)))
    .orderBy(desc(emails.receivedDateTime));
}

/**
 * Update email project assignment
 */
export async function assignEmailToProject(emailId: number, projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(emails).set({ projectId, updatedAt: new Date() }).where(eq(emails.id, emailId));
}

/**
 * Mark email as processed
 */
export async function markEmailAsProcessed(emailId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(emails)
    .set({ isProcessed: true, updatedAt: new Date() })
    .where(eq(emails.id, emailId));
}

/**
 * Get email statistics by category
 */
export async function getEmailStatsByCategory(userId: number): Promise<
  Array<{
    category: string;
    count: string;
  }>
> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select({
      category: emails.category,
      count: sql<string>`count(*)`.as("count"),
    })
    .from(emails)
    .where(eq(emails.userId, userId))
    .groupBy(emails.category);
}

/**
 * Search emails by keyword
 */
export async function searchEmails(userId: number, keyword: string): Promise<Email[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const searchPattern = `%${keyword}%`;
  
  return await db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        sql`(${emails.subject} LIKE ${searchPattern} OR ${emails.bodyPreview} LIKE ${searchPattern})`
      )
    )
    .orderBy(desc(emails.receivedDateTime))
    .limit(100);
}
