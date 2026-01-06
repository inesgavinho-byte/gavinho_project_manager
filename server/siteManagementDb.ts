import { getDb } from "./db";
const db = getDb();
import {
  siteWorkers,
  siteAttendance,
  siteWorkHours,
  siteMaterialRequests,
  siteMaterialUsage,
  siteWorkPhotos,
  siteNonCompliances,
  type SiteWorker,
  type InsertSiteWorker,
  type SiteAttendance,
  type InsertSiteAttendance,
  type SiteWorkHours,
  type InsertSiteWorkHours,
  type SiteMaterialRequest,
  type InsertSiteMaterialRequest,
  type SiteMaterialUsage,
  type InsertSiteMaterialUsage,
  type SiteWorkPhoto,
  type InsertSiteWorkPhoto,
  type SiteNonCompliance,
  type InsertSiteNonCompliance,
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";

// ============================================================================
// WORKERS - Gestão de Trabalhadores
// ============================================================================

export async function createWorker(data: InsertSiteWorker) {
  const [worker] = await db.insert(siteWorkers).values(data);
  return worker;
}

export async function getWorkersByConstruction(constructionId: number) {
  return await db
    .select()
    .from(siteWorkers)
    .where(eq(siteWorkers.constructionId, constructionId))
    .orderBy(desc(siteWorkers.createdAt));
}

export async function getWorkerById(id: number) {
  const [worker] = await db
    .select()
    .from(siteWorkers)
    .where(eq(siteWorkers.id, id));
  return worker;
}

export async function updateWorker(id: number, data: Partial<InsertSiteWorker>) {
  await db
    .update(siteWorkers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(siteWorkers.id, id));
  return getWorkerById(id);
}

export async function deleteWorker(id: number) {
  await db.delete(siteWorkers).where(eq(siteWorkers.id, id));
}

export async function getActiveWorkersByConstruction(constructionId: number) {
  return await db
    .select()
    .from(siteWorkers)
    .where(
      and(
        eq(siteWorkers.constructionId, constructionId),
        eq(siteWorkers.isActive, true)
      )
    )
    .orderBy(siteWorkers.name);
}

// ============================================================================
// ATTENDANCE - Picagem de Ponto
// ============================================================================

export async function checkIn(data: InsertSiteAttendance) {
  const [attendance] = await db.insert(siteAttendance).values(data);
  return attendance;
}

export async function checkOut(attendanceId: number, checkOutTime: Date, notes?: string) {
  await db
    .update(siteAttendance)
    .set({ checkOut: checkOutTime, notes })
    .where(eq(siteAttendance.id, attendanceId));
  return getAttendanceById(attendanceId);
}

export async function getAttendanceById(id: number) {
  const [attendance] = await db
    .select()
    .from(siteAttendance)
    .where(eq(siteAttendance.id, id));
  return attendance;
}

export async function getAttendanceByConstruction(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(siteAttendance.constructionId, constructionId)];
  
  if (startDate) {
    conditions.push(gte(siteAttendance.checkIn, startDate));
  }
  if (endDate) {
    conditions.push(lte(siteAttendance.checkIn, endDate));
  }

  return await db
    .select()
    .from(siteAttendance)
    .where(and(...conditions))
    .orderBy(desc(siteAttendance.checkIn));
}

export async function getAttendanceByWorker(
  workerId: number,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(siteAttendance.workerId, workerId)];
  
  if (startDate) {
    conditions.push(gte(siteAttendance.checkIn, startDate));
  }
  if (endDate) {
    conditions.push(lte(siteAttendance.checkIn, endDate));
  }

  return await db
    .select()
    .from(siteAttendance)
    .where(and(...conditions))
    .orderBy(desc(siteAttendance.checkIn));
}

export async function getActiveAttendance(workerId: number, constructionId: number) {
  const [attendance] = await db
    .select()
    .from(siteAttendance)
    .where(
      and(
        eq(siteAttendance.workerId, workerId),
        eq(siteAttendance.constructionId, constructionId),
        isNull(siteAttendance.checkOut)
      )
    )
    .orderBy(desc(siteAttendance.checkIn))
    .limit(1);
  return attendance;
}

