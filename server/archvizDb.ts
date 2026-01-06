import { getDb } from "./db";
import { 
  archvizCompartments, 
  archvizRenders, 
  archvizComments,
  archvizAnnotations,
  type InsertArchvizCompartment,
  type InsertArchvizRender,
  type InsertArchvizComment
} from "../drizzle/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";

// ============================================================================
// COMPARTMENTS
// ============================================================================

export async function getCompartmentsByConstruction(constructionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(archvizCompartments)
    .where(eq(archvizCompartments.constructionId, constructionId))
    .orderBy(archvizCompartments.order, archvizCompartments.name);
}

export async function getCompartmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(archvizCompartments)
    .where(eq(archvizCompartments.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function createCompartment(data: InsertArchvizCompartment) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(archvizCompartments).values(data);
  return result.insertId;
}

export async function updateCompartment(id: number, data: Partial<InsertArchvizCompartment>) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(archvizCompartments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(archvizCompartments.id, id));
}

export async function deleteCompartment(id: number) {
  const db = await getDb();
  if (!db) return;
  // Also delete all renders in this compartment
  await db.delete(archvizRenders).where(eq(archvizRenders.compartmentId, id));
  await db.delete(archvizCompartments).where(eq(archvizCompartments.id, id));
}

// ============================================================================
// RENDERS
// ============================================================================

export async function getRendersByCompartment(compartmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.compartmentId, compartmentId))
    .orderBy(desc(archvizRenders.version));
}

export async function getRendersByConstruction(constructionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.constructionId, constructionId))
    .orderBy(desc(archvizRenders.createdAt));
}

export async function getRenderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function getNextVersionNumber(compartmentId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const result = await db
    .select({ maxVersion: sql<number>`COALESCE(MAX(${archvizRenders.version}), 0)` })
    .from(archvizRenders)
    .where(eq(archvizRenders.compartmentId, compartmentId));
  
  return (result[0]?.maxVersion || 0) + 1;
}

export async function createRender(data: InsertArchvizRender) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(archvizRenders).values(data);
  return result.insertId;
}

export async function updateRender(id: number, data: Partial<InsertArchvizRender>) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(archvizRenders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(archvizRenders.id, id));
}

export async function toggleFavorite(id: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(archvizRenders)
    .set({ isFavorite, updatedAt: new Date() })
    .where(eq(archvizRenders.id, id));
}

export async function deleteRender(id: number) {
  const db = await getDb();
  if (!db) return;
  // Also delete all comments on this render
  await db.delete(archvizComments).where(eq(archvizComments.renderId, id));
  await db.delete(archvizRenders).where(eq(archvizRenders.id, id));
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function getCommentsByRender(renderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(archvizComments)
    .where(eq(archvizComments.renderId, renderId))
    .orderBy(archvizComments.createdAt);
}

export async function getCommentCountByRender(renderId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(archvizComments)
    .where(eq(archvizComments.renderId, renderId));
  
  return result[0]?.count || 0;
}

export async function createComment(data: InsertArchvizComment) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(archvizComments).values(data);
  return result.insertId;
}

