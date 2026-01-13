import { outlookSyncService } from './outlookSyncService';
import { db } from '../db';
import { projects } from '../../drizzle/schema';
import { notifyOwner } from '../_core/notification';

interface SyncJob {
  projectId: number;
  interval: number; // em minutos
  lastSync: Date | null;
  isRunning: boolean;
}

class EmailSyncScheduler {
  private syncJobs: Map<number, SyncJob> = new Map();
  private syncIntervals: Map<number, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_INTERVAL = 5; // 5 minutos

  /**
   * Inicia o scheduler de sincronização
   */
  async startScheduler() {
    console.log('[EmailSyncScheduler] Iniciando scheduler de sincronização...');

    try {
      // Buscar todos os projetos ativos
      const activeProjects = await db.select().from(projects).where((p) => p.isActive === 1);

      for (const project of activeProjects) {
        this.scheduleProjectSync(project.id, this.DEFAULT_INTERVAL);
      }

      console.log(`[EmailSyncScheduler] Scheduler iniciado para ${activeProjects.length} projetos`);
    } catch (error) {
      console.error('[EmailSyncScheduler] Erro ao iniciar scheduler:', error);
      await notifyOwner({
        title: 'Erro no Scheduler de Emails',
        content: `Falha ao iniciar scheduler de sincronização de emails: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
    }
  }

  /**
   * Agenda sincronização para um projeto específico
   */
  scheduleProjectSync(projectId: number, intervalMinutes: number = this.DEFAULT_INTERVAL) {
    // Limpar job anterior se existir
    if (this.syncIntervals.has(projectId)) {
      clearInterval(this.syncIntervals.get(projectId));
    }

    // Criar novo job
    const job: SyncJob = {
      projectId,
      interval: intervalMinutes,
      lastSync: null,
      isRunning: false,
    };

    this.syncJobs.set(projectId, job);

    // Executar sincronização imediatamente
    this.syncProject(projectId);

    // Agendar sincronizações periódicas
    const intervalId = setInterval(() => {
      this.syncProject(projectId);
    }, intervalMinutes * 60 * 1000);

    this.syncIntervals.set(projectId, intervalId);

    console.log(
      `[EmailSyncScheduler] Sincronização agendada para projeto ${projectId} a cada ${intervalMinutes} minutos`
    );
  }

  /**
   * Sincroniza emails de um projeto
   */
  private async syncProject(projectId: number) {
    const job = this.syncJobs.get(projectId);
    if (!job) return;

    // Evitar sincronizações simultâneas
    if (job.isRunning) {
      console.log(`[EmailSyncScheduler] Sincronização já em progresso para projeto ${projectId}`);
      return;
    }

    job.isRunning = true;

    try {
      console.log(`[EmailSyncScheduler] Iniciando sincronização para projeto ${projectId}...`);

      const syncedCount = await outlookSyncService.syncEmails(projectId);

      job.lastSync = new Date();

      console.log(`[EmailSyncScheduler] Sincronização concluída para projeto ${projectId}: ${syncedCount} emails`);

      // Notificar se houver novos emails importantes
      if (syncedCount > 0) {
        const criticalEmails = await db
          .select()
          .from(emailTracking)
          .where(
            and(
              eq(emailTracking.projectId, projectId),
              gte(emailTracking.confidence, 0.9),
              eq(emailTracking.category, 'order')
            )
          )
          .limit(5);

        if (criticalEmails.length > 0) {
          await notifyOwner({
            title: `${syncedCount} novos emails sincronizados`,
            content: `Projeto ${projectId}: ${syncedCount} emails foram sincronizados. ${criticalEmails.length} pedidos de alta confiança detectados.`,
          });
        }
      }
    } catch (error) {
      console.error(`[EmailSyncScheduler] Erro ao sincronizar projeto ${projectId}:`, error);

      await notifyOwner({
        title: `Erro na sincronização de emails (Projeto ${projectId})`,
        content: `Falha ao sincronizar emails: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Para a sincronização de um projeto
   */
  stopProjectSync(projectId: number) {
    const intervalId = this.syncIntervals.get(projectId);
    if (intervalId) {
      clearInterval(intervalId);
      this.syncIntervals.delete(projectId);
      this.syncJobs.delete(projectId);
      console.log(`[EmailSyncScheduler] Sincronização parada para projeto ${projectId}`);
    }
  }

  /**
   * Para o scheduler completamente
   */
  stopScheduler() {
    console.log('[EmailSyncScheduler] Parando scheduler...');

    for (const [projectId] of this.syncIntervals) {
      this.stopProjectSync(projectId);
    }

    console.log('[EmailSyncScheduler] Scheduler parado');
  }

  /**
   * Retorna status do scheduler
   */
  getStatus() {
    const jobs = Array.from(this.syncJobs.values()).map((job) => ({
      projectId: job.projectId,
      interval: job.interval,
      lastSync: job.lastSync,
      isRunning: job.isRunning,
    }));

    return {
      isActive: this.syncIntervals.size > 0,
      jobsCount: jobs.length,
      jobs,
    };
  }

  /**
   * Retorna status de um projeto específico
   */
  getProjectStatus(projectId: number) {
    const job = this.syncJobs.get(projectId);
    if (!job) {
      return null;
    }

    return {
      projectId: job.projectId,
      interval: job.interval,
      lastSync: job.lastSync,
      isRunning: job.isRunning,
      nextSync: job.lastSync
        ? new Date(job.lastSync.getTime() + job.interval * 60 * 1000)
        : new Date(),
    };
  }
}

// Importar necessário
import { emailTracking } from '../../drizzle/schema';
import { and, eq, gte } from 'drizzle-orm';

// Instância global do scheduler
export const emailSyncScheduler = new EmailSyncScheduler();

// Iniciar scheduler quando o servidor inicia
export function initializeEmailSyncScheduler() {
  emailSyncScheduler.startScheduler();

  // Parar scheduler ao encerrar o processo
  process.on('SIGTERM', () => {
    console.log('[EmailSyncScheduler] SIGTERM recebido, parando scheduler...');
    emailSyncScheduler.stopScheduler();
  });

  process.on('SIGINT', () => {
    console.log('[EmailSyncScheduler] SIGINT recebido, parando scheduler...');
    emailSyncScheduler.stopScheduler();
  });
}
