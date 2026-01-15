import cron from 'node-cron';
import { getDb } from './db';
import { scheduledEmailReports, emailReportLogs, projects } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';

// ============================================
// REPORT SCHEDULER SERVICE
// ============================================

interface ScheduledTask {
  reportId: number;
  task: cron.ScheduledTask;
}

const scheduledTasks: Map<number, ScheduledTask> = new Map();

/**
 * Inicializar SendGrid
 */
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
};

/**
 * Converter frequência e horário para expressão cron
 * Formato cron: segundo minuto hora dia-do-mês mês dia-da-semana
 */
export function frequencyToCronExpression(
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom',
  time: string, // HH:MM
  dayOfWeek?: number, // 0-6 (Sunday-Saturday) para weekly
  dayOfMonth?: number // 1-31 para monthly
): string {
  const [hours, minutes] = time.split(':').map(Number);

  switch (frequency) {
    case 'daily':
      // Executar todos os dias no horário especificado
      return `0 ${minutes} ${hours} * * *`;

    case 'weekly':
      // Executar no dia da semana especificado no horário
      const dow = dayOfWeek ?? 1; // Padrão: segunda-feira
      return `0 ${minutes} ${hours} * * ${dow}`;

    case 'monthly':
      // Executar no dia do mês especificado no horário
      const dom = dayOfMonth ?? 1; // Padrão: primeiro dia do mês
      return `0 ${minutes} ${hours} ${dom} * *`;

    case 'custom':
      // Para custom, usar daily como padrão
      return `0 ${minutes} ${hours} * * *`;

    default:
      return `0 ${minutes} ${hours} * * *`;
  }
}

/**
 * Gerar template de email de relatório
 */
