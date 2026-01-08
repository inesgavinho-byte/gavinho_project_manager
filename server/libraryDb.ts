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


// ============================================================================
// PROJECT-LIBRARY ASSOCIATIONS
// ============================================================================

import {
  projectMaterials,
  projectModels3D,
  projectInspirationLinks,
} from "../drizzle/schema";

/**
 * Add material to project
 */
export async function addMaterialToProject(data: {
  projectId: number;
  materialId: number;
  quantity: string;
  unitPrice?: string;
  notes?: string;
  addedById: number;
}) {
  const db = await getDb();
  
  // Calculate total price
  const quantity = parseFloat(data.quantity);
  const unitPrice = data.unitPrice ? parseFloat(data.unitPrice) : null;
  const totalPrice = unitPrice ? (quantity * unitPrice).toFixed(2) : null;
  
  await db.insert(projectMaterials).values({
    projectId: data.projectId,
    materialId: data.materialId,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    totalPrice,
    notes: data.notes,
    status: "planned",
    addedById: data.addedById,
  });
}

/**
 * List materials for a project
 */
export async function listProjectMaterials(projectId: number) {
  const db = await getDb();
  return db
    .select({
      id: projectMaterials.id,
      quantity: projectMaterials.quantity,
      unitPrice: projectMaterials.unitPrice,
      totalPrice: projectMaterials.totalPrice,
      notes: projectMaterials.notes,
      status: projectMaterials.status,
      addedAt: projectMaterials.addedAt,
      material: {
        id: libraryMaterials.id,
        name: libraryMaterials.name,
        description: libraryMaterials.description,
        category: libraryMaterials.category,
        imageUrl: libraryMaterials.imageUrl,
        supplier: libraryMaterials.supplier,
        price: libraryMaterials.price,
        unit: libraryMaterials.unit,
      },
      addedBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(projectMaterials)
    .leftJoin(libraryMaterials, eq(projectMaterials.materialId, libraryMaterials.id))
    .leftJoin(users, eq(projectMaterials.addedById, users.id))
    .where(eq(projectMaterials.projectId, projectId))
    .orderBy(desc(projectMaterials.addedAt));
}

/**
 * Update project material
 */
export async function updateProjectMaterial(id: number, data: {
  quantity?: string;
  unitPrice?: string;
  notes?: string;
  status?: "planned" | "ordered" | "delivered" | "installed";
}) {
  const db = await getDb();
  
  // Recalculate total price if quantity or unitPrice changed
  if (data.quantity || data.unitPrice) {
    const current = await db
      .select()
      .from(projectMaterials)
      .where(eq(projectMaterials.id, id))
      .limit(1);
    
    if (current.length > 0) {
      const quantity = data.quantity ? parseFloat(data.quantity) : parseFloat(current[0].quantity);
      const unitPrice = data.unitPrice ? parseFloat(data.unitPrice) : (current[0].unitPrice ? parseFloat(current[0].unitPrice) : null);
      
      if (unitPrice) {
        (data as any).totalPrice = (quantity * unitPrice).toFixed(2);
      }
    }
  }
  
  await db.update(projectMaterials).set(data).where(eq(projectMaterials.id, id));
}

/**
 * Remove material from project
 */
export async function removeProjectMaterial(id: number) {
  const db = await getDb();
  await db.delete(projectMaterials).where(eq(projectMaterials.id, id));
}

/**
 * Get total materials cost for project
 */
export async function getProjectMaterialsCost(projectId: number) {
  const db = await getDb();
  const materials = await db
    .select({ totalPrice: projectMaterials.totalPrice })
    .from(projectMaterials)
    .where(eq(projectMaterials.projectId, projectId));
  
  const total = materials.reduce((sum, m) => {
    return sum + (m.totalPrice ? parseFloat(m.totalPrice) : 0);
  }, 0);
  
  return total.toFixed(2);
}

/**
 * Add 3D model to project
 */
export async function addModelToProject(data: {
  projectId: number;
  modelId: number;
  location?: string;
  notes?: string;
  addedById: number;
}) {
  const db = await getDb();
  await db.insert(projectModels3D).values(data);
}

/**
 * List 3D models for a project
 */
export async function listProjectModels(projectId: number) {
  const db = await getDb();
  return db
    .select({
      id: projectModels3D.id,
      location: projectModels3D.location,
      notes: projectModels3D.notes,
      addedAt: projectModels3D.addedAt,
      model: {
        id: library3DModels.id,
        name: library3DModels.name,
        description: library3DModels.description,
        category: library3DModels.category,
        thumbnailUrl: library3DModels.thumbnailUrl,
        modelUrl: library3DModels.modelUrl,
        fileFormat: library3DModels.fileFormat,
      },
      addedBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(projectModels3D)
    .leftJoin(library3DModels, eq(projectModels3D.modelId, library3DModels.id))
    .leftJoin(users, eq(projectModels3D.addedById, users.id))
    .where(eq(projectModels3D.projectId, projectId))
    .orderBy(desc(projectModels3D.addedAt));
}

/**
 * Remove 3D model from project
 */
export async function removeProjectModel(id: number) {
  const db = await getDb();
  await db.delete(projectModels3D).where(eq(projectModels3D.id, id));
}

/**
 * Add inspiration to project
 */
export async function addInspirationToProject(data: {
  projectId: number;
  inspirationId: number;
  notes?: string;
  addedById: number;
}) {
  const db = await getDb();
  await db.insert(projectInspirationLinks).values(data);
}

/**
 * List inspirations for a project
 */
export async function listProjectInspiration(projectId: number) {
  const db = await getDb();
  return db
    .select({
      id: projectInspirationLinks.id,
      notes: projectInspirationLinks.notes,
      addedAt: projectInspirationLinks.addedAt,
      inspiration: {
        id: libraryInspiration.id,
        title: libraryInspiration.title,
        description: libraryInspiration.description,
        imageUrl: libraryInspiration.imageUrl,
        sourceUrl: libraryInspiration.sourceUrl,
      },
      addedBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(projectInspirationLinks)
    .leftJoin(libraryInspiration, eq(projectInspirationLinks.inspirationId, libraryInspiration.id))
    .leftJoin(users, eq(projectInspirationLinks.addedById, users.id))
    .where(eq(projectInspirationLinks.projectId, projectId))
    .orderBy(desc(projectInspirationLinks.addedAt));
}

/**
 * Remove inspiration from project
 */
export async function removeProjectInspiration(id: number) {
  const db = await getDb();
  await db.delete(projectInspirationLinks).where(eq(projectInspirationLinks.id, id));
}


// ============================================================================
// MATERIAL PRICE HISTORY
// ============================================================================

import { materialPriceHistory } from "../drizzle/schema";
import { asc } from "drizzle-orm";

export async function addPriceRecord(data: {
  materialId: number;
  price: string;
  unit: string;
  supplierName?: string;
  notes?: string;
  recordedById: number;
}) {
  const db = await getDb();
  return db.insert(materialPriceHistory).values(data);
}

export async function getPriceHistory(materialId: number, limit = 50) {
  const db = await getDb();
  return db
    .select()
    .from(materialPriceHistory)
    .where(eq(materialPriceHistory.materialId, materialId))
    .orderBy(desc(materialPriceHistory.recordedAt))
    .limit(limit);
}

export async function getLatestPrice(materialId: number) {
  const db = await getDb();
  const result = await db
    .select()
    .from(materialPriceHistory)
    .where(eq(materialPriceHistory.materialId, materialId))
    .orderBy(desc(materialPriceHistory.recordedAt))
    .limit(1);
  return result[0] || null;
}

export async function calculatePriceTrend(materialId: number, days = 90) {
  const db = await getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const history = await db
    .select()
    .from(materialPriceHistory)
    .where(eq(materialPriceHistory.materialId, materialId))
    .orderBy(asc(materialPriceHistory.recordedAt));
  
  if (history.length < 2) {
    return {
      trend: "stable" as const,
      changePercent: 0,
      oldestPrice: history[0]?.price || "0",
      latestPrice: history[0]?.price || "0",
      dataPoints: history.length,
    };
  }
  
  const oldest = parseFloat(history[0].price);
  const latest = parseFloat(history[history.length - 1].price);
  const changePercent = ((latest - oldest) / oldest) * 100;
  
  let trend: "rising" | "falling" | "stable" = "stable";
  if (changePercent > 5) trend = "rising";
  else if (changePercent < -5) trend = "falling";
  
  return {
    trend,
    changePercent: Math.round(changePercent * 10) / 10,
    oldestPrice: history[0].price,
    latestPrice: history[history.length - 1].price,
    dataPoints: history.length,
  };
}

export async function getMaterialsWithPriceAlerts(thresholdPercent = 10) {
  const db = await getDb();
  const materials = await db.select().from(libraryMaterials);
  
  const alerts = [];
  for (const material of materials) {
    const trend = await calculatePriceTrend(material.id, 90);
    if (trend.trend === "rising" && trend.changePercent >= thresholdPercent) {
      alerts.push({
        material,
        trend,
      });
    }
  }
  
  return alerts;
}
