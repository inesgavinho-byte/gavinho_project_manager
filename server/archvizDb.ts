import { getDb } from "./db";
import { 
  archvizCompartments, 
  archvizRenders, 
  archvizComments,
  type InsertArchvizCompartment,
  type InsertArchvizRender,
  type InsertArchvizComment
} from "../drizzle/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";

// ============================================================================
// COMPARTMENTS
// ============================================================================

export async function getCompartmentsByConstruction(constructionId: number) {
  const db = getDb();
  return await db
    .select()
    .from(archvizCompartments)
    .where(eq(archvizCompartments.constructionId, constructionId))
    .orderBy(archvizCompartments.order, archvizCompartments.name);
}

export async function getCompartmentById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(archvizCompartments)
    .where(eq(archvizCompartments.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function createCompartment(data: InsertArchvizCompartment) {
  const db = getDb();
  const result = await db.insert(archvizCompartments).values(data);
  return result.insertId;
}

export async function updateCompartment(id: number, data: Partial<InsertArchvizCompartment>) {
  const db = getDb();
  await db
    .update(archvizCompartments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(archvizCompartments.id, id));
}

export async function deleteCompartment(id: number) {
  const db = getDb();
  // Also delete all renders in this compartment
  await db.delete(archvizRenders).where(eq(archvizRenders.compartmentId, id));
  await db.delete(archvizCompartments).where(eq(archvizCompartments.id, id));
}

// ============================================================================
// RENDERS
// ============================================================================

export async function getRendersByCompartment(compartmentId: number) {
  const db = getDb();
  return await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.compartmentId, compartmentId))
    .orderBy(desc(archvizRenders.version));
}

export async function getRendersByConstruction(constructionId: number) {
  const db = getDb();
  return await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.constructionId, constructionId))
    .orderBy(desc(archvizRenders.createdAt));
}

export async function getRenderById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function getNextVersionNumber(compartmentId: number): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ maxVersion: sql<number>`COALESCE(MAX(${archvizRenders.version}), 0)` })
    .from(archvizRenders)
    .where(eq(archvizRenders.compartmentId, compartmentId));
  
  return (result[0]?.maxVersion || 0) + 1;
}

export async function createRender(data: InsertArchvizRender) {
  const db = getDb();
  const result = await db.insert(archvizRenders).values(data);
  return result.insertId;
}

export async function updateRender(id: number, data: Partial<InsertArchvizRender>) {
  const db = getDb();
  await db
    .update(archvizRenders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(archvizRenders.id, id));
}

export async function toggleFavorite(id: number, isFavorite: boolean) {
  const db = getDb();
  await db
    .update(archvizRenders)
    .set({ isFavorite, updatedAt: new Date() })
    .where(eq(archvizRenders.id, id));
}

export async function deleteRender(id: number) {
  const db = getDb();
  // Also delete all comments on this render
  await db.delete(archvizComments).where(eq(archvizComments.renderId, id));
  await db.delete(archvizRenders).where(eq(archvizRenders.id, id));
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function getCommentsByRender(renderId: number) {
  const db = getDb();
  return await db
    .select()
    .from(archvizComments)
    .where(eq(archvizComments.renderId, renderId))
    .orderBy(archvizComments.createdAt);
}

export async function getCommentCountByRender(renderId: number): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(archvizComments)
    .where(eq(archvizComments.renderId, renderId));
  
  return result[0]?.count || 0;
}

export async function createComment(data: InsertArchvizComment) {
  const db = getDb();
  const result = await db.insert(archvizComments).values(data);
  return result.insertId;
}

export async function updateComment(id: number, content: string) {
  const db = getDb();
  await db
    .update(archvizComments)
    .set({ content, updatedAt: new Date() })
    .where(eq(archvizComments.id, id));
}

export async function deleteComment(id: number) {
  const db = getDb();
  await db.delete(archvizComments).where(eq(archvizComments.id, id));
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getArchvizStats(constructionId: number) {
  const db = getDb();
  const [compartmentCount, renderCount, commentCount] = await Promise.all([
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
  ]);

  return {
    compartmentCount,
    renderCount,
    commentCount,
  };
}
