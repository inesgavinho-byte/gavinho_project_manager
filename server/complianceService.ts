/**
 * Serviço de Conformidade de Prazos
 * Calcula métricas de cumprimento de prazos, tendências e performance por projeto
 */

import { initDb } from './db';
import { projects, projectMilestones } from '../drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface ComplianceMetrics {
  projectId: string;
  projectName: string;
  totalMilestones: number;
  completedOnTime: number;
  completedLate: number;
  overdue: number;
  pending: number;
  complianceRate: number; // Percentual de marcos concluídos no prazo
  avgDaysOverdue: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface ComplianceTrend {
  period: string;
  complianceRate: number;
  overdueCount: number;
  lateCount: number;
  onTimeCount: number;
}

export interface ComplianceStats {
  totalProjects: number;
  averageCompliance: number;
  projectsAtRisk: number;
  projectsExcellent: number;
  totalMilestones: number;
  totalOverdue: number;
  totalLate: number;
  totalOnTime: number;
}

export class ComplianceService {
  /**
   * Calcula métricas de conformidade para um projeto
   */
  static async getProjectCompliance(projectId: string): Promise<ComplianceMetrics | null> {
    try {
      const db = await initDb();

      // Obter informações do projeto
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project || project.length === 0) {
        return null;
      }

      // Obter todos os marcos do projeto
      const milestones = await db
        .select()
        .from(projectMilestones)
        .where(eq(projectMilestones.projectId, projectId));

      const now = new Date();
      let completedOnTime = 0;
      let completedLate = 0;
      let overdue = 0;
      let pending = 0;
      let totalDaysOverdue = 0;
      let overdueCount = 0;

      milestones.forEach((milestone) => {
        const dueDate = new Date(milestone.dueDate);

        if (milestone.status === 'completed') {
          const completedDate = milestone.completedDate ? new Date(milestone.completedDate) : now;
          if (completedDate <= dueDate) {
            completedOnTime++;
          } else {
            completedLate++;
            const daysLate = Math.floor((completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            totalDaysOverdue += daysLate;
            overdueCount++;
          }
        } else if (dueDate < now) {
          overdue++;
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          totalDaysOverdue += daysOverdue;
          overdueCount++;
        } else {
          pending++;
        }
      });

      const totalMilestones = milestones.length;
      const complianceRate = totalMilestones > 0 ? (completedOnTime / totalMilestones) * 100 : 0;
      const avgDaysOverdue = overdueCount > 0 ? totalDaysOverdue / overdueCount : 0;

      // Determinar status
      let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
      if (complianceRate >= 90) {
        status = 'excellent';
      } else if (complianceRate >= 75) {
        status = 'good';
      } else if (complianceRate >= 50) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      return {
        projectId,
        projectName: project[0].name,
        totalMilestones,
        completedOnTime,
        completedLate,
        overdue,
        pending,
        complianceRate,
        avgDaysOverdue,
        status,
      };
    } catch (error) {
      console.error('[ComplianceService] Erro ao calcular conformidade:', error);
      return null;
    }
  }

  /**
   * Obtém conformidade para todos os projetos
   */
  static async getAllProjectsCompliance(): Promise<ComplianceMetrics[]> {
    try {
      const db = await initDb();

      const allProjects = await db.select().from(projects);
      const complianceMetrics: ComplianceMetrics[] = [];

      for (const project of allProjects) {
        const metrics = await this.getProjectCompliance(project.id);
        if (metrics) {
          complianceMetrics.push(metrics);
        }
      }

      return complianceMetrics.sort((a, b) => a.complianceRate - b.complianceRate);
    } catch (error) {
      console.error('[ComplianceService] Erro ao obter conformidade de todos os projetos:', error);
      return [];
    }
  }

  /**
   * Obtém tendências de conformidade para um período
   */
  static async getComplianceTrends(
    projectId: string,
    startDate: Date,
    endDate: Date,
    periodDays: number = 7
  ): Promise<ComplianceTrend[]> {
    try {
      const db = await initDb();
      const trends: ComplianceTrend[] = [];

      let currentStart = new Date(startDate);

      while (currentStart < endDate) {
        const currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + periodDays);

        // Obter marcos concluídos neste período
        const milestonesInPeriod = await db
          .select()
          .from(projectMilestones)
          .where(
            and(
              eq(projectMilestones.projectId, projectId),
              gte(projectMilestones.completedDate, currentStart),
              lte(projectMilestones.completedDate, currentEnd)
            )
          );

        let onTimeCount = 0;
        let lateCount = 0;

        milestonesInPeriod.forEach((milestone) => {
          if (milestone.completedDate && milestone.dueDate) {
            const completedDate = new Date(milestone.completedDate);
            const dueDate = new Date(milestone.dueDate);

            if (completedDate <= dueDate) {
              onTimeCount++;
            } else {
              lateCount++;
            }
          }
        });

        const total = onTimeCount + lateCount;
        const complianceRate = total > 0 ? (onTimeCount / total) * 100 : 0;

        // Obter marcos vencidos neste período
        const overdueInPeriod = await db
          .select()
          .from(projectMilestones)
          .where(
            and(
              eq(projectMilestones.projectId, projectId),
              lte(projectMilestones.dueDate, currentEnd),
              sql`${projectMilestones.status} != 'completed'`
            )
          );

        trends.push({
          period: `${currentStart.toLocaleDateString('pt-PT')} - ${currentEnd.toLocaleDateString('pt-PT')}`,
          complianceRate,
          overdueCount: overdueInPeriod.length,
          lateCount,
          onTimeCount,
        });

        currentStart = new Date(currentEnd);
      }

      return trends;
    } catch (error) {
      console.error('[ComplianceService] Erro ao obter tendências de conformidade:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas gerais de conformidade
   */
  static async getComplianceStats(): Promise<ComplianceStats> {
    try {
      const db = await initDb();

      const allProjects = await db.select().from(projects);
      const allMilestones = await db.select().from(projectMilestones);

      const now = new Date();
      let totalOnTime = 0;
      let totalLate = 0;
      let totalOverdue = 0;
      let projectsAtRisk = 0;
      let projectsExcellent = 0;

      const complianceRates: number[] = [];

      for (const project of allProjects) {
        const metrics = await this.getProjectCompliance(project.id);
        if (metrics) {
          complianceRates.push(metrics.complianceRate);

          if (metrics.status === 'excellent') {
            projectsExcellent++;
          } else if (metrics.status === 'critical' || metrics.status === 'warning') {
            projectsAtRisk++;
          }

          totalOnTime += metrics.completedOnTime;
          totalLate += metrics.completedLate;
          totalOverdue += metrics.overdue;
        }
      }

      const averageCompliance = complianceRates.length > 0
        ? complianceRates.reduce((a, b) => a + b, 0) / complianceRates.length
        : 0;

      return {
        totalProjects: allProjects.length,
        averageCompliance,
        projectsAtRisk,
        projectsExcellent,
        totalMilestones: allMilestones.length,
        totalOverdue,
        totalLate,
        totalOnTime,
      };
    } catch (error) {
      console.error('[ComplianceService] Erro ao obter estatísticas de conformidade:', error);
      return {
        totalProjects: 0,
        averageCompliance: 0,
        projectsAtRisk: 0,
        projectsExcellent: 0,
        totalMilestones: 0,
        totalOverdue: 0,
        totalLate: 0,
        totalOnTime: 0,
      };
    }
  }

  /**
   * Obtém projetos em risco (conformidade baixa)
   */
  static async getProjectsAtRisk(threshold: number = 50): Promise<ComplianceMetrics[]> {
    try {
      const allMetrics = await this.getAllProjectsCompliance();
      return allMetrics.filter((m) => m.complianceRate < threshold);
    } catch (error) {
      console.error('[ComplianceService] Erro ao obter projetos em risco:', error);
      return [];
    }
  }

  /**
   * Obtém distribuição de marcos por status
   */
  static async getMilestoneDistribution(projectId?: string) {
    try {
      const db = await initDb();

      let query = db.select().from(projectMilestones);

      if (projectId) {
        query = query.where(eq(projectMilestones.projectId, projectId)) as any;
      }

      const milestones = await query;

      const distribution = {
        completed: 0,
        pending: 0,
        overdue: 0,
        atRisk: 0,
      };

      const now = new Date();

      milestones.forEach((milestone) => {
        const dueDate = new Date(milestone.dueDate);
        const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (milestone.status === 'completed') {
          distribution.completed++;
        } else if (dueDate < now) {
          distribution.overdue++;
        } else if (daysUntilDue <= 7) {
          distribution.atRisk++;
        } else {
          distribution.pending++;
        }
      });

      return distribution;
    } catch (error) {
      console.error('[ComplianceService] Erro ao obter distribuição de marcos:', error);
      return {
        completed: 0,
        pending: 0,
        overdue: 0,
        atRisk: 0,
      };
    }
  }

  /**
   * Exporta dados de conformidade em formato CSV
   */
  static async exportComplianceCSV(): Promise<string> {
    try {
      const metrics = await this.getAllProjectsCompliance();

      let csv = 'Projeto,Total de Marcos,Concluído no Prazo,Concluído Atrasado,Vencido,Pendente,Taxa de Conformidade (%),Dias Médios Atrasado,Status\n';

      metrics.forEach((m) => {
        csv += `"${m.projectName}",${m.totalMilestones},${m.completedOnTime},${m.completedLate},${m.overdue},${m.pending},${m.complianceRate.toFixed(2)},${m.avgDaysOverdue.toFixed(2)},${m.status}\n`;
      });

      return csv;
    } catch (error) {
      console.error('[ComplianceService] Erro ao exportar CSV:', error);
      return '';
    }
  }
}
