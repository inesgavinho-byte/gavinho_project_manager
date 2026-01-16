import { db } from './db';
import { projectMilestones, projects, projectTeam, escalationRules, escalationHistory } from '../drizzle/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

/**
 * Níveis de escalonamento
 */
export type EscalationLevel = 'manager' | 'director' | 'admin' | 'owner';

/**
 * Interface para regra de escalonamento
 */
export interface EscalationRule {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isActive: boolean;
  escalationLevels: EscalationLevelConfig[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuração de nível de escalonamento
 */
export interface EscalationLevelConfig {
  level: EscalationLevel;
  daysOverdue: number; // Número de dias vencido para disparar este nível
  notifyRoles: string[]; // Papéis a notificar (manager, director, admin)
  message?: string; // Mensagem customizada
}

/**
 * Serviço de escalonamento de marcos vencidos
 */
export class EscalationService {
  /**
   * Verifica marcos vencidos e executa escalonamento se necessário
   */
  static async checkAndEscalateOverdueMillestones(): Promise<void> {
    try {
      // Buscar todos os marcos vencidos
      const now = new Date();
      const overdueMillestones = await db.query.projectMilestones.findMany({
        where: and(
          lte(projectMilestones.dueDate, now),
          eq(projectMilestones.status, 'in_progress')
        ),
      });

      // Processar cada marco vencido
      for (const milestone of overdueMillestones) {
        await this.escalateMilestone(milestone);
      }
    } catch (error) {
      console.error('[Escalation] Erro ao verificar marcos vencidos:', error);
    }
  }

  /**
   * Escalona um marco vencido
   */
  private static async escalateMilestone(milestone: any): Promise<void> {
    try {
      // Calcular dias vencido
      const now = new Date();
      const dueDate = new Date(milestone.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Buscar regras de escalonamento do projeto
      const rules = await db.query.escalationRules.findMany({
        where: and(
          eq(escalationRules.projectId, milestone.projectId),
          eq(escalationRules.isActive, true)
        ),
      });

      // Processar cada regra
      for (const rule of rules) {
        await this.processEscalationRule(rule, milestone, daysOverdue);
      }
    } catch (error) {
      console.error('[Escalation] Erro ao escalar marco:', error);
    }
  }

  /**
   * Processa uma regra de escalonamento
   */
  private static async processEscalationRule(
    rule: any,
    milestone: any,
    daysOverdue: number
  ): Promise<void> {
    try {
      const escalationLevels = rule.escalationLevels || [];

      // Encontrar o nível de escalonamento apropriado
      for (const levelConfig of escalationLevels) {
        if (daysOverdue >= levelConfig.daysOverdue) {
          // Verificar se já foi notificado neste nível
          const existingNotification = await db.query.escalationHistory.findFirst({
            where: and(
              eq(escalationHistory.milestoneId, milestone.id),
              eq(escalationHistory.level, levelConfig.level),
              gte(escalationHistory.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Últimas 24h
            ),
          });

          if (!existingNotification) {
            // Executar notificação
            await this.notifyEscalationLevel(milestone, levelConfig, daysOverdue);

            // Registrar no histórico
            await db.insert(escalationHistory).values({
              id: `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ruleId: rule.id,
              milestoneId: milestone.id,
              level: levelConfig.level,
              daysOverdue,
              createdAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('[Escalation] Erro ao processar regra de escalonamento:', error);
    }
  }

  /**
   * Notifica o nível de escalonamento apropriado
   */
  private static async notifyEscalationLevel(
    milestone: any,
    levelConfig: EscalationLevelConfig,
    daysOverdue: number
  ): Promise<void> {
    try {
      const message = this.formatEscalationMessage(milestone, levelConfig, daysOverdue);

      switch (levelConfig.level) {
        case 'manager':
          await this.notifyManagers(milestone, message);
          break;
        case 'director':
          await this.notifyDirectors(milestone, message);
          break;
        case 'admin':
          await this.notifyAdmins(milestone, message);
          break;
        case 'owner':
          await this.notifyOwner(milestone, message);
          break;
      }

      console.log(`[Escalation] Notificação enviada - Nível: ${levelConfig.level}, Marco: ${milestone.name}`);
    } catch (error) {
      console.error('[Escalation] Erro ao notificar nível de escalonamento:', error);
      throw error;
    }
  }

  /**
   * Notifica gestores
   */
  private static async notifyManagers(milestone: any, message: string): Promise<void> {
    try {
      // Buscar gestores do projeto
      const managers = await db.query.projectTeam.findMany({
        where: and(
          eq(projectTeam.projectId, milestone.projectId),
          eq(projectTeam.role, 'manager')
        ),
      });

      // Notificar cada gestor
      for (const manager of managers) {
        console.log(`[Escalation] Notificando gestor: ${manager.name}`);
        // Aqui você pode integrar com um sistema de notificações real
      }

      // Notificar proprietário
      await notifyOwner({
        title: `⚠️ Escalonamento: Marco Vencido - Nível Gestor`,
        content: message,
      });
    } catch (error) {
      console.error('[Escalation] Erro ao notificar gestores:', error);
      throw error;
    }
  }

  /**
   * Notifica diretores
   */
  private static async notifyDirectors(milestone: any, message: string): Promise<void> {
    try {
      // Buscar diretores do projeto
      const directors = await db.query.projectTeam.findMany({
        where: and(
          eq(projectTeam.projectId, milestone.projectId),
          eq(projectTeam.role, 'director')
        ),
      });

      // Notificar cada diretor
      for (const director of directors) {
        console.log(`[Escalation] Notificando diretor: ${director.name}`);
      }

      // Notificar proprietário
      await notifyOwner({
        title: `🔴 Escalonamento: Marco Vencido - Nível Diretor`,
        content: message,
      });
    } catch (error) {
      console.error('[Escalation] Erro ao notificar diretores:', error);
      throw error;
    }
  }

  /**
   * Notifica administradores
   */
  private static async notifyAdmins(milestone: any, message: string): Promise<void> {
    try {
      // Buscar administradores
      const admins = await db.query.projectTeam.findMany({
        where: and(
          eq(projectTeam.projectId, milestone.projectId),
          eq(projectTeam.role, 'admin')
        ),
      });

      // Notificar cada admin
      for (const admin of admins) {
        console.log(`[Escalation] Notificando admin: ${admin.name}`);
      }

      // Notificar proprietário
      await notifyOwner({
        title: `🚨 Escalonamento Crítico: Marco Vencido - Nível Admin`,
        content: message,
      });
    } catch (error) {
      console.error('[Escalation] Erro ao notificar administradores:', error);
      throw error;
    }
  }

  /**
   * Notifica proprietário
   */
  private static async notifyOwner(milestone: any, message: string): Promise<void> {
    try {
      await notifyOwner({
        title: `🚨 CRÍTICO: Marco Vencido - Escalonamento Máximo`,
        content: message,
      });
    } catch (error) {
      console.error('[Escalation] Erro ao notificar proprietário:', error);
      throw error;
    }
  }

  /**
   * Formata mensagem de escalonamento
   */
  private static formatEscalationMessage(
    milestone: any,
    levelConfig: EscalationLevelConfig,
    daysOverdue: number
  ): string {
    const dueDate = new Date(milestone.dueDate).toLocaleDateString('pt-PT');
    const levelLabel = this.getLevelLabel(levelConfig.level);

    return `
**Marco em Atraso - Escalonamento ${levelLabel}**

**Marco:** ${milestone.name}
**Projeto:** ${milestone.projectId}
**Data de Vencimento:** ${dueDate}
**Dias em Atraso:** ${daysOverdue} dias
**Status:** ${milestone.status}
**Descrição:** ${milestone.description || 'N/A'}

${levelConfig.message ? `**Mensagem Customizada:** ${levelConfig.message}` : ''}

**Ação Recomendada:**
- Revisar o status do marco
- Atualizar a equipa sobre o atraso
- Tomar medidas para recuperar o cronograma
- Notificar o cliente se aplicável

Escalonamento automático gerado pelo sistema GAVINHO.
    `.trim();
  }

  /**
   * Obtém label do nível
   */
  private static getLevelLabel(level: EscalationLevel): string {
    switch (level) {
      case 'manager':
        return 'Gestor';
      case 'director':
        return 'Diretor';
      case 'admin':
        return 'Administrador';
      case 'owner':
        return 'Proprietário';
      default:
        return 'Desconhecido';
    }
  }

  /**
   * Cria uma regra de escalonamento
   */
  static async createRule(rule: EscalationRule): Promise<EscalationRule> {
    try {
      const now = new Date();
      const newRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...rule,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(escalationRules).values(newRule as any);
      return newRule;
    } catch (error) {
      console.error('[Escalation] Erro ao criar regra:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma regra de escalonamento
   */
  static async updateRule(ruleId: string, updates: Partial<EscalationRule>): Promise<void> {
    try {
      await db.update(escalationRules)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(escalationRules.id, ruleId));
    } catch (error) {
      console.error('[Escalation] Erro ao atualizar regra:', error);
      throw error;
    }
  }

  /**
   * Deleta uma regra de escalonamento
   */
  static async deleteRule(ruleId: string): Promise<void> {
    try {
      await db.delete(escalationRules)
        .where(eq(escalationRules.id, ruleId));
    } catch (error) {
      console.error('[Escalation] Erro ao deletar regra:', error);
      throw error;
    }
  }

  /**
   * Lista regras de escalonamento de um projeto
   */
  static async listRules(projectId: string): Promise<EscalationRule[]> {
    try {
      return await db.query.escalationRules.findMany({
        where: eq(escalationRules.projectId, projectId),
      });
    } catch (error) {
      console.error('[Escalation] Erro ao listar regras:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de escalonamento de um marco
   */
  static async getMilestoneEscalationHistory(milestoneId: string): Promise<any[]> {
    try {
      return await db.query.escalationHistory.findMany({
        where: eq(escalationHistory.milestoneId, milestoneId),
      });
    } catch (error) {
      console.error('[Escalation] Erro ao obter histórico:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de escalonamento
   */
  static async getEscalationStats(projectId: string): Promise<any> {
    try {
      // Contar marcos vencidos
      const now = new Date();
      const overdueCount = await db.query.projectMilestones.findMany({
        where: and(
          eq(projectMilestones.projectId, projectId),
          lte(projectMilestones.dueDate, now),
          eq(projectMilestones.status, 'in_progress')
        ),
      });

      // Contar escalonamentos últimos 30 dias
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentEscalations = await db.query.escalationHistory.findMany({
        where: and(
          gte(escalationHistory.createdAt, thirtyDaysAgo)
        ),
      });

      return {
        overdueCount: overdueCount.length,
        recentEscalations: recentEscalations.length,
        escalationsByLevel: {
          manager: recentEscalations.filter((e: any) => e.level === 'manager').length,
          director: recentEscalations.filter((e: any) => e.level === 'director').length,
          admin: recentEscalations.filter((e: any) => e.level === 'admin').length,
          owner: recentEscalations.filter((e: any) => e.level === 'owner').length,
        },
      };
    } catch (error) {
      console.error('[Escalation] Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}
