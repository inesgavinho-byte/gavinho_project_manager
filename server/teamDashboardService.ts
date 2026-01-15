import { db } from "./db";
import { users, projectTeam } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface TeamMemberStats {
  id: number;
  name: string;
  email: string;
  role: string;
  projectsAssigned: number;
  tasksCompleted: number;
  performanceScore: number;
  lastActive: string;
  status: "active" | "inactive" | "on-leave";
}

export async function getTeamMembers(): Promise<TeamMemberStats[]> {
  // For now, return mock data
  // In future, this will query the database
  return [
    {
      id: 1,
      name: "Inês Gavinho",
      email: "ines@gavinho.com",
      role: "Direção Criativa",
      projectsAssigned: 5,
      tasksCompleted: 42,
      performanceScore: 95,
      lastActive: new Date().toISOString(),
      status: "active",
    },
    {
      id: 2,
      name: "João Silva",
      email: "joao@gavinho.com",
      role: "Arquiteto",
      projectsAssigned: 3,
      tasksCompleted: 28,
      performanceScore: 88,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
    {
      id: 3,
      name: "Maria Santos",
      email: "maria@gavinho.com",
      role: "Designer",
      projectsAssigned: 4,
      tasksCompleted: 35,
      performanceScore: 92,
      lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
  ];
}

export async function getTeamMemberPerformance(
  userId: number
): Promise<{
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number;
  qualityScore: number;
  collaborationScore: number;
}> {
  // For now, return mock data
  return {
    tasksCompleted: 42,
    tasksInProgress: 5,
    averageCompletionTime: 3.2,
    qualityScore: 95,
    collaborationScore: 88,
  };
}

export async function getTeamProductivity(): Promise<{
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  averageProductivity: number;
  teamMorale: number;
}> {
  // For now, return mock data
  return {
    totalTasksCompleted: 105,
    totalTasksInProgress: 12,
    averageProductivity: 91,
    teamMorale: 87,
  };
}
