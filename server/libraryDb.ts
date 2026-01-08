import { eq, like, and, or, desc, sql, inArray, ne, isNotNull } from "drizzle-orm";
import { getDb } from "./db.js";
import {
  libraryTags,
  libraryMaterials,
  library3DModels,
  libraryInspiration,
  users,
  materialSuggestions,
  projects,
  projectMaterials,
  materialCollections,
  collectionMaterials,
  favoriteMaterials,
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

// ============================================================================
// MATERIAL SUGGESTIONS (AI-powered)
// ============================================================================

export async function createMaterialSuggestion(data: {
  projectId: number;
  suggestedMaterialId: number;
  reason: string;
  confidence: number;
  matchFactors?: string;
}) {
  const db = await getDb();
  const [suggestion] = await db.insert(materialSuggestions).values(data);
  return suggestion;
}

export async function getProjectSuggestions(projectId: number, status?: "pending" | "accepted" | "rejected") {
  const db = await getDb();
  let query = db
    .select({
      id: materialSuggestions.id,
      projectId: materialSuggestions.projectId,
      suggestedMaterialId: materialSuggestions.suggestedMaterialId,
      reason: materialSuggestions.reason,
      confidence: materialSuggestions.confidence,
      status: materialSuggestions.status,
      matchFactors: materialSuggestions.matchFactors,
      createdAt: materialSuggestions.createdAt,
      respondedAt: materialSuggestions.respondedAt,
      respondedById: materialSuggestions.respondedById,
      // Material details
      materialName: libraryMaterials.name,
      materialDescription: libraryMaterials.description,
      materialCategory: libraryMaterials.category,
      materialImageUrl: libraryMaterials.imageUrl,
      materialPrice: libraryMaterials.price,
      materialUnit: libraryMaterials.unit,
      materialSupplier: libraryMaterials.supplier,
    })
    .from(materialSuggestions)
    .leftJoin(libraryMaterials, eq(materialSuggestions.suggestedMaterialId, libraryMaterials.id))
    .where(eq(materialSuggestions.projectId, projectId));

  if (status) {
    query = query.where(eq(materialSuggestions.status, status));
  }

  return query.orderBy(desc(materialSuggestions.confidence), desc(materialSuggestions.createdAt));
}

export async function respondToSuggestion(
  suggestionId: number,
  status: "accepted" | "rejected",
  userId: number
) {
  const db = await getDb();
  await db
    .update(materialSuggestions)
    .set({
      status,
      respondedAt: new Date(),
      respondedById: userId,
    })
    .where(eq(materialSuggestions.id, suggestionId));
}

export async function getSuggestionStats(projectId: number) {
  const db = await getDb();
  const suggestions = await db
    .select()
    .from(materialSuggestions)
    .where(eq(materialSuggestions.projectId, projectId));

  return {
    total: suggestions.length,
    pending: suggestions.filter((s) => s.status === "pending").length,
    accepted: suggestions.filter((s) => s.status === "accepted").length,
    rejected: suggestions.filter((s) => s.status === "rejected").length,
    avgConfidence:
      suggestions.length > 0
        ? suggestions.reduce((sum, s) => sum + Number(s.confidence), 0) / suggestions.length
        : 0,
  };
}

/**
 * Generate AI suggestions for a project based on:
 * - Similar projects (same category, budget range)
 * - Material usage history
 * - Budget constraints
 */
export async function generateSuggestionsForProject(projectId: number) {
  const db = await getDb();

  // Get project details
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new Error("Project not found");
  }

  // Get materials already associated with this project
  const existingMaterials = await db
    .select({ materialId: projectMaterials.materialId })
    .from(projectMaterials)
    .where(eq(projectMaterials.projectId, projectId));

  const existingMaterialIds = existingMaterials.map((m) => m.materialId);

  // Find similar projects (same priority, similar budget)
  const similarProjects = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.priority, project.priority),
        ne(projects.id, projectId),
        isNotNull(projects.budget)
      )
    )
    .limit(10);

  // Get materials used in similar projects
  const materialUsageMap = new Map<number, number>(); // materialId -> usage count

  for (const simProject of similarProjects) {
    const materials = await db
      .select({ materialId: projectMaterials.materialId })
      .from(projectMaterials)
      .where(eq(projectMaterials.projectId, simProject.id));

    materials.forEach((m) => {
      materialUsageMap.set(m.materialId, (materialUsageMap.get(m.materialId) || 0) + 1);
    });
  }

  // Sort materials by usage frequency
  const sortedMaterials = Array.from(materialUsageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 most used

  // Filter out materials already in the project
  const candidateMaterials = sortedMaterials.filter(
    ([materialId]) => !existingMaterialIds.includes(materialId)
  );

  // Create suggestions
  const suggestions = [];
  for (const [materialId, usageCount] of candidateMaterials) {
    const [material] = await db
      .select()
      .from(libraryMaterials)
      .where(eq(libraryMaterials.id, materialId))
      .limit(1);

    if (!material) continue;

    // Calculate confidence based on usage frequency and budget match
    let confidence = Math.min((usageCount / similarProjects.length) * 100, 95);

    // Adjust confidence based on budget
    const projectBudget = Number(project.budget || 0);
    const materialPrice = Number(material.price || 0);
    
    const matchFactors = {
      history: usageCount > 2,
      budget: projectBudget > 0 && materialPrice > 0 && materialPrice < projectBudget * 0.1,
      priority: true,
    };

    if (matchFactors.budget) {
      confidence = Math.min(confidence + 10, 98);
    }

    const reason = `Este material foi utilizado em ${usageCount} de ${similarProjects.length} projetos similares com prioridade ${project.priority}. ${
      matchFactors.budget
        ? "O preço está dentro do orçamento do projeto."
        : "Considere verificar o orçamento disponível."
    }`;

    suggestions.push({
      projectId,
      suggestedMaterialId: materialId,
      reason,
      confidence: Math.round(confidence),
      matchFactors: JSON.stringify(matchFactors),
    });
  }

  // Insert suggestions into database
  if (suggestions.length > 0) {
    await db.insert(materialSuggestions).values(suggestions);
  }

  return suggestions.length;
}

