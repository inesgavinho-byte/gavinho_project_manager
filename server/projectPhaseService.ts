import { getDb } from './db';
import { projectPhases, phaseMilestones, phaseActivityLog, phaseTemplates, projects } from '../drizzle/schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';

// ============================================
// PROJECT PHASES SERVICE
// ============================================

export interface CreatePhaseInput {
  projectId: number;
  name: string;
  description?: string;
  order: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  assignedTo?: number;
  responsibleTeam?: string;
  deliverables?: string[];
  risks?: string[];
  dependencies?: number[];
}

export interface UpdatePhaseInput {
  id: number;
  name?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress?: number;
  budget?: number;
  spentBudget?: number;
  assignedTo?: number;
  responsibleTeam?: string;
  deliverables?: string[];
  risks?: string[];
  dependencies?: number[];
  notes?: string;
}

// Criar nova fase
export async function createPhase(input: CreatePhaseInput, userId: number) {
  const db = await getDb();
  
  const result = await db.insert(projectPhases).values({
    projectId: input.projectId,
    name: input.name,
    description: input.description,
    order: input.order,
    status: 'pending',
    startDate: input.startDate ? new Date(input.startDate).toISOString().split('T')[0] : null,
    endDate: input.endDate ? new Date(input.endDate).toISOString().split('T')[0] : null,
    budget: input.budget ? input.budget.toString() : null,
    spentBudget: '0.00',
    assignedTo: input.assignedTo,
    responsibleTeam: input.responsibleTeam,
    deliverables: input.deliverables ? JSON.stringify(input.deliverables) : null,
    risks: input.risks ? JSON.stringify(input.risks) : null,
    dependencies: input.dependencies ? JSON.stringify(input.dependencies) : null,
    createdBy: userId,
  });

  // Log de atividade
  await logPhaseActivity(input.projectId, result.insertId, 'status_change', 'Fase criada', null, 'pending', userId);

  return result;
}

// Atualizar fase
export async function updatePhase(input: UpdatePhaseInput, userId: number) {
  const db = await getDb();
  
  const updateData: any = {};
  
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.startDate !== undefined) updateData.startDate = input.startDate ? new Date(input.startDate).toISOString().split('T')[0] : null;
  if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate).toISOString().split('T')[0] : null;
  if (input.actualStartDate !== undefined) updateData.actualStartDate = input.actualStartDate ? new Date(input.actualStartDate).toISOString().split('T')[0] : null;
  if (input.actualEndDate !== undefined) updateData.actualEndDate = input.actualEndDate ? new Date(input.actualEndDate).toISOString().split('T')[0] : null;
  if (input.progress !== undefined) updateData.progress = input.progress;
  if (input.budget !== undefined) updateData.budget = input.budget ? input.budget.toString() : null;
  if (input.spentBudget !== undefined) updateData.spentBudget = input.spentBudget ? input.spentBudget.toString() : '0.00';
  if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
  if (input.responsibleTeam !== undefined) updateData.responsibleTeam = input.responsibleTeam;
  if (input.deliverables !== undefined) updateData.deliverables = input.deliverables ? JSON.stringify(input.deliverables) : null;
  if (input.risks !== undefined) updateData.risks = input.risks ? JSON.stringify(input.risks) : null;
  if (input.dependencies !== undefined) updateData.dependencies = input.dependencies ? JSON.stringify(input.dependencies) : null;
  if (input.notes !== undefined) updateData.notes = input.notes;

  // Obter fase atual para log
  const currentPhase = await db.select().from(projectPhases).where(eq(projectPhases.id, input.id)).limit(1);
  
  const result = await db.update(projectPhases)
    .set(updateData)
    .where(eq(projectPhases.id, input.id));

  // Log de atividades
  if (input.status && currentPhase[0]?.status !== input.status) {
    await logPhaseActivity(currentPhase[0].projectId, input.id, 'status_change', `Status alterado de ${currentPhase[0].status} para ${input.status}`, currentPhase[0].status, input.status, userId);
  }
  if (input.progress !== undefined && currentPhase[0]?.progress !== input.progress) {
    await logPhaseActivity(currentPhase[0].projectId, input.id, 'progress_update', `Progresso alterado para ${input.progress}%`, currentPhase[0].progress?.toString(), input.progress.toString(), userId);
  }

  return result;
}

