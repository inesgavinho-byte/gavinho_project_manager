import { getDb } from "./db";
import { 
  projects, 
  projectPhases, 
  projectMilestones, 
  projectTeam, 
  projectDocuments, 
  projectGallery,
  users,
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
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";

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