// ============================================================================
// SUPPLIER COMPARISON
// ============================================================================

import { materialPriceHistory } from "../drizzle/schema.js";

export async function getSupplierComparison(materialId: number) {
  const db = await getDb();
  
  // Obter histórico de preços agrupado por fornecedor
  const priceHistory = await db
    .select({
      supplierName: materialPriceHistory.supplierName,
      prices: sql<string>`GROUP_CONCAT(CONCAT(${materialPriceHistory.price}, ':', ${materialPriceHistory.recordedAt}) ORDER BY ${materialPriceHistory.recordedAt} SEPARATOR ',')`,
      avgPrice: sql<number>`AVG(${materialPriceHistory.price})`,
      minPrice: sql<number>`MIN(${materialPriceHistory.price})`,
      maxPrice: sql<number>`MAX(${materialPriceHistory.price})`,
      lastPrice: sql<number>`(SELECT price FROM ${materialPriceHistory} mph2 WHERE mph2.materialId = ${materialPriceHistory.materialId} AND mph2.supplierName = ${materialPriceHistory.supplierName} ORDER BY recordedAt DESC LIMIT 1)`,
      lastUpdate: sql<Date>`MAX(${materialPriceHistory.recordedAt})`,
      recordCount: sql<number>`COUNT(*)`,
    })
    .from(materialPriceHistory)
    .where(eq(materialPriceHistory.materialId, materialId))
    .groupBy(materialPriceHistory.supplierName);

  // Calcular variação percentual e tendência para cada fornecedor
  const suppliers = priceHistory.map((supplier) => {
    const pricesData = supplier.prices.split(',').map((p) => {
      const [price, date] = p.split(':');
      return { price: parseFloat(price), date: new Date(date) };
    });

    // Calcular tendência (últimos 30 dias vs anteriores)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentPrices = pricesData.filter(p => p.date >= thirtyDaysAgo);
    const olderPrices = pricesData.filter(p => p.date < thirtyDaysAgo);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercent = 0;
    
    if (recentPrices.length > 0 && olderPrices.length > 0) {
      const recentAvg = recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((sum, p) => sum + p.price, 0) / olderPrices.length;
      trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (trendPercent > 5) trend = 'up';
      else if (trendPercent < -5) trend = 'down';
    }

    // Variação entre min e max
    const priceVariation = supplier.maxPrice && supplier.minPrice
      ? ((supplier.maxPrice - supplier.minPrice) / supplier.minPrice) * 100
      : 0;

    return {
      supplierName: supplier.supplierName,
      avgPrice: supplier.avgPrice,
      minPrice: supplier.minPrice,
      maxPrice: supplier.maxPrice,
      lastPrice: supplier.lastPrice,
      lastUpdate: supplier.lastUpdate,
      recordCount: supplier.recordCount,
      trend,
      trendPercent: Math.abs(trendPercent),
      priceVariation,
      priceHistory: pricesData,
    };
  });

  // Ordenar por preço médio (do menor para o maior)
  suppliers.sort((a, b) => a.avgPrice - b.avgPrice);

  // Identificar melhor oferta atual
  const bestCurrentOffer = suppliers.length > 0 
    ? suppliers.reduce((best, current) => 
        current.lastPrice < best.lastPrice ? current : best
      )
    : null;

  return {
    suppliers,
    bestCurrentOffer: bestCurrentOffer?.supplierName || null,
    totalSuppliers: suppliers.length,
  };
}

