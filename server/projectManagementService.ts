import { getDb } from './db';
import { projects, projectMilestones, projectTeam, projectDocuments, projectGallery, projectPhases } from '@/drizzle/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

let db: any = null;

async function initDb() {
  if (!db) {
    db = await getDb();
  }
  return db;
}

/**
 * Serviço de Gestão de Projetos
 * Gerencia projetos, marcos, equipa, documentos e histórico
 */

// ============ PROJETOS ============

export async function getProjectById(projectId: number) {
  const database = await initDb();
  const project = await database.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  return project;
}

export async function listProjects(filters?: {
  status?: string;
  archived?: boolean;
  limit?: number;
  offset?: number;
}) {
  const database = await initDb();
  let query = database.select().from(projects);

  if (filters?.status) {
    query = query.where(eq(projects.status, filters.status as any));
  }

  if (filters?.archived !== undefined) {
    query = query.where(eq(projects.isArchived, filters.archived ? 1 : 0));
  }

  query = query.orderBy(desc(projects.createdAt));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  return await query;
}

export async function createProject(data: {
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  clientName?: string;
  location?: string;
  projectType?: string;
  createdById?: number;
}) {
  const database = await initDb();
  const result = await database.insert(projects).values({
    name: data.name,
    description: data.description,
    status: (data.status || 'planning') as any,
    priority: (data.priority || 'medium') as any,
    startDate: data.startDate,
    endDate: data.endDate,
    budget: data.budget ? parseFloat(data.budget.toString()) : undefined,
    clientName: data.clientName,
    location: data.location,
    projectType: data.projectType,
    createdById: data.createdById,
  });

  return result;
}

export async function updateProject(projectId: number, data: Partial<typeof projects.$inferInsert>) {
  const database = await initDb();
  await database.update(projects).set(data).where(eq(projects.id, projectId));
  return getProjectById(projectId);
}

// ============ MARCOS ============

export async function getMilestonesByProject(projectId: number) {
  const milestones = await (await initDb()).query.projectMilestones.findMany({
    where: eq(projectMilestones.projectId, projectId),
    orderBy: (m) => m.dueDate,
  });
  return milestones;
}

export async function createMilestone(data: {
  projectId: number;
  phaseId?: number;
  name: string;
  description?: string;
  dueDate: string;
  isKeyMilestone?: boolean;
  dependencies?: any;
}) {
  const result = await (await initDb()).insert(projectMilestones).values({
    projectId: data.projectId,
    phaseId: data.phaseId,
    name: data.name,
    description: data.description,
    dueDate: data.dueDate,
    isKeyMilestone: data.isKeyMilestone ? 1 : 0,
    dependencies: data.dependencies,
    status: 'pending',
  });

  return result;
}

export async function updateMilestone(milestoneId: number, data: Partial<typeof projectMilestones.$inferInsert>) {
  await (await initDb()).update(projectMilestones).set(data).where(eq(projectMilestones.id, milestoneId));
  return db.query.projectMilestones.findFirst({
    where: eq(projectMilestones.id, milestoneId),
  });
}

export async function completeMilestone(milestoneId: number) {
  const now = new Date().toISOString();
  await (await initDb()).update(projectMilestones).set({
    status: 'completed',
    completedDate: now,
  }).where(eq(projectMilestones.id, milestoneId));
}

