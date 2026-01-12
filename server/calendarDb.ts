import { getDb } from "./db";
import { projects, deliveries, constructions, users } from "../drizzle/schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";

// TODO: Restore after fixing calendarEvents table schema
// // import { calendarEvents } from "../drizzle/schema" (table removed);

// Placeholder for disabled functionality
const calendarEvents = {} as any;

/**
 * Calendar Database Functions
 */

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  eventType: "meeting" | "deadline" | "delivery" | "site_visit" | "presentation" | "milestone" | "personal" | "other";
  priority?: "low" | "medium" | "high" | "urgent";
  projectId?: number;
  deliveryId?: number;
  constructionId?: number;
  createdById: number;
  location?: string;
  isRecurring?: boolean;
  recurrenceRule?: any;
  reminderMinutes?: number;
  color?: string;
}): Promise<number> {
  const db = await getDb();

  const result = await db.insert(calendarEvents).values({
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    allDay: data.allDay ? 1 : 0,
    eventType: data.eventType,
    priority: data.priority || "medium",
    projectId: data.projectId,
    deliveryId: data.deliveryId,
    constructionId: data.constructionId,
    createdById: data.createdById,
    location: data.location,
    isRecurring: data.isRecurring ? 1 : 0,
    recurrenceRule: data.recurrenceRule,
    reminderMinutes: data.reminderMinutes,
    color: data.color || "#C9A882",
    status: "scheduled",
  });

  return result[0].insertId;
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  eventId: number,
  userId: number,
  data: Partial<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    eventType: "meeting" | "deadline" | "delivery" | "site_visit" | "presentation" | "milestone" | "personal" | "other";
    priority: "low" | "medium" | "high" | "urgent";
    projectId: number;
    deliveryId: number;
    constructionId: number;
    location: string;
    isRecurring: boolean;
    recurrenceRule: any;
    reminderMinutes: number;
    status: "scheduled" | "completed" | "cancelled" | "postponed";
    color: string;
  }>
): Promise<void> {
  const db = await getDb();

  // Check if user owns the event
  const event = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.id, eventId))
    .limit(1);

  if (event.length === 0) {
    throw new Error("Event not found");
  }

  if (event[0].createdById !== userId) {
    throw new Error("Unauthorized: You can only edit your own events");
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.allDay !== undefined) updateData.allDay = data.allDay ? 1 : 0;
  if (data.eventType !== undefined) updateData.eventType = data.eventType;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;
  if (data.deliveryId !== undefined) updateData.deliveryId = data.deliveryId;
  if (data.constructionId !== undefined) updateData.constructionId = data.constructionId;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring ? 1 : 0;
  if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule;
  if (data.reminderMinutes !== undefined) updateData.reminderMinutes = data.reminderMinutes;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.color !== undefined) updateData.color = data.color;

  await db.update(calendarEvents).set(updateData).where(eq(calendarEvents.id, eventId));
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: number, userId: number): Promise<void> {
  const db = await getDb();

  // Check if user owns the event
  const event = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.id, eventId))
    .limit(1);

  if (event.length === 0) {
    throw new Error("Event not found");
  }

  if (event[0].createdById !== userId) {
    throw new Error("Unauthorized: You can only delete your own events");
  }

  await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));
}

/**
 * Get events by date range
 */
