import { getDb } from './db';
import { projects, projectMilestones, projectTeam } from '../drizzle/schema';
import { eq, and, or, like, desc, asc, gte, lte, inArray } from 'drizzle-orm';

let db: any = null;

async function initDb() {
  if (!db) {
    db = await getDb();
  }
  return db;
}

/**
 * Serviço de Dashboard Executivo
 * Fornece funcionalidades de busca, filtros e KPIs para gestores
 */

// ============ TIPOS ============

export interface ExecutiveDashboardFilters {
  searchQuery?: string;
  status?: string[];
  priority?: string[];
  phase?: string[];
  teamMemberId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'name' | 'dueDate' | 'progress' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProjectSearchResult {
  id: string;
  name: string;
  status: string;
  priority: string;
  progress: number;
  dueDate: Date | null;
  description: string | null;
  teamCount: number;
  milestonesCount: number;
  overdueCount: number;
}

export interface ExecutiveDashboardKPIs {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  averageProgress: number;
  upcomingDeadlines: number;
  teamMembersCount: number;
  projectsByStatus: Record<string, number>;
  projectsByPriority: Record<string, number>;
  projectsByPhase: Record<string, number>;
}

// ============ BUSCA E FILTROS ============

export async function searchProjects(filters: ExecutiveDashboardFilters): Promise<ProjectSearchResult[]> {
  const database = await initDb();
  
  // Construir condições WHERE
  const whereConditions: any[] = [];

  // Filtro de busca por texto
  if (filters.searchQuery) {
    const searchTerm = `%${filters.searchQuery}%`;
    whereConditions.push(
      or(
        like(projects.name, searchTerm),
        like(projects.description, searchTerm)
      )
    );
  }

  // Filtro de status
  if (filters.status && filters.status.length > 0) {
    whereConditions.push(inArray(projects.status, filters.status));
  }

  // Filtro de prioridade
  if (filters.priority && filters.priority.length > 0) {
    whereConditions.push(inArray(projects.priority, filters.priority));
  }

  // Filtro de fase
  if (filters.phase && filters.phase.length > 0) {
    whereConditions.push(inArray(projects.phase, filters.phase));
  }

  // Filtro de data de vencimento
  if (filters.startDate) {
    whereConditions.push(gte(projects.dueDate, filters.startDate));
  }
  if (filters.endDate) {
    whereConditions.push(lte(projects.dueDate, filters.endDate));
  }

  // Ordenação
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';
  const sortColumn = {
    name: projects.name,
    dueDate: projects.dueDate,
    progress: projects.progress,
    priority: projects.priority,
    createdAt: projects.createdAt,
  }[sortBy] || projects.createdAt;

  // Paginação
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  // Construir query
  let query = database
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      priority: projects.priority,
      progress: projects.progress,
      dueDate: projects.dueDate,
      description: projects.description,
    })
    .from(projects);

  // Aplicar condições WHERE
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }

  // Aplicar ordenação
  query = query.orderBy(
    sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
  );

  // Aplicar paginação
  query = query.limit(limit).offset(offset);

  const results = await query;

  // Enriquecer com dados de equipa e marcos
  const enrichedResults: ProjectSearchResult[] = [];
  
  for (const project of results) {
    const teamMembers = await database
      .select({ id: projectTeam.id })
      .from(projectTeam)
      .where(eq(projectTeam.projectId, project.id));

    const milestones = await database
      .select({ id: projectMilestones.id, status: projectMilestones.status, dueDate: projectMilestones.dueDate })
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, project.id));

    const now = new Date();
    const overdueCount = milestones.filter(
      m => m.status !== 'completed' && m.dueDate && new Date(m.dueDate) < now
    ).length;

    enrichedResults.push({
      ...project,
      teamCount: teamMembers.length,
      milestonesCount: milestones.length,
      overdueCount,
    });
  }

  return enrichedResults;
}

// ============ KPIs ============

export async function getExecutiveDashboardKPIs(): Promise<ExecutiveDashboardKPIs> {
  const database = await initDb();

  // Contar projetos por status
  const allProjects = await database.select().from(projects);
  
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter(p => p.status === 'active').length;
  const completedProjects = allProjects.filter(p => p.status === 'completed').length;
  
  const now = new Date();
  let overdueProjects = 0;
  let upcomingDeadlines = 0;
  const averageProgress = allProjects.length > 0
    ? allProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / allProjects.length
    : 0;

  for (const project of allProjects) {
    if (project.dueDate) {
      const dueDate = new Date(project.dueDate);
      if (dueDate < now && project.status !== 'completed') {
        overdueProjects++;
      } else if (dueDate > now && dueDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        upcomingDeadlines++;
      }
    }
  }

  // Agrupar por status, prioridade e fase
  const projectsByStatus: Record<string, number> = {};
  const projectsByPriority: Record<string, number> = {};
  const projectsByPhase: Record<string, number> = {};

  for (const project of allProjects) {
    projectsByStatus[project.status] = (projectsByStatus[project.status] || 0) + 1;
    projectsByPriority[project.priority] = (projectsByPriority[project.priority] || 0) + 1;
    projectsByPhase[project.phase] = (projectsByPhase[project.phase] || 0) + 1;
  }

  // Contar membros da equipa únicos
  const allTeamMembers = await database.select().from(projectTeam);
  const uniqueTeamMembers = new Set(allTeamMembers.map(t => t.userId)).size;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    overdueProjects,
    averageProgress: Math.round(averageProgress),
    upcomingDeadlines,
    teamMembersCount: uniqueTeamMembers,
    projectsByStatus,
    projectsByPriority,
    projectsByPhase,
  };
}

// ============ SUGESTÕES DE BUSCA ============

export async function getSearchSuggestions(query: string): Promise<string[]> {
  const database = await initDb();

  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = `%${query}%`;
  const results = await database
    .select({ name: projects.name })
    .from(projects)
    .where(like(projects.name, searchTerm))
    .limit(10);

  return results.map(r => r.name);
}

// ============ FILTROS DISPONÍVEIS ============

export async function getAvailableFilters(): Promise<{
  statuses: string[];
  priorities: string[];
  phases: string[];
  teamMembers: Array<{ id: string; name: string }>;
}> {
  const database = await initDb();

  const allProjects = await database.select().from(projects);
  const allTeamMembers = await database.select().from(projectTeam);

  const statuses = [...new Set(allProjects.map(p => p.status))];
  const priorities = [...new Set(allProjects.map(p => p.priority))];
  const phases = [...new Set(allProjects.map(p => p.phase))];

  const teamMembers = [...new Set(allTeamMembers.map(t => ({ id: t.userId, name: t.role })))];

  return {
    statuses,
    priorities,
    phases,
    teamMembers,
  };
}