export async function updateComment(id: number, content: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(archvizComments)
    .set({ content, updatedAt: new Date() })
    .where(eq(archvizComments.id, id));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(archvizComments).where(eq(archvizComments.id, id));
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getArchvizStats(constructionId: number) {
  const db = await getDb();
  if (!db) return {
    compartmentCount: 0,
    renderCount: 0,
    commentCount: 0,
    pendingCount: 0,
    approvedDcCount: 0,
    approvedClientCount: 0,
  };

  const [compartmentCount, renderCount, commentCount, statusCounts] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(archvizCompartments)
      .where(eq(archvizCompartments.constructionId, constructionId))
      .then(r => r[0]?.count || 0),
    
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(archvizRenders)
      .where(eq(archvizRenders.constructionId, constructionId))
      .then(r => r[0]?.count || 0),
    
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(archvizComments)
      .innerJoin(archvizRenders, eq(archvizComments.renderId, archvizRenders.id))
      .where(eq(archvizRenders.constructionId, constructionId))
      .then(r => r[0]?.count || 0),

    db
      .select({
        status: archvizRenders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(archvizRenders)
      .where(eq(archvizRenders.constructionId, constructionId))
      .groupBy(archvizRenders.status),
  ]);

  const pendingCount = statusCounts.find(s => s.status === 'pending')?.count || 0;
  const approvedDcCount = statusCounts.find(s => s.status === 'approved_dc')?.count || 0;
  const approvedClientCount = statusCounts.find(s => s.status === 'approved_client')?.count || 0;

  return {
    compartmentCount,
    renderCount,
    commentCount,
    pendingCount,
    approvedDcCount,
    approvedClientCount,
  };
}

// ============================================================================
// STATUS HISTORY
// ============================================================================

export async function createStatusHistory(data: {
  renderId: number;
  oldStatus: 'pending' | 'approved_dc' | 'approved_client' | null;
  newStatus: 'pending' | 'approved_dc' | 'approved_client';
  changedById: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { archvizStatusHistory } = await import("../drizzle/schema");
  
  const result = await db.insert(archvizStatusHistory).values({
    renderId: data.renderId,
    oldStatus: data.oldStatus,
    newStatus: data.newStatus,
    changedById: data.changedById,
    notes: data.notes,
  });
  
  return result.insertId;
}

export async function getStatusHistory(renderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { archvizStatusHistory } = await import("../drizzle/schema");
  const { users } = await import("../drizzle/schema");
  
  const history = await db
    .select({
      id: archvizStatusHistory.id,
      renderId: archvizStatusHistory.renderId,
      oldStatus: archvizStatusHistory.oldStatus,
      newStatus: archvizStatusHistory.newStatus,
      changedById: archvizStatusHistory.changedById,
      changedByName: users.name,
      changedByEmail: users.email,
      notes: archvizStatusHistory.notes,
      createdAt: archvizStatusHistory.createdAt,
    })
    .from(archvizStatusHistory)
    .leftJoin(users, eq(archvizStatusHistory.changedById, users.id))
    .where(eq(archvizStatusHistory.renderId, renderId))
    .orderBy(desc(archvizStatusHistory.createdAt));
  
  return history;
}

export async function getConstructionByRenderId(renderId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { archvizRenders, archvizCompartments, constructions } = await import("../drizzle/schema");
  
  const result = await db
    .select({
      id: constructions.id,
      name: constructions.name,
      code: constructions.code,
    })
    .from(archvizRenders)
    .innerJoin(archvizCompartments, eq(archvizRenders.compartmentId, archvizCompartments.id))
    .innerJoin(constructions, eq(archvizCompartments.constructionId, constructions.id))
    .where(eq(archvizRenders.id, renderId))
    .limit(1);
  
  return result[0] || null;
}

export async function getReportData(constructionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { constructions, archvizRenders, archvizCompartments, archvizStatusHistory, archvizComments, users } = await import("../drizzle/schema");
  
  // Get construction info
  const construction = await db
    .select({
      id: constructions.id,
      name: constructions.name,
      code: constructions.code,
    })
    .from(constructions)
    .where(eq(constructions.id, constructionId))
    .limit(1);
  
  if (!construction[0]) return null;
  
  // Get all renders with compartment info
  const renders = await db
    .select({
      id: archvizRenders.id,
      name: archvizRenders.name,
      version: archvizRenders.version,
      status: archvizRenders.status,
      imageUrl: archvizRenders.imageUrl,
      isFavorite: archvizRenders.isFavorite,
      uploadedAt: archvizRenders.createdAt,
      compartmentId: archvizCompartments.id,
      compartmentName: archvizCompartments.name,
    })
    .from(archvizRenders)
    .innerJoin(archvizCompartments, eq(archvizRenders.compartmentId, archvizCompartments.id))
    .where(eq(archvizCompartments.constructionId, constructionId))
    .orderBy(archvizCompartments.order, archvizRenders.version);
  
  // Get history and comments for each render
  const rendersWithDetails = await Promise.all(
    renders.map(async (render) => {
      // Get history
      const history = await db
        .select({
          oldStatus: archvizStatusHistory.oldStatus,
          newStatus: archvizStatusHistory.newStatus,
          changedByName: users.name,
          changedAt: archvizStatusHistory.createdAt,
          notes: archvizStatusHistory.notes,
        })
        .from(archvizStatusHistory)
        .leftJoin(users, eq(archvizStatusHistory.changedById, users.id))
        .where(eq(archvizStatusHistory.renderId, render.id))
        .orderBy(desc(archvizStatusHistory.createdAt));
      
      // Get comments
      const comments = await db
        .select({
          content: archvizComments.content,
          authorName: users.name,
          createdAt: archvizComments.createdAt,
        })
        .from(archvizComments)
        .leftJoin(users, eq(archvizComments.userId, users.id))
        .where(eq(archvizComments.renderId, render.id))
        .orderBy(desc(archvizComments.createdAt));
      
      return {
        render,
        history,
        comments,
      };
    })
  );
  
  // Calculate statistics
  const stats = renders.reduce(
    (acc, render) => {
      acc.total++;
      if (render.status === "pending") acc.pending++;
      else if (render.status === "approved_dc") acc.approvedDc++;
      else if (render.status === "approved_client") acc.approvedClient++;
      return acc;
    },
    { total: 0, pending: 0, approvedDc: 0, approvedClient: 0 }
  );
  
  return {
    construction: construction[0],
    stats,
    renders: rendersWithDetails,
  };
}

// ============================================================================
// ANNOTATIONS
// ============================================================================

export async function getAnnotations(renderId: number) {
  const db = await getDb();
  if (!db) return { annotations: [] };
  
  const result = await db
    .select()
    .from(archvizAnnotations)
    .where(eq(archvizAnnotations.renderId, renderId))
    .orderBy(desc(archvizAnnotations.updatedAt))
    .limit(1);
  
  if (result.length === 0) {
    return { annotations: [] };
  }
  
  return {
    annotations: result[0].annotationsData as any[],
    updatedAt: result[0].updatedAt,
  };
}

export async function saveAnnotations(
  renderId: number,
  annotations: any[],
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Check if annotations exist for this render
  const existing = await db
    .select()
    .from(archvizAnnotations)
    .where(eq(archvizAnnotations.renderId, renderId))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db
      .update(archvizAnnotations)
      .set({
        annotationsData: annotations as any,
        updatedAt: new Date(),
      })
      .where(eq(archvizAnnotations.id, existing[0].id));
  } else {
    // Create new
    await db.insert(archvizAnnotations).values({
      renderId,
      annotationsData: annotations as any,
      createdById: userId,
    });
  }
}