// Deletar fase
export async function deletePhase(phaseId: number) {
  const db = await getDb();
  
  // Obter fase para saber o projectId
  const phase = await db.select().from(projectPhases).where(eq(projectPhases.id, phaseId)).limit(1);
  
  if (!phase[0]) throw new Error('Fase não encontrada');

  // Deletar marcos relacionados
  await db.delete(phaseMilestones).where(eq(phaseMilestones.phaseId, phaseId));
  
  // Deletar fase
  return await db.delete(projectPhases).where(eq(projectPhases.id, phaseId));
}

// Obter fases de um projeto
export async function getProjectPhases(projectId: number) {
  const db = await getDb();
  
  const phases = await db.select().from(projectPhases)
    .where(eq(projectPhases.projectId, projectId))
    .orderBy(asc(projectPhases.order));

  return phases.map(phase => ({
    ...phase,
    deliverables: phase.deliverables ? JSON.parse(phase.deliverables) : [],
    risks: phase.risks ? JSON.parse(phase.risks) : [],
    dependencies: phase.dependencies ? JSON.parse(phase.dependencies) : [],
  }));
}

// Obter fase por ID
export async function getPhaseById(phaseId: number) {
  const db = await getDb();
  
  const phase = await db.select().from(projectPhases)
    .where(eq(projectPhases.id, phaseId))
    .limit(1);

  if (!phase[0]) return null;

  return {
    ...phase[0],
    deliverables: phase[0].deliverables ? JSON.parse(phase[0].deliverables) : [],
    risks: phase[0].risks ? JSON.parse(phase[0].risks) : [],
    dependencies: phase[0].dependencies ? JSON.parse(phase[0].dependencies) : [],
  };
}

// Calcular progresso geral do projeto baseado em fases
export async function calculateProjectProgress(projectId: number) {
  const db = await getDb();
  
  const phases = await db.select().from(projectPhases)
    .where(eq(projectPhases.projectId, projectId));

  if (phases.length === 0) return 0;

  const totalProgress = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
  return Math.round(totalProgress / phases.length);
}

// Obter fases por status
export async function getPhasesByStatus(projectId: number, status: string) {
  const db = await getDb();
  
  return await db.select().from(projectPhases)
    .where(and(
      eq(projectPhases.projectId, projectId),
      eq(projectPhases.status, status as any)
    ))
    .orderBy(asc(projectPhases.order));
}

// ============================================
// PHASE MILESTONES SERVICE
// ============================================

export interface CreateMilestoneInput {
  phaseId: number;
  projectId: number;
  name: string;
  description?: string;
  dueDate: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: number;
  deliverables?: string[];
}

// Criar marco
export async function createMilestone(input: CreateMilestoneInput) {
  const db = await getDb();
  
  return await db.insert(phaseMilestones).values({
    phaseId: input.phaseId,
    projectId: input.projectId,
    name: input.name,
    description: input.description,
    dueDate: new Date(input.dueDate).toISOString().split('T')[0],
    status: 'pending',
    priority: input.priority || 'medium',
    assignedTo: input.assignedTo,
    deliverables: input.deliverables ? JSON.stringify(input.deliverables) : null,
  });
}

// Obter marcos de uma fase
export async function getPhaseMilestones(phaseId: number) {
  const db = await getDb();
  
  const milestones = await db.select().from(phaseMilestones)
    .where(eq(phaseMilestones.phaseId, phaseId))
    .orderBy(asc(phaseMilestones.dueDate));

  return milestones.map(m => ({
    ...m,
    deliverables: m.deliverables ? JSON.parse(m.deliverables) : [],
  }));
}

