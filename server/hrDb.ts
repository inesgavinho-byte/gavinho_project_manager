import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { holidays, absences, timesheets, users } from "../drizzle/schema";
import { getDb } from "./db";

// ========== HOLIDAYS ==========

export async function getAllHolidays(year?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (year) {
    return await db.select().from(holidays).where(eq(holidays.year, year)).orderBy(holidays.date);
  }
  return await db.select().from(holidays).orderBy(holidays.date);
}

export async function createHoliday(data: {
  name: string;
  date: string;
  year: number;
  type: "national" | "regional" | "company";
  isRecurring: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(holidays).values(data);
}

export async function deleteHoliday(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(holidays).where(eq(holidays.id, id));
}

// ========== ABSENCES ==========

export async function getAllAbsences() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: absences.id,
      userId: absences.userId,
      userName: users.name,
      userEmail: users.email,
      type: absences.type,
      startDate: absences.startDate,
      endDate: absences.endDate,
      days: absences.days,
      reason: absences.reason,
      status: absences.status,
      approvedBy: absences.approvedBy,
      approvedAt: absences.approvedAt,
      rejectionReason: absences.rejectionReason,
      createdAt: absences.createdAt,
    })
    .from(absences)
    .leftJoin(users, eq(absences.userId, users.id))
    .orderBy(desc(absences.createdAt));
  
  return result;
}

export async function getPendingAbsences() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: absences.id,
      userId: absences.userId,
      userName: users.name,
      userEmail: users.email,
      type: absences.type,
      startDate: absences.startDate,
      endDate: absences.endDate,
      days: absences.days,
      reason: absences.reason,
      status: absences.status,
      createdAt: absences.createdAt,
    })
    .from(absences)
    .leftJoin(users, eq(absences.userId, users.id))
    .where(eq(absences.status, "pending"))
    .orderBy(absences.startDate);
  
  return result;
}

export async function getUserAbsences(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(absences)
    .where(eq(absences.userId, userId))
    .orderBy(desc(absences.createdAt));
}

export async function getAbsenceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      id: absences.id,
      userId: absences.userId,
      type: absences.type,
      startDate: absences.startDate,
      endDate: absences.endDate,
      days: absences.days,
      reason: absences.reason,
      status: absences.status,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(absences)
    .leftJoin(users, eq(absences.userId, users.id))
    .where(eq(absences.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createAbsence(data: {
  userId: number;
  type: "vacation" | "sick" | "personal" | "other";
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(absences).values({
    ...data,
    status: "pending",
  });
}

export async function approveAbsence(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(absences)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(absences.id, id));
}

export async function rejectAbsence(id: number, approvedBy: number, rejectionReason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(absences)
    .set({
      status: "rejected",
      approvedBy,
      approvedAt: new Date(),
      rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(absences.id, id));
}

// ========== METRICS ==========

export async function getAbsenceMetrics(year: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Total absences by type
  const totalByType = await db
    .select({
      type: absences.type,
      count: sql<number>`COUNT(*)`,
      totalDays: sql<number>`SUM(${absences.days})`,
    })
    .from(absences)
    .where(
      and(
        gte(absences.startDate, `${year}-01-01`),
        lte(absences.startDate, `${year}-12-31`)
      )
    )
    .groupBy(absences.type);
  
  // Absences by status
  const totalByStatus = await db
    .select({
      status: absences.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(absences)
    .where(
      and(
        gte(absences.startDate, `${year}-01-01`),
        lte(absences.startDate, `${year}-12-31`)
      )
    )
    .groupBy(absences.status);
  
  // Absences by month
  const byMonth = await db
    .select({
      month: sql<number>`MONTH(${absences.startDate})`,
      count: sql<number>`COUNT(*)`,
      totalDays: sql<number>`SUM(${absences.days})`,
    })
    .from(absences)
    .where(
      and(
        gte(absences.startDate, `${year}-01-01`),
        lte(absences.startDate, `${year}-12-31`)
      )
    )
    .groupBy(sql`MONTH(${absences.startDate})`);
  
  return {
    totalByType,
    totalByStatus,
    byMonth,
  };
}

export async function getUserVacationDays(userId: number, year: number) {
  const db = await getDb();
  if (!db) return { used: 0, remaining: 22 }; // Default 22 days vacation in Portugal
  
  const result = await db
    .select({
      totalDays: sql<number>`SUM(${absences.days})`,
    })
    .from(absences)
    .where(
      and(
        eq(absences.userId, userId),
        eq(absences.type, "vacation"),
        eq(absences.status, "approved"),
        gte(absences.startDate, `${year}-01-01`),
        lte(absences.startDate, `${year}-12-31`)
      )
    );
  
  const used = result[0]?.totalDays || 0;
  const remaining = 22 - used; // 22 dias de férias em Portugal
  
  return { used, remaining };
}

// ========== TIMESHEETS ==========

export async function getUserTimesheets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: timesheets.id,
      date: timesheets.date,
      hours: timesheets.hours,
      description: timesheets.description,
      status: timesheets.status,
      projectCode: sql<string>`(SELECT code FROM projects WHERE id = ${timesheets.projectId})`,
    })
    .from(timesheets)
    .where(eq(timesheets.userId, userId))
    .orderBy(desc(timesheets.date));
  
  return results;
}

export async function getPendingTimesheets() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: timesheets.id,
      date: timesheets.date,
      hours: timesheets.hours,
      description: timesheets.description,
      status: timesheets.status,
      userName: users.name,
      userEmail: users.email,
      projectCode: sql<string>`(SELECT code FROM projects WHERE id = ${timesheets.projectId})`,
    })
    .from(timesheets)
    .leftJoin(users, eq(timesheets.userId, users.id))
    .where(eq(timesheets.status, "pending"))
    .orderBy(desc(timesheets.date));
  
  return results;
}

