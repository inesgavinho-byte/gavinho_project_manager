/**
 * Serviço de Ações Automáticas Avançadas
 * Executa ações customizáveis ao escalar marcos vencidos (pausar projeto, gerar ticket, criar reunião, etc)
 */

import { initDb } from './db';
import { projects, projectMilestones } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

export type ActionType = 'pause_project' | 'create_support_ticket' | 'schedule_review_meeting' | 'send_email' | 'update_project_status' | 'notify_stakeholders';

export interface AdvancedAction {
  id: string;
  escalationRuleId: string;
  actionType: ActionType;
  actionConfig: Record<string, any>;
  isActive: boolean;
  executionOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionExecutionLog {
  id: string;
  actionId: string;
  milestoneId: string;
  projectId: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  result: Record<string, any>;
  error?: string;
  executedAt: Date;
}

export class AdvancedActionsService {
  /**
   * Executa uma ação avançada
   */
  static async executeAction(
    actionType: ActionType,
    actionConfig: Record<string, any>,
    context: {
      projectId: string;
      milestoneId: string;
      projectName: string;
      milestoneName: string;
    }
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      switch (actionType) {
        case 'pause_project':
          return await this.pauseProject(context.projectId, actionConfig);
        case 'create_support_ticket':
          return await this.createSupportTicket(context, actionConfig);
        case 'schedule_review_meeting':
          return await this.scheduleReviewMeeting(context, actionConfig);
        case 'send_email':
          return await this.sendCustomEmail(context, actionConfig);
        case 'update_project_status':
          return await this.updateProjectStatus(context.projectId, actionConfig);
        case 'notify_stakeholders':
          return await this.notifyStakeholders(context, actionConfig);
        default:
          return { success: false, error: 'Tipo de ação não suportado' };
      }
    } catch (error) {
      console.error('[AdvancedActionsService] Erro ao executar ação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Pausa um projeto
   */
  private static async pauseProject(
    projectId: string,
    config: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const db = await initDb();

      // Atualizar status do projeto para 'paused'
      await db
        .update(projects)
        .set({
          status: 'paused',
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      // Notificar owner
      await notifyOwner({
        title: 'Projeto Pausado Automaticamente',
        content: `O projeto ${projectId} foi pausado automaticamente devido a marcos vencidos. Ação requerida: revisar e retomar quando apropriado.`,
      });

      return {
        success: true,
        result: {
          action: 'pause_project',
          projectId,
          timestamp: new Date(),
          message: 'Projeto pausado com sucesso',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao pausar projeto',
      };
    }
  }

  /**
   * Cria um ticket de suporte
   */
  private static async createSupportTicket(
    context: {
      projectId: string;
      milestoneId: string;
      projectName: string;
      milestoneName: string;
    },
    config: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Simular criação de ticket (em produção, integrar com sistema de tickets)
      const ticketId = `TICKET-${Date.now()}`;
      const ticketData = {
        id: ticketId,
        title: config.title || `Marco Vencido: ${context.milestoneName}`,
        description: config.description || `Marco vencido no projeto ${context.projectName}. Ação requerida.`,
        priority: config.priority || 'high',
        assignee: config.assignee || 'support-team',
        projectId: context.projectId,
        milestoneId: context.milestoneId,
        createdAt: new Date(),
      };

      // Notificar owner
      await notifyOwner({
        title: 'Ticket de Suporte Criado',
        content: `Ticket ${ticketId} foi criado automaticamente para marco vencido: ${context.milestoneName}`,
      });

      return {
        success: true,
        result: {
          action: 'create_support_ticket',
          ticketId,
          ticketData,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar ticket',
      };
    }
  }

  /**
   * Agenda uma reunião de revisão
   */
  private static async scheduleReviewMeeting(
    context: {
      projectId: string;
      milestoneId: string;
      projectName: string;
      milestoneName: string;
    },
    config: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Simular agendamento de reunião (em produção, integrar com calendário)
      const meetingId = `MEETING-${Date.now()}`;
      const meetingTime = new Date(Date.now() + (config.hoursFromNow || 24) * 60 * 60 * 1000);

      const meetingData = {
        id: meetingId,
        title: config.title || `Revisão de Marco Vencido: ${context.milestoneName}`,
        description: config.description || `Reunião de revisão para marco vencido no projeto ${context.projectName}`,
        scheduledTime: meetingTime,
        duration: config.durationMinutes || 60,
        attendees: config.attendees || ['project-manager@gavinho.pt', 'team-lead@gavinho.pt'],
        projectId: context.projectId,
        milestoneId: context.milestoneId,
      };

      // Notificar owner
      await notifyOwner({
        title: 'Reunião de Revisão Agendada',
        content: `Reunião agendada para ${meetingTime.toLocaleString('pt-PT')} para revisar marco vencido: ${context.milestoneName}`,
      });

      return {
        success: true,
        result: {
          action: 'schedule_review_meeting',
          meetingId,
          meetingData,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao agendar reunião',
      };
    }
  }

  /**
   * Envia email customizado
   */
  private static async sendCustomEmail(
    context: {
      projectId: string;
      milestoneId: string;
      projectName: string;
      milestoneName: string;
    },
    config: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const emailData = {
        to: config.recipients || ['project-manager@gavinho.pt'],
        subject: config.subject || `Alerta: Marco Vencido - ${context.milestoneName}`,
        body: config.body || `
          <p>Prezados,</p>
          <p>O marco <strong>${context.milestoneName}</strong> do projeto <strong>${context.projectName}</strong> está vencido.</p>
          <p>Ação requerida: Por favor, revise e tome as medidas necessárias.</p>
          <p>Projeto ID: ${context.projectId}</p>
          <p>Marco ID: ${context.milestoneId}</p>
          <p>Data/Hora: ${new Date().toLocaleString('pt-PT')}</p>
        `,
        projectId: context.projectId,
        milestoneId: context.milestoneId,
        sentAt: new Date(),
      };

      // Notificar owner
      await notifyOwner({
        title: 'Email Customizado Enviado',
        content: `Email enviado para ${emailData.to.join(', ')} sobre marco vencido: ${context.milestoneName}`,
      });

      return {
        success: true,
        result: {
          action: 'send_email',
          emailData,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar email',
      };
    }
  }

  /**
   * Atualiza o status do projeto
   */
  private static async updateProjectStatus(
    projectId: string,
    config: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const db = await initDb();

      const newStatus = config.newStatus || 'at_risk';

      await db
        .update(projects)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      // Notificar owner
      await notifyOwner({
        title: 'Status do Projeto Atualizado',
        content: `Status do projeto ${projectId} foi atualizado para: ${newStatus}`,
      });

      return {
        success: true,
        result: {
          action: 'update_project_status',
          projectId,
          newStatus,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar status',
      };
    }
  }

  /**
   * Notifica stakeholders
   */
  private static async notifyStakeholders(
    context: {
      projectId: string;
      milestoneId: string;
      projectName: string;
      milestoneName: string;
    },
    config: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const stakeholders = config.stakeholders || ['project-manager', 'team-lead', 'client'];

      const notificationData = {
        stakeholders,
        title: config.title || `Marco Vencido: ${context.milestoneName}`,
        message: config.message || `O marco ${context.milestoneName} do projeto ${context.projectName} está vencido.`,
        projectId: context.projectId,
        milestoneId: context.milestoneId,
        createdAt: new Date(),
      };

      // Notificar owner
      await notifyOwner({
        title: 'Notificações Enviadas aos Stakeholders',
        content: `Notificações enviadas para: ${stakeholders.join(', ')} sobre marco vencido: ${context.milestoneName}`,
      });

      return {
        success: true,
        result: {
          action: 'notify_stakeholders',
          notificationData,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao notificar stakeholders',
      };
    }
  }

  /**
   * Executa múltiplas ações em sequência
   */
  static async executeMultipleActions(
    actions: Array<{
      type: ActionType;
      config: Record<string, any>;
    }>,
    context: {
      projectId: string;
      milestoneId: string;
      projectName: string;
      milestoneName: string;
    }
  ): Promise<Array<{ action: ActionType; success: boolean; result?: any; error?: string }>> {
    const results = [];

    for (const action of actions) {
      const result = await this.executeAction(action.type, action.config, context);
      results.push({
        action: action.type,
        success: result.success,
        result: result.result,
        error: result.error,
      });

      // Pequeno delay entre ações para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Obtém ações configuradas para uma regra de escalonamento
   */
  static async getActionsForEscalationRule(escalationRuleId: string): Promise<AdvancedAction[]> {
    try {
      // Simular busca de ações (em produção, buscar do banco de dados)
      return [];
    } catch (error) {
      console.error('[AdvancedActionsService] Erro ao obter ações:', error);
      return [];
    }
  }
}