// ============================================================================
// WORK HOURS - Registo de Horas Trabalhadas
// ============================================================================

export async function createWorkHours(data: InsertSiteWorkHours) {
  const [workHours] = await db.insert(siteWorkHours).values(data);
  return workHours;
}

export async function getWorkHoursByConstruction(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(siteWorkHours.constructionId, constructionId)];
  
  if (startDate) {
    conditions.push(sql`${siteWorkHours.date} >= ${startDate.toISOString().split('T')[0]}`);
  }
  if (endDate) {
    conditions.push(sql`${siteWorkHours.date} <= ${endDate.toISOString().split('T')[0]}`);
  }

  return await db
    .select()
    .from(siteWorkHours)
    .where(and(...conditions))
    .orderBy(desc(siteWorkHours.date));
}

export async function getWorkHoursByWorker(
  workerId: number,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(siteWorkHours.workerId, workerId)];
  
  if (startDate) {
    conditions.push(sql`${siteWorkHours.date} >= ${startDate.toISOString().split('T')[0]}`);
  }
  if (endDate) {
    conditions.push(sql`${siteWorkHours.date} <= ${endDate.toISOString().split('T')[0]}`);
  }

  return await db
    .select()
    .from(siteWorkHours)
    .where(and(...conditions))
    .orderBy(desc(siteWorkHours.date));
}

export async function approveWorkHours(id: number, approvedBy: number) {
  await db
    .update(siteWorkHours)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(siteWorkHours.id, id));
  return getWorkHoursById(id);
}

export async function rejectWorkHours(id: number, approvedBy: number) {
  await db
    .update(siteWorkHours)
    .set({
      status: "rejected",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(siteWorkHours.id, id));
  return getWorkHoursById(id);
}

export async function getWorkHoursById(id: number) {
  const [workHours] = await db
    .select()
    .from(siteWorkHours)
    .where(eq(siteWorkHours.id, id));
  return workHours;
}

// ============================================================================
// MATERIAL REQUESTS - Requisição de Materiais
// ============================================================================

export async function createMaterialRequest(data: InsertSiteMaterialRequest) {
  const [request] = await db.insert(siteMaterialRequests).values(data);
  return request;
}

export async function getMaterialRequestsByConstruction(constructionId: number) {
  return await db
    .select()
    .from(siteMaterialRequests)
    .where(eq(siteMaterialRequests.constructionId, constructionId))
    .orderBy(desc(siteMaterialRequests.createdAt));
}

export async function getMaterialRequestById(id: number) {
  const [request] = await db
    .select()
    .from(siteMaterialRequests)
    .where(eq(siteMaterialRequests.id, id));
  return request;
}

export async function approveMaterialRequest(id: number, approvedBy: number) {
  await db
    .update(siteMaterialRequests)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(siteMaterialRequests.id, id));
  return getMaterialRequestById(id);
}

export async function rejectMaterialRequest(id: number, approvedBy: number) {
  await db
    .update(siteMaterialRequests)
    .set({
      status: "rejected",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(siteMaterialRequests.id, id));
  return getMaterialRequestById(id);
}

export async function markMaterialRequestDelivered(id: number) {
  await db
    .update(siteMaterialRequests)
    .set({
      status: "delivered",
      deliveredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(siteMaterialRequests.id, id));
  return getMaterialRequestById(id);
}

// ============================================================================
// MATERIAL USAGE - Consumo de Materiais
// ============================================================================

export async function createMaterialUsage(data: InsertSiteMaterialUsage) {
  const [usage] = await db.insert(siteMaterialUsage).values(data);
  return usage;
}

export async function getMaterialUsageByConstruction(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(siteMaterialUsage.constructionId, constructionId)];
  
  if (startDate) {
    conditions.push(sql`${siteMaterialUsage.date} >= ${startDate.toISOString().split('T')[0]}`);
  }
  if (endDate) {
    conditions.push(sql`${siteMaterialUsage.date} <= ${endDate.toISOString().split('T')[0]}`);
  }

  return await db
    .select()
    .from(siteMaterialUsage)
    .where(and(...conditions))
    .orderBy(desc(siteMaterialUsage.date));
}

export async function getMaterialUsageByWorker(
  workerId: number,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(siteMaterialUsage.usedBy, workerId)];
  
  if (startDate) {
    conditions.push(sql`${siteMaterialUsage.date} >= ${startDate.toISOString().split('T')[0]}`);
  }
  if (endDate) {
    conditions.push(sql`${siteMaterialUsage.date} <= ${endDate.toISOString().split('T')[0]}`);
  }

  return await db
    .select()
    .from(siteMaterialUsage)
    .where(and(...conditions))
    .orderBy(desc(siteMaterialUsage.date));
}

