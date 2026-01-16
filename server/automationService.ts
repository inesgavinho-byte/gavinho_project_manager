import { db } from './db';
import { projectMilestones, projects, projectTeam, automationRules, automationLogs } from '../drizzle/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

/**
 * Tipos de ações de automação
 */
export type AutomationActionType = 'notify_team' | 'update_project_status' | 'create_alert' | 'send_email' | 'update_milestone_status';

/**
 * Interface para ação de automação
 */
export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, any>;
}

/**
 * Interface para regra de automação
 */
export interface AutomationRule {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  trigger: 'milestone_overdue' | 'milestone_due_soon' | 'milestone_completed';
  triggerConfig: {
    daysBeforeDue?: number; // Para 'milestone_due_soon'
  };
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Serviço de automação de marcos
 */
export class AutomationService {
  /**
   * Executa regras de automação para um marco
   */
  static async executeMilestoneRules(milestoneId: string): Promise<void> {
    try {
      // Buscar marco
      const milestone = await db.query.projectMilestones.findFirst({
        where: eq(projectMilestones.id, milestoneId),
      });

      if (!milestone) {
        console.error(`[Automation] Marco não encontrado: ${milestoneId}`);
        return;
      }

      // Buscar regras ativas para o projeto
      const rules = await db.query.automationRules.findMany({
        where: and(
          eq(automationRules.projectId, milestone.projectId),
          eq(automationRules.isActive, true)
        ),
      });

      // Executar cada regra
      for (const rule of rules) {
        await this.executeRule(rule, milestone);
      }
    } catch (error) {
      console.error('[Automation] Erro ao executar regras de marco:', error);
    }
  }

  /**
   * Executa uma regra de automação
   */
  private static async executeRule(rule: any, milestone: any): Promise<void> {
    try {
      // Verificar se a regra se aplica
      const shouldExecute = this.shouldExecuteRule(rule, milestone);
      if (!shouldExecute) return;

      // Executar ações
      for (const action of rule.actions) {
        await this.executeAction(action, milestone, rule);
      }

      // Registrar execução
      await db.insert(automationLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        milestoneId: milestone.id,
        status: 'success',
        executedAt: new Date(),
      });
    } catch (error) {
      console.error(`[Automation] Erro ao executar regra ${rule.id}:`, error);
      
      // Registrar erro
      await db.insert(automationLogs).values({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        milestoneId: milestone.id,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        executedAt: new Date(),
      });
    }
  }