export async function getSupplierPriceAlerts(thresholdPercent: number = 10) {
  const db = await getDb();
  
  // Obter todos os materiais com histórico de preços
  const materials = await db
    .select({
      materialId: materialPriceHistory.materialId,
      materialName: libraryMaterials.name,
    })
    .from(materialPriceHistory)
    .innerJoin(libraryMaterials, eq(materialPriceHistory.materialId, libraryMaterials.id))
    .groupBy(materialPriceHistory.materialId, libraryMaterials.name);

  const alerts = [];

  for (const material of materials) {
    const comparison = await getSupplierComparison(material.materialId);
    
    if (comparison.suppliers.length === 0) continue;
    
    // Verificar se há fornecedores com diferença significativa
    const avgPrice = comparison.suppliers.reduce((sum, s) => sum + s.avgPrice, 0) / comparison.suppliers.length;
    
    for (const supplier of comparison.suppliers) {
      const deviation = Math.abs(((supplier.lastPrice - avgPrice) / avgPrice) * 100);
      
      if (deviation > thresholdPercent) {
        alerts.push({
          materialId: material.materialId,
          materialName: material.materialName,
          supplierName: supplier.supplierName,
          currentPrice: supplier.lastPrice,
          avgMarketPrice: avgPrice,
          deviation,
          type: supplier.lastPrice > avgPrice ? 'expensive' : 'cheap',
        });
      }
    }
  }

  return alerts;
}

// ============================================================================
// BULK IMPORT
// ============================================================================

export interface MaterialImportRow {
  name: string;
  description?: string;
  category: string;
  supplier?: string;
  price?: string;
  unit?: string;
  tags?: string;
  imageUrl?: string;
  fileUrl?: string;
  // For price history import
  priceHistory?: Array<{
    price: number;
    supplierName: string;
    recordedAt: Date;
  }>;
}

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
}

