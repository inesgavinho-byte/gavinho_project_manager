/**
 * Serviço de Auditoria e Rastreamento de Ações
 * Registra e rastreia todas as ações executadas para auditoria completa
 */

import { initDb } from './db';

export interface AuditLog {
  id: string;
  actionType: string;
  actionName: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  userId?: string;
  projectId?: string;
  milestoneId?: string;
  config: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  duration: number; // em ms
  executedAt: Date;
  completedAt?: Date;
}

export interface AuditStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  successRate: number;
  averageDuration: number;
  actionsByType: Record<string, number>;
  actionsByStatus: Record<string, number>;
  recentActions: AuditLog[];
}

export class AuditService {
  private static logs: AuditLog[] = [];

  /**
   * Registra uma ação na auditoria
   */
  static async logAction(action: Omit<AuditLog, 'id' | 'executedAt'>): Promise<AuditLog> {
    const auditLog: AuditLog = {
      ...action,
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executedAt: new Date(),
    };

    this.logs.push(auditLog);

    // Limitar a memória mantendo apenas os últimos 10000 registos
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    console.log('[AuditService] Ação registada:', {
      id: auditLog.id,
      type: auditLog.actionType,
      status: auditLog.status,
    });

    return auditLog;
  }

  /**
   * Atualiza o status de uma ação
   */
  static async updateActionStatus(
    auditId: string,
    status: 'executing' | 'success' | 'failed',
    result?: Record<string, any>,
    error?: string
  ): Promise<AuditLog | null> {
    const log = this.logs.find((l) => l.id === auditId);
    if (!log) {
      console.warn('[AuditService] Auditoria não encontrada:', auditId);
      return null;
    }

    log.status = status;
    log.completedAt = new Date();
    log.duration = log.completedAt.getTime() - log.executedAt.getTime();

    if (result) {
      log.result = result;
    }

    if (error) {
      log.error = error;
    }

    console.log('[AuditService] Status atualizado:', {
      id: auditId,
      status,
      duration: log.duration,
    });

    return log;
  }

  /**
   * Obtém todas as auditorias com filtros opcionais
   */
  static async getAuditLogs(filters?: {
    actionType?: string;
    status?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let results = [...this.logs];

    if (filters?.actionType) {
      results = results.filter((l) => l.actionType === filters.actionType);
    }

    if (filters?.status) {
      results = results.filter((l) => l.status === filters.status);
    }

    if (filters?.projectId) {
      results = results.filter((l) => l.projectId === filters.projectId);
    }

    if (filters?.startDate) {
      results = results.filter((l) => l.executedAt >= filters.startDate!);
    }

    if (filters?.endDate) {
      results = results.filter((l) => l.executedAt <= filters.endDate!);
    }

    // Ordenar por data descendente
    results.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

    // Aplicar paginação
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * Obtém estatísticas de auditoria
   */
  static async getAuditStats(filters?: {
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditStats> {
    let logs = [...this.logs];

    if (filters?.projectId) {
      logs = logs.filter((l) => l.projectId === filters.projectId);
    }

    if (filters?.startDate) {
      logs = logs.filter((l) => l.executedAt >= filters.startDate!);
    }

    if (filters?.endDate) {
      logs = logs.filter((l) => l.executedAt <= filters.endDate!);
    }

    const totalActions = logs.length;
    const successfulActions = logs.filter((l) => l.status === 'success').length;
    const failedActions = logs.filter((l) => l.status === 'failed').length;
    const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

    const totalDuration = logs.reduce((sum, l) => sum + l.duration, 0);
    const averageDuration = totalActions > 0 ? totalDuration / totalActions : 0;

    // Agrupar por tipo de ação
    const actionsByType: Record<string, number> = {};
    logs.forEach((l) => {
      actionsByType[l.actionType] = (actionsByType[l.actionType] || 0) + 1;
    });

    // Agrupar por status
    const actionsByStatus: Record<string, number> = {
      success: successfulActions,
      failed: failedActions,
      pending: logs.filter((l) => l.status === 'pending').length,
      executing: logs.filter((l) => l.status === 'executing').length,
    };

    // Últimas 10 ações
    const recentActions = logs.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime()).slice(0, 10);

    return {
      totalActions,
      successfulActions,
      failedActions,
      successRate,
      averageDuration,
      actionsByType,
      actionsByStatus,
      recentActions,
    };
  }

  /**
   * Obtém auditoria por ID
   */
  static async getAuditById(auditId: string): Promise<AuditLog | null> {
    return this.logs.find((l) => l.id === auditId) || null;
  }

  /**
   * Obtém auditorias por projeto
   */
  static async getProjectAudits(projectId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.logs
      .filter((l) => l.projectId === projectId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Obtém auditorias por marco
   */
  static async getMilestoneAudits(milestoneId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.logs
      .filter((l) => l.milestoneId === milestoneId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Exporta auditorias em formato CSV
   */
  static async exportToCSV(filters?: {
    actionType?: string;
    status?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    const logs = await this.getAuditLogs({ ...filters, limit: 10000 });

    const headers = ['ID', 'Tipo de Ação', 'Nome da Ação', 'Status', 'Projeto', 'Marco', 'Duração (ms)', 'Executado em', 'Completado em', 'Erro'];

    const rows = logs.map((log) => [
      log.id,
      log.actionType,
      log.actionName,
      log.status,
      log.projectId || '-',
      log.milestoneId || '-',
      log.duration,
      log.executedAt.toLocaleString('pt-PT'),
      log.completedAt?.toLocaleString('pt-PT') || '-',
      log.error || '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    return csv;
  }

  /**
   * Limpa auditorias antigas (mais de 90 dias)
   */
  static async cleanOldAudits(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialCount = this.logs.length;
    this.logs = this.logs.filter((l) => l.executedAt > cutoffDate);
    const removedCount = initialCount - this.logs.length;

    console.log('[AuditService] Auditorias antigas removidas:', removedCount);

    return removedCount;
  }

  /**
   * Obtém resumo de ações por hora
   */
  static async getActionsByHour(hours: number = 24): Promise<Array<{ hour: string; count: number }>> {
    const now = new Date();
    const result: Array<{ hour: string; count: number }> = [];

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(hourStart.getHours() - i);
      hourStart.setMinutes(0, 0, 0);

      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const count = this.logs.filter((l) => l.executedAt >= hourStart && l.executedAt < hourEnd).length;

      result.push({
        hour: hourStart.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        count,
      });
    }

    return result;
  }

  /**
   * Obtém taxa de sucesso por tipo de ação
   */
  static async getSuccessRateByActionType(): Promise<Record<string, { total: number; success: number; rate: number }>> {
    const result: Record<string, { total: number; success: number; rate: number }> = {};

    this.logs.forEach((log) => {
      if (!result[log.actionType]) {
        result[log.actionType] = { total: 0, success: 0, rate: 0 };
      }

      result[log.actionType].total++;
      if (log.status === 'success') {
        result[log.actionType].success++;
      }
    });

    // Calcular taxa
    Object.keys(result).forEach((type) => {
      const data = result[type];
      data.rate = data.total > 0 ? (data.success / data.total) * 100 : 0;
    });

    return result;
  }
}