// ============================================================================
// WORK PHOTOS - Fotografias de Trabalho
// ============================================================================

export async function createWorkPhoto(data: InsertSiteWorkPhoto) {
  const [photo] = await db.insert(siteWorkPhotos).values(data);
  return photo;
}

export async function getWorkPhotosByConstruction(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(siteWorkPhotos.constructionId, constructionId)];
  
  if (startDate) {
    conditions.push(sql`${siteWorkPhotos.date} >= ${startDate.toISOString().split('T')[0]}`);
  }
  if (endDate) {
    conditions.push(sql`${siteWorkPhotos.date} <= ${endDate.toISOString().split('T')[0]}`);
  }

  return await db
    .select()
    .from(siteWorkPhotos)
    .where(and(...conditions))
    .orderBy(desc(siteWorkPhotos.date));
}

export async function getWorkPhotoById(id: number) {
  const [photo] = await db
    .select()
    .from(siteWorkPhotos)
    .where(eq(siteWorkPhotos.id, id));
  return photo;
}

export async function deleteWorkPhoto(id: number) {
  await db.delete(siteWorkPhotos).where(eq(siteWorkPhotos.id, id));
}

// ============================================================================
// NON-COMPLIANCES - Não Conformidades
// ============================================================================

export async function createNonCompliance(data: InsertSiteNonCompliance) {
  const [nonCompliance] = await db.insert(siteNonCompliances).values(data);
  return nonCompliance;
}

export async function getNonCompliancesByConstruction(constructionId: number) {
  return await db
    .select()
    .from(siteNonCompliances)
    .where(eq(siteNonCompliances.constructionId, constructionId))
    .orderBy(desc(siteNonCompliances.date));
}

export async function getNonComplianceById(id: number) {
  const [nonCompliance] = await db
    .select()
    .from(siteNonCompliances)
    .where(eq(siteNonCompliances.id, id));
  return nonCompliance;
}

export async function updateNonCompliance(
  id: number,
  data: Partial<InsertSiteNonCompliance>
) {
  await db
    .update(siteNonCompliances)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(siteNonCompliances.id, id));
  return getNonComplianceById(id);
}

export async function resolveNonCompliance(id: number, resolvedBy: number, resolution: string) {
  await db
    .update(siteNonCompliances)
    .set({
      status: "resolved",
      resolvedBy,
      resolvedAt: new Date(),
      correctiveAction: resolution,
      updatedAt: new Date(),
    })
    .where(eq(siteNonCompliances.id, id));
  return getNonComplianceById(id);
}

export async function verifyNonCompliance(id: number, verifiedBy: number) {
  await db
    .update(siteNonCompliances)
    .set({
      status: "closed",
      verifiedBy,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(siteNonCompliances.id, id));
  return getNonComplianceById(id);
}

export async function getOpenNonCompliancesByConstruction(constructionId: number) {
  return await db
    .select()
    .from(siteNonCompliances)
    .where(
      and(
        eq(siteNonCompliances.constructionId, constructionId),
        sql`${siteNonCompliances.status} IN ('open', 'in_progress')`
      )
    )
    .orderBy(desc(siteNonCompliances.date));
}