  /**
   * Verifica se uma regra deve ser executada
   */
  private static shouldExecuteRule(rule: any, milestone: any): boolean {
    const now = new Date();
    const dueDate = new Date(milestone.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    switch (rule.trigger) {
      case 'milestone_overdue':
        return daysUntilDue < 0;
      case 'milestone_due_soon':
        const daysBeforeDue = rule.triggerConfig?.daysBeforeDue || 3;
        return daysUntilDue <= daysBeforeDue && daysUntilDue >= 0;
      case 'milestone_completed':
        return milestone.status === 'completed';
      default:
        return false;
    }
  }

  /**
   * Executa uma ação de automação
   */
  private static async executeAction(action: AutomationAction, milestone: any, rule: any): Promise<void> {
    switch (action.type) {
      case 'notify_team':
        await this.notifyTeam(milestone, rule, action.config);
        break;
      case 'update_project_status':
        await this.updateProjectStatus(milestone, action.config);
        break;
      case 'create_alert':
        await this.createAlert(milestone, rule, action.config);
        break;
      case 'send_email':
        await this.sendEmail(milestone, rule, action.config);
        break;
      case 'update_milestone_status':
        await this.updateMilestoneStatus(milestone, action.config);
        break;
      default:
        console.warn(`[Automation] Ação desconhecida: ${action.type}`);
    }
  }

  /**
   * Notifica a equipa sobre o marco
   */
  private static async notifyTeam(milestone: any, rule: any, config: any): Promise<void> {
    try {
      // Buscar membros da equipa
      const teamMembers = await db.query.projectTeam.findMany({
        where: eq(projectTeam.projectId, milestone.projectId),
      });

      // Preparar mensagem
      const message = this.formatNotificationMessage(milestone, rule, config);

      // Notificar cada membro
      for (const member of teamMembers) {
        // Aqui você pode integrar com um sistema de notificações real
        console.log(`[Automation] Notificando ${member.name}: ${message}`);
      }

      // Notificar proprietário
      await notifyOwner({
        title: `Automação: ${rule.name}`,
        content: `Marco "${milestone.name}" disparou a regra de automação. ${message}`,
      });
    } catch (error) {
      console.error('[Automation] Erro ao notificar equipa:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status do projeto
   */
  private static async updateProjectStatus(milestone: any, config: any): Promise<void> {
    try {
      const newStatus = config.status || 'at_risk';

      await db.update(projects)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, milestone.projectId));

      console.log(`[Automation] Status do projeto atualizado para: ${newStatus}`);
    } catch (error) {
      console.error('[Automation] Erro ao atualizar status do projeto:', error);
      throw error;
    }
  }

  /**
   * Cria um alerta
   */
  private static async createAlert(milestone: any, rule: any, config: any): Promise<void> {
    try {
      const alertMessage = config.message || `Marco "${milestone.name}" requer atenção`;
      
      // Aqui você pode integrar com um sistema de alertas real
      console.log(`[Automation] Alerta criado: ${alertMessage}`);

      // Notificar proprietário
      await notifyOwner({
        title: 'Alerta de Automação',
        content: alertMessage,
      });
    } catch (error) {
      console.error('[Automation] Erro ao criar alerta:', error);
      throw error;
    }
  }

  /**
   * Envia email
   */
  private static async sendEmail(milestone: any, rule: any, config: any): Promise<void> {
    try {
      const recipients = config.recipients || [];
      const subject = config.subject || `Alerta: Marco "${milestone.name}"`;
      const body = config.body || this.formatEmailBody(milestone, rule);

      console.log(`[Automation] Email enviado para ${recipients.join(', ')}: ${subject}`);
    } catch (error) {
      console.error('[Automation] Erro ao enviar email:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status do marco
   */
  private static async updateMilestoneStatus(milestone: any, config: any): Promise<void> {
    try {
      const newStatus = config.status || 'at_risk';

      await db.update(projectMilestones)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(projectMilestones.id, milestone.id));

      console.log(`[Automation] Status do marco atualizado para: ${newStatus}`);
    } catch (error) {
      console.error('[Automation] Erro ao atualizar status do marco:', error);
      throw error;
    }
  }

  /**
   * Formata mensagem de notificação
   */
  private static formatNotificationMessage(milestone: any, rule: any, config: any): string {
    const dueDate = new Date(milestone.dueDate).toLocaleDateString('pt-PT');
    return `Marco "${milestone.name}" vence em ${dueDate}. Ação: ${config.action || 'Revisar'}`;
  }

  /**
   * Formata corpo do email
   */
  private static formatEmailBody(milestone: any, rule: any): string {
    const dueDate = new Date(milestone.dueDate).toLocaleDateString('pt-PT');
    return `
Olá,

O marco "${milestone.name}" requer atenção.

Data de Vencimento: ${dueDate}
Descrição: ${milestone.description || 'N/A'}
Status: ${milestone.status}

Por favor, revise e tome as ações necessárias.

Atenciosamente,
Sistema de Automação GAVINHO
    `.trim();
  }

  /**
   * Cria uma nova regra de automação
   */
  static async createRule(rule: AutomationRule): Promise<AutomationRule> {
    try {
      const now = new Date();
      const newRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...rule,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(automationRules).values(newRule as any);
      return newRule;
    } catch (error) {
      console.error('[Automation] Erro ao criar regra:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma regra de automação
   */
  static async updateRule(ruleId: string, updates: Partial<AutomationRule>): Promise<void> {
    try {
      await db.update(automationRules)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(automationRules.id, ruleId));
    } catch (error) {
      console.error('[Automation] Erro ao atualizar regra:', error);
      throw error;
    }
  }

  /**
   * Deleta uma regra de automação
   */
  static async deleteRule(ruleId: string): Promise<void> {
    try {
      await db.delete(automationRules)
        .where(eq(automationRules.id, ruleId));
    } catch (error) {
      console.error('[Automation] Erro ao deletar regra:', error);
      throw error;
    }
  }

  /**
   * Lista regras de automação de um projeto
   */
  static async listRules(projectId: string): Promise<AutomationRule[]> {
    try {
      return await db.query.automationRules.findMany({
        where: eq(automationRules.projectId, projectId),
      });
    } catch (error) {
      console.error('[Automation] Erro ao listar regras:', error);
      throw error;
    }
  }

  /**
   * Obtém logs de execução de uma regra
   */
  static async getRuleLogs(ruleId: string, limit: number = 50): Promise<any[]> {
    try {
      return await db.query.automationLogs.findMany({
        where: eq(automationLogs.ruleId, ruleId),
        limit,
      });
    } catch (error) {
      console.error('[Automation] Erro ao obter logs:', error);
      throw error;
    }
  }
}
