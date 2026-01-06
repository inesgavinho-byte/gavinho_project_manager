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

export async function getCompartmentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(archvizCompartments)
    .where(eq(archvizCompartments.projectId, projectId))
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

export async function getRendersByConstruction(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.projectId, projectId))
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

export async function getNextVersionNumberByProject(projectId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const result = await db
    .select({ maxVersion: sql<number>`COALESCE(MAX(${archvizRenders.version}), 0)` })
    .from(archvizRenders)
    .where(and(eq(archvizRenders.projectId, projectId), isNull(archvizRenders.compartmentId)));
  
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

export async function getArchvizStats(projectId: number) {
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
      .where(eq(archvizCompartments.projectId, projectId))
      .then(r => r[0]?.count || 0),
    
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(archvizRenders)
      .where(eq(archvizRenders.projectId, projectId))
      .then(r => r[0]?.count || 0),
    
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(archvizComments)
      .innerJoin(archvizRenders, eq(archvizComments.renderId, archvizRenders.id))
      .where(eq(archvizRenders.projectId, projectId))
      .then(r => r[0]?.count || 0),

    db
      .select({
        status: archvizRenders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(archvizRenders)
      .where(eq(archvizRenders.projectId, projectId))
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

export async function getProjectByRenderId(renderId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { archvizRenders, projects } = await import("../drizzle/schema");
  
  const result = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(archvizRenders)
    .innerJoin(projects, eq(archvizRenders.projectId, projects.id))
    .where(eq(archvizRenders.id, renderId))
    .limit(1);
  
  return result[0] || null;
}

export async function getReportData(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { projects, archvizRenders, archvizCompartments, archvizStatusHistory, archvizComments, users } = await import("../drizzle/schema");
  
  // Get project info
  const project = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  if (!project[0]) return null;
  
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
    .where(eq(archvizCompartments.projectId, projectId))
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
    project: project[0],
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

// ============================================================================
// Approval Functions
// ============================================================================

export async function approveRender(renderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { archvizRenders, archvizRenderHistory, users } = await import("../drizzle/schema");
  
  await db.update(archvizRenders)
    .set({
      approvalStatus: "approved",
      approvedById: userId,
      approvedAt: new Date(),
    })
    .where(eq(archvizRenders.id, renderId));
  
  // Log history
  await db.insert(archvizRenderHistory).values({
    renderId,
    userId,
    action: "approved",
    newValue: "approved",
  });
  
  return true;
}

export async function rejectRender(renderId: number, userId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { archvizRenders, archvizRenderHistory } = await import("../drizzle/schema");
  
  await db.update(archvizRenders)
    .set({
      approvalStatus: "rejected",
      approvedById: userId,
      approvedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(archvizRenders.id, renderId));
  
  // Log history
  await db.insert(archvizRenderHistory).values({
    renderId,
    userId,
    action: "rejected",
    newValue: "rejected",
    comment: reason,
  });
  
  return true;
}

export async function setRenderInReview(renderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { archvizRenders, archvizRenderHistory } = await import("../drizzle/schema");
  
  await db.update(archvizRenders)
    .set({
      approvalStatus: "in_review",
    })
    .where(eq(archvizRenders.id, renderId));
  
  // Log history
  await db.insert(archvizRenderHistory).values({
    renderId,
    userId,
    action: "status_changed",
    newValue: "in_review",
  });
  
  return true;
}

// ============================================================================
// Comment Functions
// ============================================================================

export async function addRenderComment(renderId: number, userId: number, comment: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { archvizRenderComments, archvizRenderHistory } = await import("../drizzle/schema");
  
  const [result] = await db.insert(archvizRenderComments).values({
    renderId,
    userId,
    comment,
  });
  
  // Log history
  await db.insert(archvizRenderHistory).values({
    renderId,
    userId,
    action: "commented",
    comment,
  });
  
  return result.insertId;
}

export async function getRenderComments(renderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { archvizRenderComments, users } = await import("../drizzle/schema");
  
  const comments = await db.select({
    id: archvizRenderComments.id,
    comment: archvizRenderComments.comment,
    createdAt: archvizRenderComments.createdAt,
    updatedAt: archvizRenderComments.updatedAt,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
    .from(archvizRenderComments)
    .leftJoin(users, eq(archvizRenderComments.userId, users.id))
    .where(eq(archvizRenderComments.renderId, renderId))
    .orderBy(desc(archvizRenderComments.createdAt));
  
  return comments;
}

// ============================================================================
// History Functions
// ============================================================================

export async function getRenderHistory(renderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { archvizRenderHistory, users } = await import("../drizzle/schema");
  
  const history = await db.select({
    id: archvizRenderHistory.id,
    action: archvizRenderHistory.action,
    oldValue: archvizRenderHistory.oldValue,
    newValue: archvizRenderHistory.newValue,
    comment: archvizRenderHistory.comment,
    createdAt: archvizRenderHistory.createdAt,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
    .from(archvizRenderHistory)
    .leftJoin(users, eq(archvizRenderHistory.userId, users.id))
    .where(eq(archvizRenderHistory.renderId, renderId))
    .orderBy(desc(archvizRenderHistory.createdAt));
  
  return history;
}