export async function getEventsByDateRange(startDate: Date, endDate: Date, userId: number) {
  const db = await getDb();

  const events = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startDate: calendarEvents.startDate,
      endDate: calendarEvents.endDate,
      allDay: calendarEvents.allDay,
      eventType: calendarEvents.eventType,
      priority: calendarEvents.priority,
      projectId: calendarEvents.projectId,
      projectName: projects.name,
      deliveryId: calendarEvents.deliveryId,
      constructionId: calendarEvents.constructionId,
      location: calendarEvents.location,
      isRecurring: calendarEvents.isRecurring,
      recurrenceRule: calendarEvents.recurrenceRule,
      reminderMinutes: calendarEvents.reminderMinutes,
      status: calendarEvents.status,
      color: calendarEvents.color,
      createdById: calendarEvents.createdById,
      createdByName: users.name,
      createdAt: calendarEvents.createdAt,
    })
    .from(calendarEvents)
    .leftJoin(projects, eq(calendarEvents.projectId, projects.id))
    .leftJoin(users, eq(calendarEvents.createdById, users.id))
    .where(
      and(
        gte(calendarEvents.startDate, startDate),
        lte(calendarEvents.startDate, endDate)
      )
    )
    .orderBy(asc(calendarEvents.startDate));

  return events;
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(userId: number, days: number = 7) {
  const db = await getDb();
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const events = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      startDate: calendarEvents.startDate,
      endDate: calendarEvents.endDate,
      eventType: calendarEvents.eventType,
      priority: calendarEvents.priority,
      projectName: projects.name,
      color: calendarEvents.color,
      status: calendarEvents.status,
    })
    .from(calendarEvents)
    .leftJoin(projects, eq(calendarEvents.projectId, projects.id))
    .where(
      and(
        gte(calendarEvents.startDate, now),
        lte(calendarEvents.startDate, futureDate),
        eq(calendarEvents.status, "scheduled")
      )
    )
    .orderBy(asc(calendarEvents.startDate))
    .limit(10);

  return events;
}

/**
 * Get project deadlines and convert to calendar events
 */
export async function getProjectDeadlines(userId: number) {
  const db = await getDb();

  const projectsWithDeadlines = await db
    .select({
      id: projects.id,
      name: projects.name,
      deadline: projects.deadline,
      status: projects.status,
    })
    .from(projects)
    .where(sql`${projects.deadline} IS NOT NULL AND ${projects.status} != 'completed'`)
    .orderBy(asc(projects.deadline));

  return projectsWithDeadlines.map((project) => ({
    id: `project-deadline-${project.id}`,
    title: `Prazo: ${project.name}`,
    startDate: project.deadline,
    endDate: project.deadline,
    allDay: true,
    eventType: "deadline" as const,
    priority: "high" as const,
    projectId: project.id,
    projectName: project.name,
    color: "#E74C3C",
    status: "scheduled" as const,
    isAutoGenerated: true,
  }));
}

/**
 * Get a single event by ID
 */
export async function getCalendarEvent(eventId: number, userId: number) {
  const db = await getDb();

  const event = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startDate: calendarEvents.startDate,
      endDate: calendarEvents.endDate,
      allDay: calendarEvents.allDay,
      eventType: calendarEvents.eventType,
      priority: calendarEvents.priority,
      projectId: calendarEvents.projectId,
      projectName: projects.name,
      deliveryId: calendarEvents.deliveryId,
      constructionId: calendarEvents.constructionId,
      location: calendarEvents.location,
      isRecurring: calendarEvents.isRecurring,
      recurrenceRule: calendarEvents.recurrenceRule,
      reminderMinutes: calendarEvents.reminderMinutes,
      status: calendarEvents.status,
      color: calendarEvents.color,
      createdById: calendarEvents.createdById,
      createdByName: users.name,
      createdAt: calendarEvents.createdAt,
      updatedAt: calendarEvents.updatedAt,
    })
    .from(calendarEvents)
    .leftJoin(projects, eq(calendarEvents.projectId, projects.id))
    .leftJoin(users, eq(calendarEvents.createdById, users.id))
    .where(eq(calendarEvents.id, eventId))
    .limit(1);

  if (event.length === 0) {
    throw new Error("Event not found");
  }

  return event[0];
}

/**
 * Get events by project ID
 */
export async function getEventsByProject(projectId: number, userId: number) {
  const db = await getDb();

  const events = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.projectId, projectId))
    .orderBy(asc(calendarEvents.startDate));

  return events;
}
