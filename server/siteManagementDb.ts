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

// ============================================================================
// REPORTS - Relatórios Consolidados
// ============================================================================

export async function getReportData(constructionId: number, startDate: Date, endDate: Date) {
  // Import constructions table
  const { constructions } = await import("../drizzle/schema");
  
  // Get construction info
  const construction = await db
    .select()
    .from(constructions)
    .where(eq(constructions.id, constructionId))
    .then(rows => rows[0]);

  if (!construction) {
    throw new Error("Construction not found");
  }

  // Get attendance records
  const attendanceRecords = await db
    .select({
      workerName: siteWorkers.name,
      date: siteAttendance.date,
      checkIn: siteAttendance.checkIn,
      checkOut: siteAttendance.checkOut,
      totalHours: siteAttendance.totalHours,
    })
    .from(siteAttendance)
    .innerJoin(siteWorkers, eq(siteAttendance.workerId, siteWorkers.id))
    .where(
      and(
        eq(siteAttendance.constructionId, constructionId),
        sql`date >= ${startDate.toISOString().split('T')[0]}`,
        sql`date <= ${endDate.toISOString().split('T')[0]}`
      )
    );

  // Get work hours
  const workHoursRecords = await db
    .select({
      workerName: siteWorkers.name,
      taskDescription: siteWorkHours.taskDescription,
      hours: siteWorkHours.hours,
      date: siteWorkHours.date,
    })
    .from(siteWorkHours)
    .innerJoin(siteWorkers, eq(siteWorkHours.workerId, siteWorkers.id))
    .where(
      and(
        eq(siteWorkHours.constructionId, constructionId),
        sql`date >= ${startDate.toISOString().split('T')[0]}`,
        sql`date <= ${endDate.toISOString().split('T')[0]}`
      )
    );

  // Get materials usage
  const materialsRecords = await db
    .select({
      materialName: siteMaterialUsage.materialName,
      quantity: siteMaterialUsage.quantity,
      unit: siteMaterialUsage.unit,
      usedBy: siteWorkers.name,
      date: siteMaterialUsage.date,
    })
    .from(siteMaterialUsage)
    .innerJoin(siteWorkers, eq(siteMaterialUsage.usedBy, siteWorkers.id))
    .where(
      and(
        eq(siteMaterialUsage.constructionId, constructionId),
        sql`siteMaterialUsage.date >= ${startDate.toISOString().split('T')[0]}`,
        sql`siteMaterialUsage.date <= ${endDate.toISOString().split('T')[0]}`
      )
    );

  // Get photos
  const photosRecords = await db
    .select({
      photoUrl: siteWorkPhotos.photoUrl,
      description: siteWorkPhotos.description,
      location: siteWorkPhotos.location,
      uploadedBy: siteWorkers.name,
      date: siteWorkPhotos.date,
    })
    .from(siteWorkPhotos)
    .innerJoin(siteWorkers, eq(siteWorkPhotos.uploadedBy, siteWorkers.id))
    .where(
      and(
        eq(siteWorkPhotos.constructionId, constructionId),
        sql`siteWorkPhotos.date >= ${startDate}`,
        sql`siteWorkPhotos.date <= ${endDate}`
      )
    );

  // Get non-compliances
  const nonCompliancesRecords = await db
    .select({
      description: siteNonCompliances.description,
      severity: siteNonCompliances.severity,
      status: siteNonCompliances.status,
      responsibleName: siteWorkers.name,
      reportedDate: siteNonCompliances.reportedDate,
    })
    .from(siteNonCompliances)
    .leftJoin(siteWorkers, eq(siteNonCompliances.responsibleId, siteWorkers.id))
    .where(
      and(
        eq(siteNonCompliances.constructionId, constructionId),
        sql`reportedDate >= ${startDate}`,
        sql`reportedDate <= ${endDate}`
      )
    );

  return {
    construction: {
      code: construction.code,
      name: construction.name,
      address: construction.address,
    },
    period: {
      startDate,
      endDate,
    },
    attendance: attendanceRecords,
    workHours: workHoursRecords,
    materials: materialsRecords,
    photos: photosRecords,
    nonCompliances: nonCompliancesRecords,
  };
}