// Completar marco
export async function completeMilestone(milestoneId: number) {
  const db = await getDb();
  
  const milestone = await db.select().from(phaseMilestones)
    .where(eq(phaseMilestones.id, milestoneId))
    .limit(1);

  if (!milestone[0]) throw new Error('Marco não encontrado');

  return await db.update(phaseMilestones)
    .set({
      status: 'completed',
      completionDate: new Date().toISOString().split('T')[0],
    })
    .where(eq(phaseMilestones.id, milestoneId));
}

// ============================================
// PHASE ACTIVITY LOG SERVICE
// ============================================

export async function logPhaseActivity(
  projectId: number,
  phaseId: number,
  activityType: string,
  description: string,
  previousValue: string | null,
  newValue: string | null,
  userId: number
) {
  const db = await getDb();
  
  return await db.insert(phaseActivityLog).values({
    phaseId,
    projectId,
    activityType: activityType as any,
    description,
    previousValue,
    newValue,
    changedBy: userId,
  });
}

// Obter histórico de atividades de uma fase
export async function getPhaseActivityHistory(phaseId: number, limit = 50) {
  const db = await getDb();
  
  return await db.select().from(phaseActivityLog)
    .where(eq(phaseActivityLog.phaseId, phaseId))
    .orderBy(desc(phaseActivityLog.createdAt))
    .limit(limit);
}

// ============================================
// PHASE TEMPLATES SERVICE
// ============================================

export interface CreateTemplateInput {
  name: string;
  description?: string;
  industryType?: string;
  phases: Array<{
    name: string;
    description?: string;
    durationDays?: number;
    deliverables?: string[];
  }>;
}

// Criar template de fases
export async function createPhaseTemplate(input: CreateTemplateInput, userId: number) {
  const db = await getDb();
  
  return await db.insert(phaseTemplates).values({
    name: input.name,
    description: input.description,
    industryType: input.industryType,
    phases: JSON.stringify(input.phases),
    isPublic: 0,
    createdBy: userId,
  });
}

// Obter templates por tipo de indústria
export async function getTemplatesByIndustry(industryType: string) {
  const db = await getDb();
  
  const templates = await db.select().from(phaseTemplates)
    .where(eq(phaseTemplates.industryType, industryType));

  return templates.map(t => ({
    ...t,
    phases: JSON.parse(t.phases),
  }));
}

// Aplicar template a um projeto
export async function applyTemplateToProject(projectId: number, templateId: number, userId: number) {
  const db = await getDb();
  
  const template = await db.select().from(phaseTemplates)
    .where(eq(phaseTemplates.id, templateId))
    .limit(1);

  if (!template[0]) throw new Error('Template não encontrado');

  const phases = JSON.parse(template[0].phases);
  const results = [];

  for (let i = 0; i < phases.length; i++) {
    const phaseData = phases[i];
    const result = await createPhase({
      projectId,
      name: phaseData.name,
      description: phaseData.description,
      order: i + 1,
      deliverables: phaseData.deliverables,
    }, userId);
    results.push(result);
  }

  return results;
}

// Obter estatísticas de fases de um projeto
export async function getProjectPhaseStatistics(projectId: number) {
  const db = await getDb();
  
  const phases = await db.select().from(projectPhases)
    .where(eq(projectPhases.projectId, projectId));

  const statusCounts = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    on_hold: 0,
    cancelled: 0,
  };

  let totalBudget = 0;
  let spentBudget = 0;
  let totalProgress = 0;

  phases.forEach(phase => {
    statusCounts[phase.status as keyof typeof statusCounts]++;
    if (phase.budget) totalBudget += parseFloat(phase.budget);
    if (phase.spentBudget) spentBudget += parseFloat(phase.spentBudget);
    totalProgress += phase.progress || 0;
  });

  return {
    totalPhases: phases.length,
    statusCounts,
    averageProgress: phases.length > 0 ? Math.round(totalProgress / phases.length) : 0,
    totalBudget,
    spentBudget,
    remainingBudget: totalBudget - spentBudget,
    budgetUtilization: totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0,
  };
}
