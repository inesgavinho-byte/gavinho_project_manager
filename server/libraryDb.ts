import { eq, like, and, or, desc, sql, inArray } from "drizzle-orm";
import { getDb } from "./db.js";
import {
  libraryTags,
  libraryMaterials,
  library3DModels,
  libraryInspiration,
  users,
} from "../drizzle/schema.js";

// ============================================================================
// LIBRARY TAGS
// ============================================================================

export async function getAllTags() {
  const db = await getDb();
  return db.select().from(libraryTags).orderBy(libraryTags.name);
}

export async function getTagsByCategory(category: "material" | "model" | "inspiration" | "general") {
  const db = await getDb();
  return db
    .select()
    .from(libraryTags)
    .where(eq(libraryTags.category, category))
    .orderBy(libraryTags.name);
}

export async function createTag(data: {
  name: string;
  category?: "material" | "model" | "inspiration" | "general";
  color?: string;
}) {
  const db = await getDb();
  const [tag] = await db.insert(libraryTags).values(data);
  return tag;
}

export async function deleteTag(id: number) {
  const db = await getDb();
  await db.delete(libraryTags).where(eq(libraryTags.id, id));
}

// ============================================================================
// LIBRARY MATERIALS
// ============================================================================

export async function getAllMaterials() {
  const db = await getDb();
  return db
    .select({
      id: libraryMaterials.id,
      name: libraryMaterials.name,
      description: libraryMaterials.description,
      category: libraryMaterials.category,
      tags: libraryMaterials.tags,
      imageUrl: libraryMaterials.imageUrl,
      fileUrl: libraryMaterials.fileUrl,
      supplier: libraryMaterials.supplier,
      price: libraryMaterials.price,
      unit: libraryMaterials.unit,
      createdById: libraryMaterials.createdById,
      createdAt: libraryMaterials.createdAt,
      updatedAt: libraryMaterials.updatedAt,
      createdByName: users.name,
    })
    .from(libraryMaterials)
    .leftJoin(users, eq(libraryMaterials.createdById, users.id))
    .orderBy(desc(libraryMaterials.createdAt));
}

export async function getMaterialById(id: number) {
  const db = await getDb();
  const [material] = await db
    .select({
      id: libraryMaterials.id,
      name: libraryMaterials.name,
      description: libraryMaterials.description,
      category: libraryMaterials.category,
      tags: libraryMaterials.tags,
      imageUrl: libraryMaterials.imageUrl,
      fileUrl: libraryMaterials.fileUrl,
      supplier: libraryMaterials.supplier,
      price: libraryMaterials.price,
      unit: libraryMaterials.unit,
      createdById: libraryMaterials.createdById,
      createdAt: libraryMaterials.createdAt,
      updatedAt: libraryMaterials.updatedAt,
      createdByName: users.name,
    })
    .from(libraryMaterials)
    .leftJoin(users, eq(libraryMaterials.createdById, users.id))
    .where(eq(libraryMaterials.id, id));
  return material;
}

export async function searchMaterials(params: {
  query?: string;
  category?: string;
  tags?: number[];
}) {
  const db = await getDb();
  
  const conditions = [];
  
  if (params.query) {
    conditions.push(
      or(
        like(libraryMaterials.name, `%${params.query}%`),
        like(libraryMaterials.description, `%${params.query}%`),
        like(libraryMaterials.supplier, `%${params.query}%`)
      )
    );
  }
  
  if (params.category) {
    conditions.push(eq(libraryMaterials.category, params.category));
  }
  
  // Note: tags filtering would require JSON parsing in SQL or application-level filtering
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return db
    .select({
      id: libraryMaterials.id,
      name: libraryMaterials.name,
      description: libraryMaterials.description,
      category: libraryMaterials.category,
      tags: libraryMaterials.tags,
      imageUrl: libraryMaterials.imageUrl,
      fileUrl: libraryMaterials.fileUrl,
      supplier: libraryMaterials.supplier,
      price: libraryMaterials.price,
      unit: libraryMaterials.unit,
      createdById: libraryMaterials.createdById,
      createdAt: libraryMaterials.createdAt,
      updatedAt: libraryMaterials.updatedAt,
      createdByName: users.name,
    })
    .from(libraryMaterials)
    .leftJoin(users, eq(libraryMaterials.createdById, users.id))
    .where(whereClause)
    .orderBy(desc(libraryMaterials.createdAt));
}

