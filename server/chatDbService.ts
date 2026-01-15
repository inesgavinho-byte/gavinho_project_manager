import { getDb } from "./db";
import { chatTopics, chatMessages, aiSuggestions, projectKnowledgeBase, chatNotifications } from "../drizzle/chatSchema";
import { eq, and, desc } from "drizzle-orm";

// Chat Topics
export async function getChatTopics(projectId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatTopics)
    .where(and(eq(chatTopics.projectId, projectId), eq(chatTopics.isArchived, false)))
    .orderBy(desc(chatTopics.createdAt));
}

export async function createChatTopic(data: {
  projectId: string;
  name: string;
  description?: string;
  category: string;
  createdBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatTopics).values(data);
  return result;
}

// Chat Messages
export async function getChatMessages(topicId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages)
    .where(eq(chatMessages.topicId, topicId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function createChatMessage(data: {
  topicId: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  parentMessageId?: string;
  mentionedUsers?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values(data);
  return result;
}

// AI Suggestions
export async function getAISuggestions(projectId: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(aiSuggestions)
    .where(eq(aiSuggestions.projectId, projectId));
  
  if (status) {
    query = query.where(eq(aiSuggestions.status, status as any));
  }
  
  return await query.orderBy(desc(aiSuggestions.createdAt));
}

export async function createAISuggestion(data: {
  topicId: string;
  projectId: string;
  messageId?: string;
  type: string;
  title: string;
  description: string;
  priority?: string;
  context?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiSuggestions).values(data);
  return result;
}

export async function approveSuggestion(suggestionId: string, approvedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(aiSuggestions)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
    })
    .where(eq(aiSuggestions.id, suggestionId));
  
  return result;
}

export async function rejectSuggestion(suggestionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(aiSuggestions)
    .set({ status: "rejected" })
    .where(eq(aiSuggestions.id, suggestionId));
  
  return result;
}

// Knowledge Base
export async function getProjectKnowledge(projectId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projectKnowledgeBase)
    .where(eq(projectKnowledgeBase.projectId, projectId));
}

export async function addProjectKnowledge(data: {
  projectId: string;
  category: string;
  key: string;
  value: string;
  source?: string;
  confidence?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectKnowledgeBase).values(data);
  return result;
}

// Notifications
export async function getChatNotifications(userId: string, unreadOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(chatNotifications)
    .where(eq(chatNotifications.userId, userId));
  
  if (unreadOnly) {
    query = query.where(eq(chatNotifications.isRead, false));
  }
  
  return await query.orderBy(desc(chatNotifications.createdAt));
}

export async function markNotificationAsRead(notificationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(chatNotifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(chatNotifications.id, notificationId));
  
  return result;
}

export async function createChatNotification(data: {
  userId: string;
  projectId: string;
  type: string;
  relatedId?: string;
  title: string;
  message?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatNotifications).values(data);
  return result;
}
