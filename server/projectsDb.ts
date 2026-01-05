import { getDb } from "./db";
import { 
  projects, 
  projectPhases, 
  projectMilestones, 
  projectTeam, 
  projectDocuments, 
  projectGallery,
  users,
  archvizCompartments,
  type Project,
  type InsertProject,
  type ProjectPhase,
  type InsertProjectPhase,
  type ProjectMilestone,
  type InsertProjectMilestone,
  type ProjectTeamMember,
  type InsertProjectTeamMember,
  type ProjectDocument,
  type InsertProjectDocument,
  type ProjectGalleryImage,
  type InsertProjectGalleryImage
} from "../drizzle/schema";
import { eq, desc, and, isNull, isNotNull, sql } from "drizzle-orm";

// ============= PROJECTS =============

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).where(isNull(projects.deletedAt)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0] || null;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result[0].insertId;
}

export async function updateProject(projectId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete: just set deletedAt timestamp
  await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, projectId));
}

export async function getProjectsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).where(and(eq(projects.status, status as any), isNull(projects.deletedAt))).orderBy(desc(projects.createdAt));
}

// ============= PROJECT PHASES =============

export async function getProjectPhases(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(projectPhases)
    .where(eq(projectPhases.projectId, projectId))
    .orderBy(projectPhases.order);
}

export async function getPhaseById(phaseId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projectPhases).where(eq(projectPhases.id, phaseId)).limit(1);
  return result[0] || null;
}

export async function createPhase(data: InsertProjectPhase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectPhases).values(data);
  return result[0].insertId;
}

export async function updatePhase(phaseId: number, data: Partial<InsertProjectPhase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectPhases).set(data).where(eq(projectPhases.id, phaseId));
}

export async function deletePhase(phaseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectPhases).where(eq(projectPhases.id, phaseId));
}

// ============= PROJECT MILESTONES =============

export async function getProjectMilestones(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId))
    .orderBy(projectMilestones.dueDate);
}

export async function getMilestonesByPhase(phaseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.phaseId, phaseId))
    .orderBy(projectMilestones.dueDate);
}

export async function getMilestoneById(milestoneId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projectMilestones).where(eq(projectMilestones.id, milestoneId)).limit(1);
  return result[0] || null;
}

export async function createMilestone(data: InsertProjectMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectMilestones).values(data);
  return result[0].insertId;
}

export async function updateMilestone(milestoneId: number, data: Partial<InsertProjectMilestone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectMilestones).set(data).where(eq(projectMilestones.id, milestoneId));
}

export async function deleteMilestone(milestoneId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectMilestones).where(eq(projectMilestones.id, milestoneId));
}

// ============= PROJECT TEAM =============

export async function getProjectTeam(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: projectTeam.id,
      projectId: projectTeam.projectId,
      userId: projectTeam.userId,
      role: projectTeam.role,
      responsibilities: projectTeam.responsibilities,
      displayOrder: projectTeam.displayOrder,
      joinedAt: projectTeam.joinedAt,
      leftAt: projectTeam.leftAt,
      isActive: projectTeam.isActive,
      createdAt: projectTeam.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(projectTeam)
    .leftJoin(users, eq(projectTeam.userId, users.id))
    .where(and(
      eq(projectTeam.projectId, projectId),
      eq(projectTeam.isActive, 1)
    ))
    .orderBy(projectTeam.displayOrder, projectTeam.joinedAt);
}

export async function getTeamMemberById(memberId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projectTeam).where(eq(projectTeam.id, memberId)).limit(1);
  return result[0] || null;
}

export async function addTeamMember(data: InsertProjectTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectTeam).values(data);
  return result[0].insertId;
}

export async function updateTeamMember(memberId: number, data: Partial<InsertProjectTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectTeam).set(data).where(eq(projectTeam.id, memberId));
}

export async function removeTeamMember(memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectTeam).set({ isActive: 0, leftAt: new Date() }).where(eq(projectTeam.id, memberId));
}

export async function reorderTeamMembers(updates: Array<{ memberId: number; displayOrder: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update each member's display order
  for (const update of updates) {
    await db.update(projectTeam)
      .set({ displayOrder: update.displayOrder })
      .where(eq(projectTeam.id, update.memberId));
  }
}

// ============= PROJECT DOCUMENTS =============

export async function getProjectDocuments(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: projectDocuments.id,
      projectId: projectDocuments.projectId,
      name: projectDocuments.name,
      description: projectDocuments.description,
      fileUrl: projectDocuments.fileUrl,
      fileKey: projectDocuments.fileKey,
      fileType: projectDocuments.fileType,
      fileSize: projectDocuments.fileSize,
      category: projectDocuments.category,
      uploadedById: projectDocuments.uploadedById,
      createdAt: projectDocuments.createdAt,
      updatedAt: projectDocuments.updatedAt,
      uploaderName: users.name,
    })
    .from(projectDocuments)
    .leftJoin(users, eq(projectDocuments.uploadedById, users.id))
    .where(eq(projectDocuments.projectId, projectId))
    .orderBy(desc(projectDocuments.createdAt));
}