export async function createMaterial(data: {
  name: string;
  description?: string;
  category: string;
  tags?: string;
  imageUrl?: string;
  fileUrl?: string;
  supplier?: string;
  price?: string;
  unit?: string;
  createdById: number;
}) {
  const db = await getDb();
  const [material] = await db.insert(libraryMaterials).values(data);
  return material;
}

export async function updateMaterial(id: number, data: Partial<{
  name: string;
  description: string;
  category: string;
  tags: string;
  imageUrl: string;
  fileUrl: string;
  supplier: string;
  price: string;
  unit: string;
}>) {
  const db = await getDb();
  await db.update(libraryMaterials).set(data).where(eq(libraryMaterials.id, id));
}

export async function deleteMaterial(id: number) {
  const db = await getDb();
  await db.delete(libraryMaterials).where(eq(libraryMaterials.id, id));
}

// ============================================================================
// LIBRARY 3D MODELS
// ============================================================================

export async function getAll3DModels() {
  const db = await getDb();
  return db
    .select({
      id: library3DModels.id,
      name: library3DModels.name,
      description: library3DModels.description,
      category: library3DModels.category,
      tags: library3DModels.tags,
      thumbnailUrl: library3DModels.thumbnailUrl,
      modelUrl: library3DModels.modelUrl,
      fileFormat: library3DModels.fileFormat,
      fileSize: library3DModels.fileSize,
      createdById: library3DModels.createdById,
      createdAt: library3DModels.createdAt,
      updatedAt: library3DModels.updatedAt,
      createdByName: users.name,
    })
    .from(library3DModels)
    .leftJoin(users, eq(library3DModels.createdById, users.id))
    .orderBy(desc(library3DModels.createdAt));
}

export async function get3DModelById(id: number) {
  const db = await getDb();
  const [model] = await db
    .select({
      id: library3DModels.id,
      name: library3DModels.name,
      description: library3DModels.description,
      category: library3DModels.category,
      tags: library3DModels.tags,
      thumbnailUrl: library3DModels.thumbnailUrl,
      modelUrl: library3DModels.modelUrl,
      fileFormat: library3DModels.fileFormat,
      fileSize: library3DModels.fileSize,
      createdById: library3DModels.createdById,
      createdAt: library3DModels.createdAt,
      updatedAt: library3DModels.updatedAt,
      createdByName: users.name,
    })
    .from(library3DModels)
    .leftJoin(users, eq(library3DModels.createdById, users.id))
    .where(eq(library3DModels.id, id));
  return model;
}