export async function createTimesheet(data: {
  userId: number;
  projectId: number;
  date: string;
  hours: number;
  description: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(timesheets).values({
    userId: data.userId,
    projectId: data.projectId,
    date: new Date(data.date),
    hours: data.hours,
    description: data.description,
    status: "pending",
  });
}

export async function approveTimesheet(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(timesheets)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
    })
    .where(eq(timesheets.id, id));
}

export async function rejectTimesheet(id: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(timesheets)
    .set({
      status: "rejected",
      approvedBy,
      approvedAt: new Date(),
    })
    .where(eq(timesheets.id, id));
}

// ========== TIMESHEET STATISTICS ==========

export async function getTimesheetStats(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = [eq(timesheets.userId, userId)];
  if (startDate) conditions.push(gte(timesheets.date, new Date(startDate)));
  if (endDate) conditions.push(lte(timesheets.date, new Date(endDate)));
  
  const result = await db
    .select({
      totalHours: sql<number>`COALESCE(SUM(${timesheets.hours}), 0)`,
      totalEntries: sql<number>`COUNT(*)`,
      approvedHours: sql<number>`COALESCE(SUM(CASE WHEN ${timesheets.status} = 'approved' THEN ${timesheets.hours} ELSE 0 END), 0)`,
      pendingHours: sql<number>`COALESCE(SUM(CASE WHEN ${timesheets.status} = 'pending' THEN ${timesheets.hours} ELSE 0 END), 0)`,
      rejectedHours: sql<number>`COALESCE(SUM(CASE WHEN ${timesheets.status} = 'rejected' THEN ${timesheets.hours} ELSE 0 END), 0)`,
    })
    .from(timesheets)
    .where(and(...conditions));
  
  // Count unique projects
  const projectsResult = await db
    .select({
      uniqueProjects: sql<number>`COUNT(DISTINCT ${timesheets.projectId})`,
    })
    .from(timesheets)
    .where(and(...conditions));
  
  return {
    ...result[0],
    uniqueProjects: projectsResult[0]?.uniqueProjects || 0,
  };
}

export async function getTimesheetsByProject(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(timesheets.userId, userId)];
  if (startDate) conditions.push(gte(timesheets.date, new Date(startDate)));
  if (endDate) conditions.push(lte(timesheets.date, new Date(endDate)));
  
  const results = await db
    .select({
      projectId: timesheets.projectId,
      projectCode: sql<string>`(SELECT code FROM projects WHERE id = ${timesheets.projectId})`,
      projectName: sql<string>`(SELECT name FROM projects WHERE id = ${timesheets.projectId})`,
      totalHours: sql<number>`COALESCE(SUM(${timesheets.hours}), 0)`,
      entries: sql<number>`COUNT(*)`,
    })
    .from(timesheets)
    .where(and(...conditions))
    .groupBy(timesheets.projectId)
    .orderBy(sql`SUM(${timesheets.hours}) DESC`);
  
  return results;
}

export async function getTimesheetsByMonth(userId: number, months: number = 6) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const results = await db
    .select({
      month: sql<string>`DATE_FORMAT(${timesheets.date}, '%Y-%m')`,
      totalHours: sql<number>`COALESCE(SUM(${timesheets.hours}), 0)`,
      entries: sql<number>`COUNT(*)`,
      approvedHours: sql<number>`COALESCE(SUM(CASE WHEN ${timesheets.status} = 'approved' THEN ${timesheets.hours} ELSE 0 END), 0)`,
    })
    .from(timesheets)
    .where(
      and(
        eq(timesheets.userId, userId),
        gte(timesheets.date, startDate)
      )
    )
    .groupBy(sql`DATE_FORMAT(${timesheets.date}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${timesheets.date}, '%Y-%m') ASC`);
  
  return results;
}