export async function getDocumentsByCategory(projectId: number, category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(projectDocuments)
    .where(and(
      eq(projectDocuments.projectId, projectId),
      eq(projectDocuments.category, category as any)
    ))
    .orderBy(desc(projectDocuments.createdAt));
}

export async function getDocumentById(documentId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projectDocuments).where(eq(projectDocuments.id, documentId)).limit(1);
  return result[0] || null;
}

export async function createDocument(data: InsertProjectDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectDocuments).values(data);
  return result[0].insertId;
}

export async function updateDocument(documentId: number, data: Partial<InsertProjectDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectDocuments).set(data).where(eq(projectDocuments.id, documentId));
}

export async function deleteDocument(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectDocuments).where(eq(projectDocuments.id, documentId));
}

// ============= PROJECT GALLERY =============

export async function getProjectGallery(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: projectGallery.id,
      projectId: projectGallery.projectId,
      title: projectGallery.title,
      description: projectGallery.description,
      imageUrl: projectGallery.imageUrl,
      imageKey: projectGallery.imageKey,
      thumbnailUrl: projectGallery.thumbnailUrl,
      category: projectGallery.category,
      takenAt: projectGallery.takenAt,
      uploadedById: projectGallery.uploadedById,
      order: projectGallery.order,
      createdAt: projectGallery.createdAt,
      uploaderName: users.name,
    })
    .from(projectGallery)
    .leftJoin(users, eq(projectGallery.uploadedById, users.id))
    .where(eq(projectGallery.projectId, projectId))
    .orderBy(projectGallery.order, desc(projectGallery.createdAt));
}

export async function getGalleryImageById(imageId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projectGallery).where(eq(projectGallery.id, imageId)).limit(1);
  return result[0] || null;
}

export async function addGalleryImage(data: InsertProjectGalleryImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectGallery).values(data);
  return result[0].insertId;
}

export async function updateGalleryImage(imageId: number, data: Partial<InsertProjectGalleryImage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectGallery).set(data).where(eq(projectGallery.id, imageId));
}

export async function deleteGalleryImage(imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectGallery).where(eq(projectGallery.id, imageId));
}

// ============= STATISTICS =============

export async function getProjectStats(projectId: number) {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const phases = await getProjectPhases(projectId);
  const milestones = await getProjectMilestones(projectId);
  const team = await getProjectTeam(projectId);
  const documents = await getProjectDocuments(projectId);
  const gallery = await getProjectGallery(projectId);

  const completedPhases = phases.filter((p: ProjectPhase) => p.status === 'completed').length;
  const completedMilestones = milestones.filter((m: ProjectMilestone) => m.status === 'completed').length;
  const overdueMilestones = milestones.filter((m: ProjectMilestone) => m.status === 'overdue').length;

  return {
    project,
    stats: {
      totalPhases: phases.length,
      completedPhases,
      totalMilestones: milestones.length,
      completedMilestones,
      overdueMilestones,
      teamSize: team.length,
      totalDocuments: documents.length,
      totalPhotos: gallery.length,
    }
  };
}

// ============= TRASH (SOFT DELETE) =============

export async function getTrashedProjects() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).where(isNotNull(projects.deletedAt)).orderBy(desc(projects.deletedAt));
}

export async function restoreProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Restore: set deletedAt back to null
  await db.update(projects).set({ deletedAt: null }).where(eq(projects.id, projectId));
}

export async function permanentDeleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete in cascade order (child tables first)
  // 1. Delete gallery images
  await db.delete(projectGallery).where(eq(projectGallery.projectId, projectId));
  
  // 2. Delete documents
  await db.delete(projectDocuments).where(eq(projectDocuments.projectId, projectId));
  
  // 3. Delete team members
  await db.delete(projectTeam).where(eq(projectTeam.projectId, projectId));
  
  // 4. Delete milestones
  await db.delete(projectMilestones).where(eq(projectMilestones.projectId, projectId));
  
  // 5. Delete phases
  await db.delete(projectPhases).where(eq(projectPhases.projectId, projectId));
  
  // 6. Finally, delete the project itself permanently
  await db.delete(projects).where(eq(projects.id, projectId));
}