export async function getMilestoneStats(projectId: number) {
  const milestones = await getMilestonesByProject(projectId);

  const total = milestones.length;
  const completed = milestones.filter(m => m.status === 'completed').length;
  const pending = milestones.filter(m => m.status === 'pending').length;
  const overdue = milestones.filter(m => {
    const dueDate = new Date(m.dueDate);
    return m.status === 'pending' && dueDate < new Date();
  }).length;

  return {
    total,
    completed,
    pending,
    overdue,
    completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// ============ EQUIPA ============

export async function getProjectTeam(projectId: number) {
  const team = await (await initDb()).query.projectTeam.findMany({
    where: and(
      eq(projectTeam.projectId, projectId),
      eq(projectTeam.isActive, 1)
    ),
    orderBy: (t) => t.displayOrder,
  });
  return team;
}

export async function addTeamMember(data: {
  projectId: number;
  userId: number;
  role: string;
  responsibilities?: string;
}) {
  const result = await (await initDb()).insert(projectTeam).values({
    projectId: data.projectId,
    userId: data.userId,
    role: data.role,
    responsibilities: data.responsibilities,
    isActive: 1,
  });

  return result;
}

export async function removeTeamMember(teamMemberId: number) {
  const now = new Date().toISOString();
  await (await initDb()).update(projectTeam).set({
    isActive: 0,
    leftAt: now,
  }).where(eq(projectTeam.id, teamMemberId));
}

export async function updateTeamMemberRole(teamMemberId: number, role: string, responsibilities?: string) {
  await (await initDb()).update(projectTeam).set({
    role,
    responsibilities,
  }).where(eq(projectTeam.id, teamMemberId));
}

// ============ DOCUMENTOS ============

export async function getProjectDocuments(projectId: number, category?: string) {
  let query = db.select().from(projectDocuments).where(eq(projectDocuments.projectId, projectId));

  if (category) {
    query = query.where(eq(projectDocuments.category, category as any));
  }

  return await query.orderBy(desc(projectDocuments.createdAt));
}

export async function addDocument(data: {
  projectId: number;
  phaseId?: number;
  name: string;
  description?: string;
  fileUrl: string;
  fileKey: string;
  fileType?: string;
  fileSize?: number;
  category: string;
  uploadedById: number;
}) {
  const result = await (await initDb()).insert(projectDocuments).values({
    projectId: data.projectId,
    phaseId: data.phaseId,
    name: data.name,
    description: data.description,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    fileType: data.fileType,
    fileSize: data.fileSize,
    category: data.category as any,
    uploadedById: data.uploadedById,
  });

  return result;
}

// ============ GALERIA ============

export async function getProjectGallery(projectId: number, phaseId?: number) {
  let query = db.select().from(projectGallery).where(eq(projectGallery.projectId, projectId));

  if (phaseId) {
    query = query.where(eq(projectGallery.phaseId, phaseId));
  }

  return await query.orderBy((g) => g.order);
}

export async function addGalleryImage(data: {
  projectId: number;
  phaseId?: number;
  title?: string;
  description?: string;
  imageUrl: string;
  imageKey: string;
  thumbnailUrl?: string;
  category?: string;
  takenAt?: string;
  uploadedById: number;
}) {
  const result = await (await initDb()).insert(projectGallery).values({
    projectId: data.projectId,
    phaseId: data.phaseId,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl,
    imageKey: data.imageKey,
    thumbnailUrl: data.thumbnailUrl,
    category: data.category,
    takenAt: data.takenAt,
    uploadedById: data.uploadedById,
  });

  return result;
}

export async function reorderGalleryImages(projectId: number, imageIds: number[]) {
  for (let i = 0; i < imageIds.length; i++) {
    await (await initDb()).update(projectGallery).set({
      order: i,
    }).where(eq(projectGallery.id, imageIds[i]));
  }
}

// ============ FASES ============

export async function getProjectPhases(projectId: number) {
  const phases = await (await initDb()).query.projectPhases.findMany({
    where: eq(projectPhases.projectId, projectId),
    orderBy: (p) => p.order,
  });
  return phases;
}

export async function createPhase(data: {
  projectId: number;
  name: string;
  description?: string;
  order: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  assignedTo?: number;
}) {
  const result = await (await initDb()).insert(projectPhases).values({
    projectId: data.projectId,
    name: data.name,
    description: data.description,
    order: data.order,
    startDate: data.startDate,
    endDate: data.endDate,
    status: (data.status || 'not_started') as any,
    assignedTo: data.assignedTo,
  });

  return result;
}

export async function updatePhaseProgress(phaseId: number, progress: number) {
  await (await initDb()).update(projectPhases).set({
    progress,
  }).where(eq(projectPhases.id, phaseId));
}

// ============ HISTÓRICO ============

export async function getProjectTimeline(projectId: number) {
  const milestones = await getMilestonesByProject(projectId);
  const documents = await getProjectDocuments(projectId);
  const gallery = await getProjectGallery(projectId);

  const timeline = [
    ...milestones.map(m => ({
      type: 'milestone',
      date: m.dueDate,
      title: m.name,
      description: m.description,
      status: m.status,
    })),
    ...documents.map(d => ({
      type: 'document',
      date: d.createdAt,
      title: d.name,
      description: d.description,
      category: d.category,
    })),
    ...gallery.map(g => ({
      type: 'image',
      date: g.createdAt,
      title: g.title,
      description: g.description,
      category: g.category,
    })),
  ];

  return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getProjectStats(projectId: number) {
  const project = await getProjectById(projectId);
  const milestones = await getMilestonesByProject(projectId);
  const team = await getProjectTeam(projectId);
  const documents = await getProjectDocuments(projectId);
  const gallery = await getProjectGallery(projectId);
  const phases = await getProjectPhases(projectId);

  const milestoneStat = getMilestoneStats(projectId);

  return {
    project,
    milestones: {
      total: milestones.length,
      ...(await milestoneStat),
    },
    team: {
      total: team.length,
    },
    documents: {
      total: documents.length,
    },
    gallery: {
      total: gallery.length,
    },
    phases: {
      total: phases.length,
      active: phases.filter(p => p.status === 'in_progress').length,
    },
  };
}