export async function search3DModels(params: {
  query?: string;
  category?: string;
  fileFormat?: string;
}) {
  const db = await getDb();
  
  const conditions = [];
  
  if (params.query) {
    conditions.push(
      or(
        like(library3DModels.name, `%${params.query}%`),
        like(library3DModels.description, `%${params.query}%`)
      )
    );
  }
  
  if (params.category) {
    conditions.push(eq(library3DModels.category, params.category));
  }
  
  if (params.fileFormat) {
    conditions.push(eq(library3DModels.fileFormat, params.fileFormat));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return db
    .select({
      id: library3DModels.id,
      name: library3DModels.name,
      description: library3DModels.description,
      category: library3DModels.category,
      tags: library3DModels.tags,
      thumbnailUrl: library3DModels.thumbnailUrl,
      modelUrl: library3DModels.modelUrl,
      fileFormat: library3DModels.fileFormat,
      fileSize: library3DModels.fileSize,
      createdById: library3DModels.createdById,
      createdAt: library3DModels.createdAt,
      updatedAt: library3DModels.updatedAt,
      createdByName: users.name,
    })
    .from(library3DModels)
    .leftJoin(users, eq(library3DModels.createdById, users.id))
    .where(whereClause)
    .orderBy(desc(library3DModels.createdAt));
}

export async function create3DModel(data: {
  name: string;
  description?: string;
  category: string;
  tags?: string;
  thumbnailUrl?: string;
  modelUrl: string;
  fileFormat?: string;
  fileSize?: number;
  createdById: number;
}) {
  const db = await getDb();
  const [model] = await db.insert(library3DModels).values(data);
  return model;
}

export async function update3DModel(id: number, data: Partial<{
  name: string;
  description: string;
  category: string;
  tags: string;
  thumbnailUrl: string;
  modelUrl: string;
  fileFormat: string;
  fileSize: number;
}>) {
  const db = await getDb();
  await db.update(library3DModels).set(data).where(eq(library3DModels.id, id));
}

export async function delete3DModel(id: number) {
  const db = await getDb();
  await db.delete(library3DModels).where(eq(library3DModels.id, id));
}

// ============================================================================
// LIBRARY INSPIRATION
// ============================================================================

export async function getAllInspiration() {
  const db = await getDb();
  return db
    .select({
      id: libraryInspiration.id,
      title: libraryInspiration.title,
      description: libraryInspiration.description,
      tags: libraryInspiration.tags,
      imageUrl: libraryInspiration.imageUrl,
      sourceUrl: libraryInspiration.sourceUrl,
      projectId: libraryInspiration.projectId,
      createdById: libraryInspiration.createdById,
      createdAt: libraryInspiration.createdAt,
      updatedAt: libraryInspiration.updatedAt,
      createdByName: users.name,
    })
    .from(libraryInspiration)
    .leftJoin(users, eq(libraryInspiration.createdById, users.id))
    .orderBy(desc(libraryInspiration.createdAt));
}

export async function getInspirationById(id: number) {
  const db = await getDb();
  const [inspiration] = await db
    .select({
      id: libraryInspiration.id,
      title: libraryInspiration.title,
      description: libraryInspiration.description,
      tags: libraryInspiration.tags,
      imageUrl: libraryInspiration.imageUrl,
      sourceUrl: libraryInspiration.sourceUrl,
      projectId: libraryInspiration.projectId,
      createdById: libraryInspiration.createdById,
      createdAt: libraryInspiration.createdAt,
      updatedAt: libraryInspiration.updatedAt,
      createdByName: users.name,
    })
    .from(libraryInspiration)
    .leftJoin(users, eq(libraryInspiration.createdById, users.id))
    .where(eq(libraryInspiration.id, id));
  return inspiration;
}

export async function searchInspiration(params: {
  query?: string;
  tags?: number[];
  projectId?: number;
}) {
  const db = await getDb();
  
  const conditions = [];
  
  if (params.query) {
    conditions.push(
      or(
        like(libraryInspiration.title, `%${params.query}%`),
        like(libraryInspiration.description, `%${params.query}%`)
      )
    );
  }
  
  if (params.projectId) {
    conditions.push(eq(libraryInspiration.projectId, params.projectId));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return db
    .select({
      id: libraryInspiration.id,
      title: libraryInspiration.title,
      description: libraryInspiration.description,
      tags: libraryInspiration.tags,
      imageUrl: libraryInspiration.imageUrl,
      sourceUrl: libraryInspiration.sourceUrl,
      projectId: libraryInspiration.projectId,
      createdById: libraryInspiration.createdById,
      createdAt: libraryInspiration.createdAt,
      updatedAt: libraryInspiration.updatedAt,
      createdByName: users.name,
    })
    .from(libraryInspiration)
    .leftJoin(users, eq(libraryInspiration.createdById, users.id))
    .where(whereClause)
    .orderBy(desc(libraryInspiration.createdAt));
}

export async function createInspiration(data: {
  title: string;
  description?: string;
  tags?: string;
  imageUrl: string;
  sourceUrl?: string;
  projectId?: number;
  createdById: number;
}) {
  const db = await getDb();
  const [inspiration] = await db.insert(libraryInspiration).values(data);
  return inspiration;
}

export async function updateInspiration(id: number, data: Partial<{
  title: string;
  description: string;
  tags: string;
  imageUrl: string;
  sourceUrl: string;
  projectId: number;
}>) {
  const db = await getDb();
  await db.update(libraryInspiration).set(data).where(eq(libraryInspiration.id, id));
}

export async function deleteInspiration(id: number) {
  const db = await getDb();
  await db.delete(libraryInspiration).where(eq(libraryInspiration.id, id));
}
