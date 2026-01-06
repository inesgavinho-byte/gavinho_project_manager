import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
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

export async function getUserTimesheets(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(timesheets).where(eq(timesheets.userId, userId));
  
  if (startDate && endDate) {
    query = query.where(
      and(
        eq(timesheets.userId, userId),
        gte(timesheets.date, startDate),
        lte(timesheets.date, endDate)
      )
    );
  }
  
  return await query.orderBy(desc(timesheets.date));
}

export async function createTimesheet(data: {
  userId: number;
  projectId?: number;
  date: string;
  hours: number;
  description?: string;
  taskType?: string;
  isBillable: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(timesheets).values({
    ...data,
    status: "draft",
  });
}