// ============= TIMELINE & GANTT =============

/**
 * Get complete timeline data for Gantt chart
 * Returns phases and milestones with all necessary information
 */
export async function getProjectTimeline(projectId: number) {
  const db = await getDb();
  if (!db) return { phases: [], milestones: [] };

  // Get all phases for the project
  const phases = await db
    .select()
    .from(projectPhases)
    .where(eq(projectPhases.projectId, projectId))
    .orderBy(projectPhases.order);

  // Get all milestones for the project
  const milestones = await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId))
    .orderBy(projectMilestones.dueDate);

  return { phases, milestones };
}

/**
 * Update milestone dates (for drag & drop functionality)
 */
export async function updateMilestoneDates(
  milestoneId: number,
  dueDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(projectMilestones)
    .set({ dueDate, updatedAt: new Date() })
    .where(eq(projectMilestones.id, milestoneId));
}

/**
 * Update phase dates (for drag & drop functionality)
 */
export async function updatePhaseDates(
  phaseId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(projectPhases)
    .set({ startDate, endDate, updatedAt: new Date() })
    .where(eq(projectPhases.id, phaseId));
}

/**
 * Update milestone dependencies
 */
export async function updateMilestoneDependencies(
  milestoneId: number,
  dependencies: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(projectMilestones)
    .set({ dependencies, updatedAt: new Date() })
    .where(eq(projectMilestones.id, milestoneId));
}

/**
 * Get milestone by ID with dependencies
 */
export async function getMilestoneWithDependencies(milestoneId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.id, milestoneId))
    .limit(1);

  return result[0] || null;
}

/**
 * Calculate critical path for project
 * Returns array of milestone IDs that are on the critical path
 */
export async function calculateCriticalPath(projectId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all milestones with dependencies
  const milestones = await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId))
    .orderBy(projectMilestones.dueDate);

  // Simple critical path: milestones with dependencies or key milestones
  const criticalMilestones = milestones
    .filter(m => {
      const deps = m.dependencies as number[] | null;
      return m.isKeyMilestone === 1 || (deps && deps.length > 0);
    })
    .map(m => m.id);

  return criticalMilestones;
}


// ============= ARCHVIZ (Project-level aggregation) =============

/**
 * Get all archviz renders for a project (aggregates from all associated constructions)
 */
