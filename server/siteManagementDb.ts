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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [photo] = await db.insert(siteWorkPhotos).values(data);
  return photo;
}

export async function getWorkPhotosByConstruction(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];
  
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
  const db = await getDb();
  if (!db) return null;
  
  const [photo] = await db
    .select()
    .from(siteWorkPhotos)
    .where(eq(siteWorkPhotos.id, id));
  return photo;
}

export async function deleteWorkPhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(siteWorkPhotos).where(eq(siteWorkPhotos.id, id));
}

// ============================================================================
// NON-COMPLIANCES - Não Conformidades
// ============================================================================

export async function createNonCompliance(data: InsertSiteNonCompliance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [nonCompliance] = await db.insert(siteNonCompliances).values(data);
  return nonCompliance;
}

export async function getNonCompliancesByConstruction(constructionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(siteNonCompliances)
    .where(eq(siteNonCompliances.constructionId, constructionId))
    .orderBy(desc(siteNonCompliances.date));
}

export async function getNonComplianceById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(siteNonCompliances)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(siteNonCompliances.id, id));
  return getNonComplianceById(id);
}

export async function resolveNonCompliance(id: number, resolvedBy: number, resolution: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
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
      checkIn: siteAttendance.checkIn,
      checkOut: siteAttendance.checkOut,
    })
    .from(siteAttendance)
    .innerJoin(siteWorkers, eq(siteAttendance.workerId, siteWorkers.id))
    .where(
      and(
        eq(siteAttendance.constructionId, constructionId),
        sql`checkIn >= ${startDate}`,
        sql`checkIn <= ${endDate}`
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
      reportedDate: siteNonCompliances.date,
    })
    .from(siteNonCompliances)
    .leftJoin(siteWorkers, eq(siteNonCompliances.reportedBy, siteWorkers.id))
    .where(
      and(
        eq(siteNonCompliances.constructionId, constructionId),
        sql`date >= ${startDate}`,
        sql`date <= ${endDate}`
      )
    );

  return {
    construction: {
      code: construction.code,
      name: construction.name,
      location: construction.location,
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


// ============================================================================
// QUANTITY MAP - Mapa de Quantidades
// ============================================================================

export async function getQuantityMapItems(constructionId: number) {
  const { siteQuantityMap } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(siteQuantityMap)
    .where(eq(siteQuantityMap.constructionId, constructionId))
    .orderBy(siteQuantityMap.order, siteQuantityMap.category);
}

export async function getQuantityMapItemById(id: number) {
  const { siteQuantityMap } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [item] = await db
    .select()
    .from(siteQuantityMap)
    .where(eq(siteQuantityMap.id, id));
  return item;
}

export async function createQuantityMapItem(data: any) {
  const { siteQuantityMap } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [item] = await db.insert(siteQuantityMap).values(data);
  return item;
}

export async function updateQuantityMapItem(id: number, data: any) {
  const { siteQuantityMap } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(siteQuantityMap)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(siteQuantityMap.id, id));
  return getQuantityMapItemById(id);
}

export async function updateQuantityExecuted(
  itemId: number,
  quantityExecuted: number,
  updatedBy: number,
  notes?: string
) {
  const { siteQuantityMap, siteQuantityProgress } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update current quantity in main table
  await db
    .update(siteQuantityMap)
    .set({ 
      currentQuantity: quantityExecuted.toString(),
      updatedAt: new Date() 
    })
    .where(eq(siteQuantityMap.id, itemId));

  // Get construction ID
  const item = await getQuantityMapItemById(itemId);
  if (!item) throw new Error("Item not found");

  // Record progress history
  await db.insert(siteQuantityProgress).values({
    quantityMapId: itemId,
    constructionId: item.constructionId,
    updatedBy,
    date: new Date(),
    quantity: quantityExecuted.toString(),
    notes: notes || null,
    photos: null,
    status: "pending",
  });

  // Send notification to owner about new marcation
  try {
    const { notifyOwner } = await import("./_core/notification");
    await notifyOwner({
      title: "Nova marcação MQT pendente",
      content: `Nova marcação de quantidade no item "${item.item}": ${quantityExecuted} ${item.unit}. Aguarda aprovação.`,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }

  return getQuantityMapItemById(itemId);
}

export async function getQuantityMapProgress(itemId: number) {
  const { siteQuantityProgress, users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      id: siteQuantityProgress.id,
      date: siteQuantityProgress.date,
      quantity: siteQuantityProgress.quantity,
      notes: siteQuantityProgress.notes,
      photos: siteQuantityProgress.photos,
      status: siteQuantityProgress.status,
      approvedBy: siteQuantityProgress.approvedBy,
      approvedAt: siteQuantityProgress.approvedAt,
      rejectionReason: siteQuantityProgress.rejectionReason,
      updatedBy: users.name,
      createdAt: siteQuantityProgress.createdAt,
    })
    .from(siteQuantityProgress)
    .leftJoin(users, eq(siteQuantityProgress.updatedBy, users.id))
    .where(eq(siteQuantityProgress.quantityMapId, itemId))
    .orderBy(desc(siteQuantityProgress.date));
}

export async function getQuantityMapStats(constructionId: number) {
  const { siteQuantityMap } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const items = await db
    .select()
    .from(siteQuantityMap)
    .where(eq(siteQuantityMap.constructionId, constructionId));

  let totalPlanned = 0;
  let totalExecuted = 0;
  let completedItems = 0;
  let inProgressItems = 0;
  let notStartedItems = 0;

  items.forEach((item: any) => {
    const planned = parseFloat(item.plannedQuantity);
    const executed = parseFloat(item.currentQuantity);
    
    totalPlanned += planned;
    totalExecuted += executed;

    const progress = planned > 0 ? (executed / planned) * 100 : 0;
    
    if (progress >= 100) {
      completedItems++;
    } else if (progress > 0) {
      inProgressItems++;
    } else {
      notStartedItems++;
    }
  });

  const overallProgress = totalPlanned > 0 ? (totalExecuted / totalPlanned) * 100 : 0;

  return {
    totalItems: items.length,
    completedItems,
    inProgressItems,
    notStartedItems,
    totalPlanned,
    totalExecuted,
    overallProgress: Math.round(overallProgress * 100) / 100,
  };
}

export async function getQuantityMapByCategory(constructionId: number) {
  const { siteQuantityMap } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const items = await db
    .select()
    .from(siteQuantityMap)
    .where(eq(siteQuantityMap.constructionId, constructionId))
    .orderBy(siteQuantityMap.category, siteQuantityMap.order);

  // Group by category
  const grouped: Record<string, any[]> = {};
  
  items.forEach((item: any) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    
    const planned = parseFloat(item.plannedQuantity);
    const executed = parseFloat(item.currentQuantity);
    const progress = planned > 0 ? (executed / planned) * 100 : 0;
    
    grouped[item.category].push({
      ...item,
      progress: Math.round(progress * 100) / 100,
    });
  });

  // Calculate category stats
  const categoryStats = Object.entries(grouped).map(([category, categoryItems]) => {
    let totalPlanned = 0;
    let totalExecuted = 0;
    
    categoryItems.forEach(item => {
      totalPlanned += parseFloat(item.plannedQuantity);
      totalExecuted += parseFloat(item.currentQuantity);
    });
    
    const progress = totalPlanned > 0 ? (totalExecuted / totalPlanned) * 100 : 0;
    
    return {
      category,
      items: categoryItems,
      itemCount: categoryItems.length,
      totalPlanned,
      totalExecuted,
      progress: Math.round(progress * 100) / 100,
    };
  });

  return categoryStats;
}

// Approval functions for quantity map progress
export async function approveMarcation(progressId: number, approvedBy: number) {
  const { siteQuantityProgress, siteQuantityMap, users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get marcation details before updating
  const marcation = await db
    .select({
      updatedBy: siteQuantityProgress.updatedBy,
      quantity: siteQuantityProgress.quantity,
      quantityMapId: siteQuantityProgress.quantityMapId,
    })
    .from(siteQuantityProgress)
    .where(eq(siteQuantityProgress.id, progressId))
    .limit(1);
  
  if (!marcation || marcation.length === 0) {
    throw new Error("Marcation not found");
  }
  
  // Get item details
  const item = await db
    .select({
      item: siteQuantityMap.item,
      unit: siteQuantityMap.unit,
    })
    .from(siteQuantityMap)
    .where(eq(siteQuantityMap.id, marcation[0].quantityMapId))
    .limit(1);
  
  // Update marcation status
  await db
    .update(siteQuantityProgress)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(siteQuantityProgress.id, progressId));
  
  // Send notification to worker
  if (marcation[0].updatedBy && item && item.length > 0) {
    try {
      const { notifyOwner } = await import("./_core/notification");
      const worker = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, marcation[0].updatedBy))
        .limit(1);
      
      if (worker && worker.length > 0) {
        await notifyOwner({
          title: "Marcação MQT aprovada",
          content: `A marcação de ${worker[0].name} para o item "${item[0].item}" (${marcation[0].quantity} ${item[0].unit}) foi aprovada.`,
        });
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }
  
  return true;
}

export async function rejectMarcation(progressId: number, approvedBy: number, reason: string) {
  const { siteQuantityProgress, siteQuantityMap, users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get marcation details before updating
  const marcation = await db
    .select({
      updatedBy: siteQuantityProgress.updatedBy,
      quantity: siteQuantityProgress.quantity,
      quantityMapId: siteQuantityProgress.quantityMapId,
    })
    .from(siteQuantityProgress)
    .where(eq(siteQuantityProgress.id, progressId))
    .limit(1);
  
  if (!marcation || marcation.length === 0) {
    throw new Error("Marcation not found");
  }
  
  // Get item details
  const item = await db
    .select({
      item: siteQuantityMap.item,
      unit: siteQuantityMap.unit,
    })
    .from(siteQuantityMap)
    .where(eq(siteQuantityMap.id, marcation[0].quantityMapId))
    .limit(1);
  
  // Update marcation status
  await db
    .update(siteQuantityProgress)
    .set({
      status: "rejected",
      approvedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(siteQuantityProgress.id, progressId));
  
  // Send notification to worker
  if (marcation[0].updatedBy && item && item.length > 0) {
    try {
      const { notifyOwner } = await import("./_core/notification");
      const worker = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, marcation[0].updatedBy))
        .limit(1);
      
      if (worker && worker.length > 0) {
        await notifyOwner({
          title: "Marcação MQT rejeitada",
          content: `A marcação de ${worker[0].name} para o item "${item[0].item}" (${marcation[0].quantity} ${item[0].unit}) foi rejeitada. Motivo: ${reason}`,
        });
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }
  
  return true;
}

export async function getPendingMarcations(constructionId: number) {
  const { siteQuantityProgress, siteQuantityMap, users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      id: siteQuantityProgress.id,
      date: siteQuantityProgress.date,
      quantity: siteQuantityProgress.quantity,
      notes: siteQuantityProgress.notes,
      photos: siteQuantityProgress.photos,
      status: siteQuantityProgress.status,
      updatedBy: users.name,
      updatedById: siteQuantityProgress.updatedBy,
      createdAt: siteQuantityProgress.createdAt,
      item: siteQuantityMap.item,
      category: siteQuantityMap.category,
      unit: siteQuantityMap.unit,
    })
    .from(siteQuantityProgress)
    .leftJoin(siteQuantityMap, eq(siteQuantityProgress.quantityMapId, siteQuantityMap.id))
    .leftJoin(users, eq(siteQuantityProgress.updatedBy, users.id))
    .where(
      and(
        eq(siteQuantityProgress.constructionId, constructionId),
        eq(siteQuantityProgress.status, "pending")
      )
    )
    .orderBy(desc(siteQuantityProgress.date));
}

export async function getMarcationsByStatus(
  constructionId: number,
  status?: "pending" | "approved" | "rejected"
) {
  const { siteQuantityProgress, siteQuantityMap, users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(siteQuantityProgress.constructionId, constructionId)];
  
  if (status) {
    conditions.push(eq(siteQuantityProgress.status, status));
  }
  
  return await db
    .select({
      id: siteQuantityProgress.id,
      date: siteQuantityProgress.date,
      quantity: siteQuantityProgress.quantity,
      notes: siteQuantityProgress.notes,
      photos: siteQuantityProgress.photos,
      status: siteQuantityProgress.status,
      rejectionReason: siteQuantityProgress.rejectionReason,
      updatedBy: users.name,
      updatedById: siteQuantityProgress.updatedBy,
      approvedAt: siteQuantityProgress.approvedAt,
      createdAt: siteQuantityProgress.createdAt,
      item: siteQuantityMap.item,
      category: siteQuantityMap.category,
      unit: siteQuantityMap.unit,
    })
    .from(siteQuantityProgress)
    .leftJoin(siteQuantityMap, eq(siteQuantityProgress.quantityMapId, siteQuantityMap.id))
    .leftJoin(users, eq(siteQuantityProgress.updatedBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(siteQuantityProgress.date));
}

export async function getPendingMarcationsCount(constructionId: number) {
  const { siteQuantityProgress } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(siteQuantityProgress)
    .where(
      and(
        eq(siteQuantityProgress.constructionId, constructionId),
        eq(siteQuantityProgress.status, "pending")
      )
    );
  
  return result.length;
}


// ============================================
// MQT Analytics Functions
// ============================================

export async function getProductivityByWorker(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const { siteQuantityProgress, users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(siteQuantityProgress.constructionId, constructionId)];
  
  if (startDate) {
    conditions.push(gte(siteQuantityProgress.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(siteQuantityProgress.date, endDate));
  }

  const marcations = await db
    .select({
      workerId: siteQuantityProgress.updatedBy,
      workerName: users.name,
      quantity: siteQuantityProgress.quantity,
      status: siteQuantityProgress.status,
      date: siteQuantityProgress.date,
    })
    .from(siteQuantityProgress)
    .leftJoin(users, eq(siteQuantityProgress.updatedBy, users.id))
    .where(and(...conditions));

  // Group by worker
  const workerStats = marcations.reduce((acc: any, m: any) => {
    if (!acc[m.workerId]) {
      acc[m.workerId] = {
        workerId: m.workerId,
        workerName: m.workerName || "Desconhecido",
        totalQuantity: 0,
        totalMarcations: 0,
        approvedMarcations: 0,
        rejectedMarcations: 0,
        pendingMarcations: 0,
        dates: new Set(),
      };
    }
    
    acc[m.workerId].totalQuantity += parseFloat(m.quantity) || 0;
    acc[m.workerId].totalMarcations += 1;
    acc[m.workerId].dates.add(m.date.toISOString().split('T')[0]);
    
    if (m.status === "approved") acc[m.workerId].approvedMarcations += 1;
    if (m.status === "rejected") acc[m.workerId].rejectedMarcations += 1;
    if (m.status === "pending") acc[m.workerId].pendingMarcations += 1;
    
    return acc;
  }, {});

  // Calculate metrics
  return Object.values(workerStats).map((worker: any) => ({
    workerId: worker.workerId,
    workerName: worker.workerName,
    totalQuantity: worker.totalQuantity,
    totalMarcations: worker.totalMarcations,
    approvedMarcations: worker.approvedMarcations,
    rejectedMarcations: worker.rejectedMarcations,
    pendingMarcations: worker.pendingMarcations,
    approvalRate: worker.totalMarcations > 0 
      ? ((worker.approvedMarcations / worker.totalMarcations) * 100).toFixed(1)
      : "0.0",
    activeDays: worker.dates.size,
    avgDailyQuantity: worker.dates.size > 0
      ? (worker.totalQuantity / worker.dates.size).toFixed(2)
      : "0.00",
  }));
}

export async function getTemporalEvolution(
  constructionId: number,
  groupBy: "day" | "week" | "month" = "day",
  startDate?: Date,
  endDate?: Date
) {
  const { siteQuantityProgress } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [
    eq(siteQuantityProgress.constructionId, constructionId),
    eq(siteQuantityProgress.status, "approved"), // Only count approved
  ];
  
  if (startDate) {
    conditions.push(gte(siteQuantityProgress.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(siteQuantityProgress.date, endDate));
  }

  const marcations = await db
    .select({
      date: siteQuantityProgress.date,
      quantity: siteQuantityProgress.quantity,
    })
    .from(siteQuantityProgress)
    .where(and(...conditions))
    .orderBy(siteQuantityProgress.date);

  // Group by period
  const grouped = marcations.reduce((acc: any, m: any) => {
    let key: string;
    const date = new Date(m.date);
    
    if (groupBy === "day") {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!acc[key]) {
      acc[key] = { period: key, totalQuantity: 0, marcationsCount: 0 };
    }
    
    acc[key].totalQuantity += parseFloat(m.quantity) || 0;
    acc[key].marcationsCount += 1;
    
    return acc;
  }, {});

  return Object.values(grouped).sort((a: any, b: any) => 
    a.period.localeCompare(b.period)
  );
}

export async function getCategoryComparison(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const { siteQuantityProgress, siteQuantityMap } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(siteQuantityProgress.constructionId, constructionId)];
  
  if (startDate) {
    conditions.push(gte(siteQuantityProgress.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(siteQuantityProgress.date, endDate));
  }

  const marcations = await db
    .select({
      category: siteQuantityMap.category,
      quantity: siteQuantityProgress.quantity,
      status: siteQuantityProgress.status,
    })
    .from(siteQuantityProgress)
    .leftJoin(siteQuantityMap, eq(siteQuantityProgress.quantityMapId, siteQuantityMap.id))
    .where(and(...conditions));

  // Group by category
  const categoryStats = marcations.reduce((acc: any, m: any) => {
    const cat = m.category || "Sem categoria";
    
    if (!acc[cat]) {
      acc[cat] = {
        category: cat,
        totalQuantity: 0,
        totalMarcations: 0,
        approvedQuantity: 0,
        approvedMarcations: 0,
      };
    }
    
    const qty = parseFloat(m.quantity) || 0;
    acc[cat].totalQuantity += qty;
    acc[cat].totalMarcations += 1;
    
    if (m.status === "approved") {
      acc[cat].approvedQuantity += qty;
      acc[cat].approvedMarcations += 1;
    }
    
    return acc;
  }, {});

  return Object.values(categoryStats).map((cat: any) => ({
    category: cat.category,
    totalQuantity: cat.totalQuantity,
    totalMarcations: cat.totalMarcations,
    approvedQuantity: cat.approvedQuantity,
    approvedMarcations: cat.approvedMarcations,
    approvalRate: cat.totalMarcations > 0
      ? ((cat.approvedMarcations / cat.totalMarcations) * 100).toFixed(1)
      : "0.0",
  }));
}

export async function getAnalyticsSummary(
  constructionId: number,
  startDate?: Date,
  endDate?: Date
) {
  const { siteQuantityProgress, users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(siteQuantityProgress.constructionId, constructionId)];
  
  if (startDate) {
    conditions.push(gte(siteQuantityProgress.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(siteQuantityProgress.date, endDate));
  }

  const marcations = await db
    .select({
      quantity: siteQuantityProgress.quantity,
      status: siteQuantityProgress.status,
      date: siteQuantityProgress.date,
      workerId: siteQuantityProgress.updatedBy,
      workerName: users.name,
    })
    .from(siteQuantityProgress)
    .leftJoin(users, eq(siteQuantityProgress.updatedBy, users.id))
    .where(and(...conditions));

  const totalQuantity = marcations.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
  const approvedQuantity = marcations
    .filter(m => m.status === "approved")
    .reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);

  const uniqueDates = new Set(marcations.map(m => m.date.toISOString().split('T')[0]));
  const avgDailyQuantity = uniqueDates.size > 0 ? totalQuantity / uniqueDates.size : 0;

  // Find most productive worker
  const workerTotals = marcations.reduce((acc: any, m) => {
    if (!acc[m.workerId]) {
      acc[m.workerId] = { name: m.workerName || "Desconhecido", total: 0 };
    }
    acc[m.workerId].total += parseFloat(m.quantity) || 0;
    return acc;
  }, {});

  const topWorker = Object.values(workerTotals).sort((a: any, b: any) => b.total - a.total)[0] as any;

  return {
    totalQuantity: totalQuantity.toFixed(2),
    approvedQuantity: approvedQuantity.toFixed(2),
    totalMarcations: marcations.length,
    approvedMarcations: marcations.filter(m => m.status === "approved").length,
    avgDailyQuantity: avgDailyQuantity.toFixed(2),
    activeDays: uniqueDates.size,
    topWorkerName: topWorker?.name || "N/A",
    topWorkerQuantity: topWorker?.total.toFixed(2) || "0.00",
  };
}


// ============================================