export function validateMaterialImportRow(
  row: MaterialImportRow,
  rowIndex: number
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  // Required fields
  if (!row.name || row.name.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "name",
      message: "Nome é obrigatório",
    });
  }

  if (!row.category || row.category.trim() === "") {
    errors.push({
      row: rowIndex,
      field: "category",
      message: "Categoria é obrigatória",
    });
  }

  // Validate price format if provided
  if (row.price && row.price.trim() !== "") {
    const priceNum = parseFloat(row.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push({
        row: rowIndex,
        field: "price",
        message: "Preço deve ser um número válido",
      });
    }
  }

  // Validate URLs if provided
  if (row.imageUrl && !isValidUrl(row.imageUrl)) {
    errors.push({
      row: rowIndex,
      field: "imageUrl",
      message: "URL de imagem inválida",
    });
  }

  if (row.fileUrl && !isValidUrl(row.fileUrl)) {
    errors.push({
      row: rowIndex,
      field: "fileUrl",
      message: "URL de ficheiro inválida",
    });
  }

  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function bulkImportMaterials(
  materials: MaterialImportRow[],
  createdById: number
): Promise<{
  success: number;
  failed: number;
  errors: ImportValidationError[];
}> {
  const db = await getDb();
  let successCount = 0;
  let failedCount = 0;
  const allErrors: ImportValidationError[] = [];

  for (let i = 0; i < materials.length; i++) {
    const material = materials[i];
    const rowIndex = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

    // Validate row
    const errors = validateMaterialImportRow(material, rowIndex);
    if (errors.length > 0) {
      allErrors.push(...errors);
      failedCount++;
      continue;
    }

    try {
      // Insert material
      const [inserted] = await db.insert(libraryMaterials).values({
        name: material.name,
        description: material.description || null,
        category: material.category,
        supplier: material.supplier || null,
        price: material.price || null,
        unit: material.unit || null,
        tags: material.tags || null,
        imageUrl: material.imageUrl || null,
        fileUrl: material.fileUrl || null,
        createdById,
      });

      // If price history is provided, insert it
      if (material.priceHistory && material.priceHistory.length > 0) {
        const materialId = inserted.insertId;
        const priceHistoryRecords = material.priceHistory.map((ph) => ({
          materialId,
          price: ph.price.toString(),
          unit: material.unit || "un",
          supplierName: ph.supplierName,
          recordedAt: ph.recordedAt,
          recordedById: createdById,
        }));

        await db.insert(materialPriceHistory).values(priceHistoryRecords);
      }

      successCount++;
    } catch (error) {
      allErrors.push({
        row: rowIndex,
        field: "general",
        message: error instanceof Error ? error.message : "Erro ao inserir material",
      });
      failedCount++;
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    errors: allErrors,
  };
}

export function generateImportTemplate(): MaterialImportRow[] {
  return [
    {
      name: "Mármore Carrara",
      description: "Mármore branco de alta qualidade",
      category: "Pedra Natural",
      supplier: "Mármores Portugal",
      price: "120.50",
      unit: "m²",
      tags: "mármore,pedra,branco",
      imageUrl: "https://exemplo.com/imagem.jpg",
      fileUrl: "https://exemplo.com/ficha-tecnica.pdf",
    },
    {
      name: "Tinta Acrílica Branca",
      description: "Tinta lavável para interiores",
      category: "Tintas",
      supplier: "CIN",
      price: "45.00",
      unit: "L",
      tags: "tinta,branco,interior",
    },
  ];
}

// ============================================================================
// FAVORITES
// ============================================================================

export async function toggleFavorite(userId: number, materialId: number): Promise<{ isFavorite: boolean }> {
  const db = await getDb();
  
  // Check if already favorited
  const existing = await db
    .select()
    .from(favoriteMaterials)
    .where(and(eq(favoriteMaterials.userId, userId), eq(favoriteMaterials.materialId, materialId)))
    .limit(1);

  if (existing.length > 0) {
    // Remove from favorites
    await db
      .delete(favoriteMaterials)
      .where(and(eq(favoriteMaterials.userId, userId), eq(favoriteMaterials.materialId, materialId)));
    return { isFavorite: false };
  } else {
    // Add to favorites
    await db.insert(favoriteMaterials).values({
      userId,
      materialId,
    });
    return { isFavorite: true };
  }
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  
  const favorites = await db
    .select({
      id: favoriteMaterials.id,
      materialId: favoriteMaterials.materialId,
      createdAt: favoriteMaterials.createdAt,
      material: libraryMaterials,
    })
    .from(favoriteMaterials)
    .innerJoin(libraryMaterials, eq(favoriteMaterials.materialId, libraryMaterials.id))
    .where(eq(favoriteMaterials.userId, userId))
    .orderBy(desc(favoriteMaterials.createdAt));

  return favorites;
}

export async function isMaterialFavorited(userId: number, materialId: number): Promise<boolean> {
  const db = await getDb();
  
  const result = await db
    .select({ id: favoriteMaterials.id })
    .from(favoriteMaterials)
    .where(and(eq(favoriteMaterials.userId, userId), eq(favoriteMaterials.materialId, materialId)))
    .limit(1);

  return result.length > 0;
}

export async function getFavoriteStatusForMaterials(userId: number, materialIds: number[]): Promise<Record<number, boolean>> {
  if (materialIds.length === 0) return {};
  
  const db = await getDb();
  
  const favorites = await db
    .select({ materialId: favoriteMaterials.materialId })
    .from(favoriteMaterials)
    .where(and(
      eq(favoriteMaterials.userId, userId),
      inArray(favoriteMaterials.materialId, materialIds)
    ));

  const favoriteMap: Record<number, boolean> = {};
  materialIds.forEach(id => favoriteMap[id] = false);
  favorites.forEach(fav => favoriteMap[fav.materialId] = true);
  
  return favoriteMap;
}

// ============================================================================
// COLLECTIONS
// ============================================================================

export async function createCollection(
  userId: number,
  data: { name: string; description?: string; color?: string; icon?: string }
) {
  const db = await getDb();
  
  const [result] = await db.insert(materialCollections).values({
    userId,
    name: data.name,
    description: data.description || null,
    color: data.color || null,
    icon: data.icon || null,
  });

  return { id: result.insertId };
}

export async function getUserCollections(userId: number) {
  const db = await getDb();
  
  const collections = await db
    .select({
      id: materialCollections.id,
      name: materialCollections.name,
      description: materialCollections.description,
      color: materialCollections.color,
      icon: materialCollections.icon,
      createdAt: materialCollections.createdAt,
      updatedAt: materialCollections.updatedAt,
    })
    .from(materialCollections)
    .where(eq(materialCollections.userId, userId))
    .orderBy(desc(materialCollections.createdAt));

  // Get material count for each collection
  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(collectionMaterials)
        .where(eq(collectionMaterials.collectionId, collection.id));
      
      return {
        ...collection,
        materialCount: countResult[0]?.count || 0,
      };
    })
  );

  return collectionsWithCounts;
}

