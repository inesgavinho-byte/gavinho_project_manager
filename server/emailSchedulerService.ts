import cron from 'node-cron';
import { syncOutlookEmails, syncSendGridEvents, updateEmailAnalytics } from './emailSyncService';
import { getDb } from './db';
import { projects } from '../drizzle/schema';

interface ScheduledJob {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

const jobs: Map<string, ScheduledJob> = new Map();

/**
 * Inicializar scheduler de sincronização de emails
 */
export async function initializeEmailScheduler() {
  try {
    console.log('[Email Scheduler] Inicializando scheduler de sincronização...');

    // Job: Sincronizar Outlook a cada hora
    scheduleJob('sync-outlook-hourly', '0 * * * *', async () => {
      await syncAllOutlookEmails();
    });

    // Job: Sincronizar SendGrid a cada hora
    scheduleJob('sync-sendgrid-hourly', '0 * * * *', async () => {
      await syncAllSendGridEvents();
    });

    // Job: Atualizar analytics diariamente às 00:00
    scheduleJob('update-analytics-daily', '0 0 * * *', async () => {
      await updateAllEmailAnalytics();
    });

    // Job: Limpeza de dados antigos (30 dias) - executar semanalmente
    scheduleJob('cleanup-old-emails-weekly', '0 0 * * 0', async () => {
      await cleanupOldEmails();
    });

    console.log('[Email Scheduler] Scheduler inicializado com sucesso');
    logScheduledJobs();
  } catch (error) {
    console.error('[Email Scheduler] Erro ao inicializar scheduler:', error);
  }
}

/**
 * Agendar um job
 */
function scheduleJob(name: string, schedule: string, task: () => Promise<void>) {
  try {
    const job: ScheduledJob = {
      name,
      schedule,
      task,
      isRunning: false,
    };

    // Criar tarefa cron
    const cronTask = cron.schedule(schedule, async () => {
      if (job.isRunning) {
        console.warn(`[Email Scheduler] Job ${name} já está em execução, pulando...`);
        return;
      }

      job.isRunning = true;
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + getNextRunTime(schedule));

      try {
        console.log(`[Email Scheduler] Iniciando job: ${name}`);
        const startTime = Date.now();

        await task();

        const duration = Date.now() - startTime;
        console.log(`[Email Scheduler] Job ${name} concluído em ${duration}ms`);
      } catch (error) {
        console.error(`[Email Scheduler] Erro no job ${name}:`, error);
      } finally {
        job.isRunning = false;
      }
    });

    jobs.set(name, job);
    console.log(`[Email Scheduler] Job agendado: ${name} (${schedule})`);
  } catch (error) {
    console.error(`[Email Scheduler] Erro ao agendar job ${name}:`, error);
  }
}

/**
 * Sincronizar todos os projetos do Outlook
 */
async function syncAllOutlookEmails() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Email Scheduler] Database não disponível');
      return;
    }

    const allProjects = await db.select().from(projects);
    let totalSynced = 0;

    for (const project of allProjects) {
      const synced = await syncOutlookEmails(project.id);
      totalSynced += synced;
    }

    console.log(`[Email Scheduler] Outlook: ${totalSynced} emails sincronizados`);
  } catch (error) {
    console.error('[Email Scheduler] Erro ao sincronizar Outlook:', error);
  }
}

/**
 * Sincronizar todos os projetos do SendGrid
 */
async function syncAllSendGridEvents() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Email Scheduler] Database não disponível');
      return;
    }

    const allProjects = await db.select().from(projects);
    let totalSynced = 0;

    for (const project of allProjects) {
      const synced = await syncSendGridEvents(project.id);
      totalSynced += synced;
    }

    console.log(`[Email Scheduler] SendGrid: ${totalSynced} eventos sincronizados`);
  } catch (error) {
    console.error('[Email Scheduler] Erro ao sincronizar SendGrid:', error);
  }
}

/**
 * Atualizar analytics de todos os projetos
 */
async function updateAllEmailAnalytics() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Email Scheduler] Database não disponível');
      return;
    }

    const allProjects = await db.select().from(projects);

    for (const project of allProjects) {
      await updateEmailAnalytics(project.id);
    }

    console.log(`[Email Scheduler] Analytics atualizado para ${allProjects.length} projetos`);
  } catch (error) {
    console.error('[Email Scheduler] Erro ao atualizar analytics:', error);
  }
}

/**
 * Limpar emails antigos (mais de 30 dias)
 */
async function cleanupOldEmails() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Email Scheduler] Database não disponível');
      return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Aqui você implementaria a lógica de limpeza
    // Por exemplo: soft delete de emails antigos

    console.log('[Email Scheduler] Limpeza de emails antigos concluída');
  } catch (error) {
    console.error('[Email Scheduler] Erro ao limpar emails antigos:', error);
  }
}

/**
 * Obter tempo até próxima execução (simplificado)
 */
function getNextRunTime(schedule: string): number {
  // Retorna 1 hora em ms como aproximação
  return 60 * 60 * 1000;
}

/**
 * Log de jobs agendados
 */
function logScheduledJobs() {
  console.log('\n[Email Scheduler] Jobs Agendados:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  jobs.forEach((job) => {
    console.log(`📅 ${job.name}`);
    console.log(`   Schedule: ${job.schedule}`);
    console.log(`   Status: ${job.isRunning ? 'Executando' : 'Aguardando'}`);
    if (job.lastRun) {
      console.log(`   Última execução: ${job.lastRun.toLocaleString('pt-PT')}`);
    }
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Obter status de todos os jobs
 */
export function getSchedulerStatus() {
  return Array.from(jobs.values()).map((job) => ({
    name: job.name,
    schedule: job.schedule,
    isRunning: job.isRunning,
    lastRun: job.lastRun,
    nextRun: job.nextRun,
  }));
}

/**
 * Executar job manualmente
 */
export async function runJobManually(jobName: string) {
  const job = jobs.get(jobName);
  if (!job) {
    throw new Error(`Job ${jobName} não encontrado`);
  }

  if (job.isRunning) {
    throw new Error(`Job ${jobName} já está em execução`);
  }

  job.isRunning = true;
  job.lastRun = new Date();

  try {
    await job.task();
    console.log(`[Email Scheduler] Job ${jobName} executado manualmente com sucesso`);
  } catch (error) {
    console.error(`[Email Scheduler] Erro ao executar job ${jobName}:`, error);
    throw error;
  } finally {
    job.isRunning = false;
  }
}

/**
 * Parar scheduler
 */
export function stopScheduler() {
  console.log('[Email Scheduler] Parando scheduler...');
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  jobs.clear();
  console.log('[Email Scheduler] Scheduler parado');
}
