import { mysqlTable, varchar, text, timestamp, int, boolean, json, mysqlEnum } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Tópicos de conversa por projeto
export const chatTopics = mysqlTable('chat_topics', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: mysqlEnum('category', ['design', 'budget', 'timeline', 'team', 'procurement', 'technical', 'general']).default('general'),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  isArchived: boolean('is_archived').default(false),
});

// Mensagens no chat
export const chatMessages = mysqlTable('chat_messages', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  topicId: varchar('topic_id', { length: 36 }).notNull(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  parentMessageId: varchar('parent_message_id', { length: 36 }), // Para threads
  mentionedUsers: json('mentioned_users').$type<string[]>().default(sql`JSON_ARRAY()`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  isEdited: boolean('is_edited').default(false),
});

// Sugestões geradas pela IA
export const aiSuggestions = mysqlTable('ai_suggestions', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  topicId: varchar('topic_id', { length: 36 }).notNull(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  messageId: varchar('message_id', { length: 36 }), // Mensagem que gerou a sugestão
  type: mysqlEnum('type', ['action', 'decision', 'alert', 'insight', 'recommendation']).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'critical']).default('medium'),
  context: json('context').$type<Record<string, unknown>>().default(sql`JSON_OBJECT()`),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'implemented']).default('pending'),
  approvedBy: varchar('approved_by', { length: 36 }), // GP/Admin que aprovou
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Knowledge Base do projeto (resumo de decisões e contexto)
export const projectKnowledgeBase = mysqlTable('project_knowledge_base', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // ex: 'design_decisions', 'budget_constraints', 'team_roles'
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value').notNull(),
  source: varchar('source', { length: 36 }), // topicId ou messageId que originou
  confidence: int('confidence').default(100), // 0-100, confiança da informação
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Histórico de contexto para IA (para melhorar aprendizado)
export const aiContextHistory = mysqlTable('ai_context_history', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  topicId: varchar('topic_id', { length: 36 }),
  messageId: varchar('message_id', { length: 36 }),
  contextSnapshot: json('context_snapshot').$type<Record<string, unknown>>().notNull(),
  aiAnalysis: json('ai_analysis').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Notificações de menções e sugestões
export const chatNotifications = mysqlTable('chat_notifications', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar('user_id', { length: 36 }).notNull(),
  projectId: varchar('project_id', { length: 36 }).notNull(),
  type: mysqlEnum('type', ['mention', 'suggestion', 'reply', 'approval_needed']).notNull(),
  relatedId: varchar('related_id', { length: 36 }), // messageId, suggestionId, etc
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  readAt: timestamp('read_at'),
});

export type ChatTopic = typeof chatTopics.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type ProjectKnowledgeBase = typeof projectKnowledgeBase.$inferSelect;
export type AIContextHistory = typeof aiContextHistory.$inferSelect;
export type ChatNotification = typeof chatNotifications.$inferSelect;