export async function getCollection(collectionId: number, userId: number) {
  const db = await getDb();
  
  const [collection] = await db
    .select()
    .from(materialCollections)
    .where(and(
      eq(materialCollections.id, collectionId),
      eq(materialCollections.userId, userId)
    ))
    .limit(1);

  if (!collection) return null;

  // Get materials in this collection
  const materials = await db
    .select({
      id: collectionMaterials.id,
      notes: collectionMaterials.notes,
      addedAt: collectionMaterials.addedAt,
      material: libraryMaterials,
    })
    .from(collectionMaterials)
    .innerJoin(libraryMaterials, eq(collectionMaterials.materialId, libraryMaterials.id))
    .where(eq(collectionMaterials.collectionId, collectionId))
    .orderBy(desc(collectionMaterials.addedAt));

  return {
    ...collection,
    materials,
  };
}

export async function updateCollection(
  collectionId: number,
  userId: number,
  data: { name?: string; description?: string; color?: string; icon?: string }
) {
  const db = await getDb();
  
  await db
    .update(materialCollections)
    .set(data)
    .where(and(
      eq(materialCollections.id, collectionId),
      eq(materialCollections.userId, userId)
    ));

  return { success: true };
}

export async function deleteCollection(collectionId: number, userId: number) {
  const db = await getDb();
  
  await db
    .delete(materialCollections)
    .where(and(
      eq(materialCollections.id, collectionId),
      eq(materialCollections.userId, userId)
    ));

  return { success: true };
}

export async function addMaterialToCollection(
  collectionId: number,
  materialId: number,
  userId: number,
  notes?: string
) {
  const db = await getDb();
  
  // Verify collection belongs to user
  const [collection] = await db
    .select()
    .from(materialCollections)
    .where(and(
      eq(materialCollections.id, collectionId),
      eq(materialCollections.userId, userId)
    ))
    .limit(1);

  if (!collection) {
    throw new Error("Collection not found or access denied");
  }

  // Check if material already in collection
  const existing = await db
    .select()
    .from(collectionMaterials)
    .where(and(
      eq(collectionMaterials.collectionId, collectionId),
      eq(collectionMaterials.materialId, materialId)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Material already in collection");
  }

  const [result] = await db.insert(collectionMaterials).values({
    collectionId,
    materialId,
    notes: notes || null,
  });

  return { id: result.insertId };
}

export async function removeMaterialFromCollection(
  collectionId: number,
  materialId: number,
  userId: number
) {
  const db = await getDb();
  
  // Verify collection belongs to user
  const [collection] = await db
    .select()
    .from(materialCollections)
    .where(and(
      eq(materialCollections.id, collectionId),
      eq(materialCollections.userId, userId)
    ))
    .limit(1);

  if (!collection) {
    throw new Error("Collection not found or access denied");
  }

  await db
    .delete(collectionMaterials)
    .where(and(
      eq(collectionMaterials.collectionId, collectionId),
      eq(collectionMaterials.materialId, materialId)
    ));

  return { success: true };
}

export async function getCollectionsForMaterial(materialId: number, userId: number) {
  const db = await getDb();
  
  const collections = await db
    .select({
      id: materialCollections.id,
      name: materialCollections.name,
      color: materialCollections.color,
      icon: materialCollections.icon,
    })
    .from(collectionMaterials)
    .innerJoin(materialCollections, eq(collectionMaterials.collectionId, materialCollections.id))
    .where(and(
      eq(collectionMaterials.materialId, materialId),
      eq(materialCollections.userId, userId)
    ));

  return collections;
}

export async function getCollectionStats(userId: number) {
  const db = await getDb();
  
  const totalCollections = await db
    .select({ count: sql<number>`count(*)` })
    .from(materialCollections)
    .where(eq(materialCollections.userId, userId));

  const totalMaterialsInCollections = await db
    .select({ count: sql<number>`count(*)` })
    .from(collectionMaterials)
    .innerJoin(materialCollections, eq(collectionMaterials.collectionId, materialCollections.id))
    .where(eq(materialCollections.userId, userId));

  const totalFavorites = await db
    .select({ count: sql<number>`count(*)` })
    .from(favoriteMaterials)
    .where(eq(favoriteMaterials.userId, userId));

  return {
    totalCollections: totalCollections[0]?.count || 0,
    totalMaterialsInCollections: totalMaterialsInCollections[0]?.count || 0,
    totalFavorites: totalFavorites[0]?.count || 0,
  };
}