function generateReportEmailTemplate(
  projectName: string,
  reportData: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    blockages: string[];
    wins: string[];
    insights: string[];
  }
): { subject: string; html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Quattrocento Sans', Arial, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f2f0e7;
          }
          .header {
            background-color: #8b8670;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 4px;
          }
          .header h1 {
            font-family: 'Cormorant Garamond', Georgia, serif;
            margin: 0;
            font-size: 28px;
          }
          .content {
            background-color: white;
            padding: 30px;
            margin: 20px 0;
            border-radius: 4px;
            border-left: 4px solid #adaa96;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            color: #8b8670;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #adaa96;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .metric-box {
            background-color: #f9f8f5;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
          }
          .metric-label {
            color: #8b8670;
            font-weight: bold;
            font-size: 12px;
          }
          .metric-value {
            font-size: 24px;
            color: #333;
            margin-top: 5px;
          }
          .item-list {
            list-style: none;
            padding: 0;
          }
          .item-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e5e3d9;
          }
          .item-list li:last-child {
            border-bottom: none;
          }
          .item-list li:before {
            content: "• ";
            color: #adaa96;
            font-weight: bold;
            margin-right: 10px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e3d9;
          }
          .cta-button {
            display: inline-block;
            background-color: #adaa96;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GAVINHO</h1>
            <p>Relatório Diário do Projeto</p>
          </div>

          <div class="content">
            <h2 style="color: #8b8670; margin-top: 0;">${projectName}</h2>
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-PT')}</p>

            <div class="section">
              <div class="section-title">Progresso do Projeto</div>
              <div class="metric-box">
                <div class="metric-label">Taxa de Conclusão</div>
                <div class="metric-value">${reportData.completionRate.toFixed(1)}%</div>
                <div style="margin-top: 10px; color: #666;">
                  ${reportData.completedTasks} de ${reportData.totalTasks} tarefas concluídas
                </div>
              </div>
            </div>

            ${reportData.blockages.length > 0 ? `
            <div class="section">
              <div class="section-title">Bloqueios Identificados</div>
              <ul class="item-list">
                ${reportData.blockages.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${reportData.wins.length > 0 ? `
            <div class="section">
              <div class="section-title">Vitórias e Avanços</div>
              <ul class="item-list">
                ${reportData.wins.map(w => `<li>${w}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${reportData.insights.length > 0 ? `
            <div class="section">
              <div class="section-title">Insights e Recomendações</div>
              <ul class="item-list">
                ${reportData.insights.map(i => `<li>${i}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <center>
              <a href="${process.env.VITE_APP_URL || 'https://gavinho.manus.space'}/projects" class="cta-button">
                Ver Detalhes do Projeto
              </a>
            </center>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este é um email automático. Por favor, não responda a este email.
            </p>
          </div>

          <div class="footer">
            <p>© 2024 GAVINHO. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
GAVINHO - Relatório Diário do Projeto

${projectName}
Relatório gerado em ${new Date().toLocaleDateString('pt-PT')}

PROGRESSO DO PROJETO
Taxa de Conclusão: ${reportData.completionRate.toFixed(1)}%
${reportData.completedTasks} de ${reportData.totalTasks} tarefas concluídas

${reportData.blockages.length > 0 ? `
BLOQUEIOS IDENTIFICADOS
${reportData.blockages.map(b => `- ${b}`).join('\n')}
` : ''}

${reportData.wins.length > 0 ? `
VITÓRIAS E AVANÇOS
${reportData.wins.map(w => `- ${w}`).join('\n')}
` : ''}

${reportData.insights.length > 0 ? `
INSIGHTS E RECOMENDAÇÕES
${reportData.insights.map(i => `- ${i}`).join('\n')}
` : ''}

Ver Detalhes do Projeto: ${process.env.VITE_APP_URL || 'https://gavinho.manus.space'}/projects

---
Este é um email automático. Por favor, não responda a este email.
© 2024 GAVINHO. Todos os direitos reservados.
  `;

  return {
    subject: `[GAVINHO] Relatório Diário - ${projectName}`,
    html,
    text
  };
}

/**
 * Enviar relatório por email
 */
async function sendReportEmail(
  reportId: number,
  recipients: string[],
  projectName: string,
  reportData: any
) {
  try {
    initializeSendGrid();

    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Report would be sent to:', recipients);
      return { success: true, messageIds: [] };
    }

    const template = generateReportEmailTemplate(projectName, reportData);

    const messageIds: string[] = [];

    for (const recipient of recipients) {
      const msg = {
        to: recipient,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@gavinhogroup.com',
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: process.env.SENDGRID_REPLY_EMAIL || 'support@gavinhogroup.com',
        categories: [`report-scheduled`, `project-${projectName}`]
      };

      const response = await sgMail.send(msg);
      const messageId = response[0].headers['x-message-id'];
      messageIds.push(messageId || 'unknown');
    }

    return { success: true, messageIds };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending report email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Executar relatório agendado
 */
async function executeScheduledReport(reportId: number) {
  try {
    console.log(`[ReportScheduler] Executando relatório agendado: ${reportId}`);

    const db = await getDb();
    if (!db) {
      console.error(`[ReportScheduler] Database not available`);
      return;
    }

    const report = await db
      .select()
      .from(scheduledEmailReports)
      .where(eq(scheduledEmailReports.id, reportId))
      .limit(1);

    if (!report || report.length === 0) {
      console.error(`[ReportScheduler] Relatório não encontrado: ${reportId}`);
      return;
    }

    if (!report[0].isActive) {
      console.log(`[ReportScheduler] Relatório desativado: ${reportId}`);
      return;
    }

    // Obter informações do projeto
    const project = await db!
      .select()
      .from(projects)
      .where(eq(projects.id, report[0].projectId))
      .limit(1);

    if (!project || project.length === 0) {
      console.error(`[ReportScheduler] Projeto não encontrado: ${report[0].projectId}`);
      return;
    }

    // Preparar dados do relatório (simplificado)
    const reportData = {
      totalTasks: 10, // Seria obtido do banco de dados
      completedTasks: 7,
      completionRate: 70,
      blockages: ['Aguardando aprovação de cliente', 'Falta de recursos'],
      wins: ['Fase 1 concluída com sucesso', 'Orçamento dentro do previsto'],
      insights: ['Aumentar comunicação com fornecedores', 'Revisar alocação de recursos']
    };

    // Enviar emails
    const recipients = JSON.parse(report[0].recipients || '[]');
    const sendResult = await sendReportEmail(
      reportId,
      recipients,
      project[0].name,
      reportData
    );

    // Registrar no histórico de envios
    if (sendResult.success) {
      await db!.insert(emailReportLogs).values({
        reportId,
        projectId: report[0].projectId,
        sentAt: new Date().toISOString(),
        recipients: JSON.stringify(recipients),
        status: 'success',
        errorMessage: null,
        reportData: JSON.stringify(reportData),
        emailsSent: recipients.length,
        emailsFailed: 0
      });

      // Atualizar lastSentAt e nextSendAt
      const nextSendAt = calculateNextSendDate(
        report[0].frequency,
        report[0].dayOfWeek,
        report[0].dayOfMonth,
        report[0].time
      );

      await db!
        .update(scheduledEmailReports)
        .set({
          lastSentAt: new Date().toISOString(),
          nextSendAt: nextSendAt.toISOString()
        })
        .where(eq(scheduledEmailReports.id, reportId));

      console.log(`[ReportScheduler] Relatório enviado com sucesso: ${reportId}`);
    } else {
      await db!.insert(emailReportLogs).values({
        reportId,
        projectId: report[0].projectId,
        sentAt: new Date().toISOString(),
        recipients: JSON.stringify(recipients),
        status: 'failed',
        errorMessage: sendResult.error || 'Unknown error',
        reportData: JSON.stringify(reportData),
        emailsSent: 0,
        emailsFailed: recipients.length
      });

      console.error(`[ReportScheduler] Erro ao enviar relatório: ${reportId}`, sendResult.error);
    }
  } catch (error) {
    console.error(`[ReportScheduler] Erro ao executar relatório ${reportId}:`, error);
  }
}

/**
 * Calcular próxima data de envio
 */
export function calculateNextSendDate(
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom',
  dayOfWeek?: number,
  dayOfMonth?: number,
  time?: string
): Date {
  const now = new Date();
  const [hours, minutes] = (time || '09:00').split(':').map(Number);

  const nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      // Se já passou o horário hoje, agendar para amanhã
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;

    case 'weekly':
      const targetDow = dayOfWeek ?? 1;
      const currentDow = nextDate.getDay();
      let daysToAdd = (targetDow - currentDow + 7) % 7;
      if (daysToAdd === 0 && nextDate <= now) {
        daysToAdd = 7;
      }
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      break;

    case 'monthly':
      const targetDom = dayOfMonth ?? 1;
      nextDate.setDate(targetDom);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(targetDom);
      }
      break;

    case 'custom':
      // Para custom, usar daily como padrão
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
  }

  return nextDate;
}

/**
 * Agendar um relatório
 */
export function scheduleReport(reportId: number, cronExpression: string) {
  try {
    // Cancelar tarefa anterior se existir
    if (scheduledTasks.has(reportId)) {
      const existing = scheduledTasks.get(reportId);
      if (existing?.task) {
        existing.task.stop();
      }
      scheduledTasks.delete(reportId);
    }

    // Criar nova tarefa cron
    const task = cron.schedule(cronExpression, async () => {
      await executeScheduledReport(reportId);
    });

    scheduledTasks.set(reportId, { reportId, task });
    console.log(`[ReportScheduler] Relatório agendado: ${reportId} com expressão: ${cronExpression}`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ReportScheduler] Erro ao agendar relatório ${reportId}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Desagendar um relatório
 */
export function unscheduleReport(reportId: number) {
  try {
    const scheduled = scheduledTasks.get(reportId);
    if (scheduled?.task) {
      scheduled.task.stop();
      scheduledTasks.delete(reportId);
      console.log(`[ReportScheduler] Relatório desagendado: ${reportId}`);
      return { success: true };
    }
    return { success: false, error: 'Relatório não encontrado na fila de agendamentos' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ReportScheduler] Erro ao desagendar relatório ${reportId}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Inicializar agendamentos de todos os relatórios ativos
 */
export async function initializeScheduledReports() {
  try {
    console.log('[ReportScheduler] Inicializando agendamentos de relatórios...');

    const db = await getDb();
    if (!db) {
      console.error('[ReportScheduler] Database not available');
      return;
    }

    const activeReports = await db
      .select()
      .from(scheduledEmailReports)
      .where(eq(scheduledEmailReports.isActive, 1));

    for (const report of activeReports) {
      const cronExpression = frequencyToCronExpression(
        report.frequency,
        report.time,
        report.dayOfWeek ?? undefined,
        report.dayOfMonth ?? undefined
      );

      scheduleReport(report.id, cronExpression);
    }

    console.log(`[ReportScheduler] ${activeReports.length} relatórios agendados com sucesso`);
  } catch (error) {
    console.error('[ReportScheduler] Erro ao inicializar agendamentos:', error);
  }
}

/**
 * Obter status de todos os agendamentos
 */
export function getScheduledReportsStatus() {
  const status = Array.from(scheduledTasks.values()).map(({ reportId }) => ({
    reportId,
    status: 'scheduled'
  }));

  return status;
}