export async function getProjectArchvizRenders(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Import constructions and archvizRenders tables
  const { constructions } = await import("../drizzle/schema");
  const { archvizRenders } = await import("../drizzle/schema");
  const { archvizComments } = await import("../drizzle/schema");
  
  // Get all constructions for this project
  const projectConstructions = await db
    .select()
    .from(constructions)
    .where(eq(constructions.projectId, projectId));
  
  if (projectConstructions.length === 0) {
    return [];
  }
  
  const constructionIds = projectConstructions.map(c => c.id);
  
  // Get all renders from these constructions with uploader info
  const renders = await db
    .select({
      render: archvizRenders,
      construction: constructions,
      uploader: users,
    })
    .from(archvizRenders)
    .leftJoin(constructions, eq(archvizRenders.constructionId, constructions.id))
    .leftJoin(users, eq(archvizRenders.uploadedById, users.id))
    .where(
      and(
        ...constructionIds.map(id => eq(archvizRenders.constructionId, id))
      )
    )
    .orderBy(desc(archvizRenders.createdAt));
  
  // Get comment counts for each render
  const renderIds = renders.map(r => r.render.id);
  const commentCounts: Record<number, number> = {};
  
  if (renderIds.length > 0) {
    const comments = await db
      .select({
        renderId: archvizComments.renderId,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(archvizComments)
      .where(
        and(
          ...renderIds.map(id => eq(archvizComments.renderId, id))
        )
      )
      .groupBy(archvizComments.renderId);
    
    comments.forEach(c => {
      commentCounts[c.renderId] = c.count;
    });
  }
  
  return renders.map(r => ({
    ...r.render,
    constructionCode: r.construction?.code || 'N/A',
    constructionName: r.construction?.name || 'N/A',
    uploaderName: r.uploader?.name || 'Unknown',
    commentCount: commentCounts[r.render.id] || 0,
  }));
}

/**
 * Get archviz render by ID with full details
 */
export async function getArchvizRenderById(renderId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { archvizRenders } = await import("../drizzle/schema");
  const { constructions } = await import("../drizzle/schema");
  
  const result = await db
    .select({
      render: archvizRenders,
      construction: constructions,
      uploader: users,
    })
    .from(archvizRenders)
    .leftJoin(constructions, eq(archvizRenders.constructionId, constructions.id))
    .leftJoin(users, eq(archvizRenders.uploadedById, users.id))
    .where(eq(archvizRenders.id, renderId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const r = result[0];
  return {
    ...r.render,
    constructionCode: r.construction?.code || 'N/A',
    constructionName: r.construction?.name || 'N/A',
    uploaderName: r.uploader?.name || 'Unknown',
  };
}

/**
 * Get comments for a render
 */
export async function getArchvizComments(renderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { archvizComments } = await import("../drizzle/schema");
  
  const comments = await db
    .select({
      comment: archvizComments,
      user: users,
    })
    .from(archvizComments)
    .leftJoin(users, eq(archvizComments.userId, users.id))
    .where(eq(archvizComments.renderId, renderId))
    .orderBy(desc(archvizComments.createdAt));
  
  return comments.map(c => ({
    ...c.comment,
    userName: c.user?.name || 'Unknown',
  }));
}

/**
 * Add comment to a render
 */
export async function addArchvizComment(renderId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { archvizComments } = await import("../drizzle/schema");
  
  const result = await db.insert(archvizComments).values({
    renderId,
    userId,
    content,
  });
  
  return result[0].insertId;
}

/**
 * Update render status
 */
export async function updateArchvizRenderStatus(
  renderId: number,
  status: "pending" | "approved_dc" | "approved_client",
  changedById: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { archvizRenders } = await import("../drizzle/schema");
  const { archvizStatusHistory } = await import("../drizzle/schema");
  
  // Get current status
  const currentRender = await db
    .select()
    .from(archvizRenders)
    .where(eq(archvizRenders.id, renderId))
    .limit(1);
  
  if (currentRender.length === 0) {
    throw new Error("Render not found");
  }
  
  const oldStatus = currentRender[0].status;
  
  // Update status
  await db
    .update(archvizRenders)
    .set({ status })
    .where(eq(archvizRenders.id, renderId));
  
  // Record status change in history
  await db.insert(archvizStatusHistory).values({
    renderId,
    oldStatus,
    newStatus: status,
    changedById,
    notes,
  });
  
  return true;
}

/**
 * Get archviz statistics for a project
 */
export async function getProjectArchvizStats(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const renders = await getProjectArchvizRenders(projectId);
  
  const total = renders.length;
  const pending = renders.filter(r => r.status === "pending").length;
  const approvedDc = renders.filter(r => r.status === "approved_dc").length;
  const approvedClient = renders.filter(r => r.status === "approved_client").length;
  const favorites = renders.filter(r => r.isFavorite).length;
  
  return {
    total,
    pending,
    approvedDc,
    approvedClient,
    favorites,
  };
}


/**
 * Get all constructions for a project
 */
export async function getProjectConstructions(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { constructions } = await import("../drizzle/schema");
  
  const projectConstructions = await db
    .select()
    .from(constructions)
    .where(eq(constructions.projectId, projectId))
    .orderBy(desc(constructions.createdAt));
  
  return projectConstructions;
}

/**
 * Upload a new archviz render
 */
export async function uploadArchvizRender(data: {
  constructionId: number;
  compartmentId: number;
  name: string;
  description?: string;
  fileUrl: string;
  fileKey: string;
  thumbnailUrl?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { archvizRenders } = await import("../drizzle/schema");
  
  // Get the next version number for this compartment
  const existingRenders = await db
    .select()
    .from(archvizRenders)
    .where(
      and(
        eq(archvizRenders.compartmentId, data.compartmentId),
        eq(archvizRenders.constructionId, data.constructionId)
      )
    )
    .orderBy(desc(archvizRenders.version));
  
  const nextVersion = existingRenders.length > 0 ? existingRenders[0].version + 1 : 1;
  
  // Insert new render
  const result = await db.insert(archvizRenders).values({
    constructionId: data.constructionId,
    compartmentId: data.compartmentId,
    name: data.name,
    description: data.description || null,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    thumbnailUrl: data.thumbnailUrl || null,
    mimeType: data.mimeType || null,
    fileSize: data.fileSize || null,
    version: nextVersion,
    status: "pending",
    uploadedById: data.uploadedById,
    isFavorite: false,
  });
  
  return result[0].insertId;
}


/**
 * Get compartments for a construction
 */
export async function getConstructionCompartments(constructionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const compartments = await db
    .select({
      id: archvizCompartments.id,
      name: archvizCompartments.name,
      description: archvizCompartments.description,
      parentId: archvizCompartments.parentId,
    })
    .from(archvizCompartments)
    .where(eq(archvizCompartments.constructionId, constructionId))
    .orderBy(archvizCompartments.name);
  
  return compartments;
}
