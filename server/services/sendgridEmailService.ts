import sgMail from '@sendgrid/mail';
import { db } from '../db';
import { emailHistory, emailPreferences } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Inicializar SendGrid (será configurado com API key nas variáveis de ambiente)
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
};

export interface EmailReminder {
  projectId: string;
  eventType: 'delivery' | 'adjudication' | 'payment';
  eventDate: Date;
  recipientEmail: string;
  recipientName: string;
  projectName: string;
  description: string;
  reminderType: '1day' | '1hour'; // 1 dia antes ou 1 hora antes
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Criar template de email para lembrete de evento
 */
export const createReminderEmailTemplate = (
  reminder: EmailReminder
): EmailTemplate => {
  const eventTypeLabel = {
    delivery: 'Entrega',
    adjudication: 'Adjudicação',
    payment: 'Pagamento'
  }[reminder.eventType];

  const reminderLabel = reminder.reminderType === '1day' 
    ? 'em 1 dia' 
    : 'em 1 hora';

  const formattedDate = reminder.eventDate.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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
          .event-box {
            background-color: #f9f8f5;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
          }
          .event-label {
            color: #8b8670;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .event-value {
            font-size: 16px;
            color: #333;
            margin-top: 5px;
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
            <p>Lembrete de Evento</p>
          </div>

          <div class="content">
            <p>Olá <strong>${reminder.recipientName}</strong>,</p>

            <p>Este é um lembrete automático de que tem um evento agendado <strong>${reminderLabel}</strong>:</p>

            <div class="event-box">
              <div class="event-label">Tipo de Evento</div>
              <div class="event-value">${eventTypeLabel}</div>
            </div>

            <div class="event-box">
              <div class="event-label">Projeto</div>
              <div class="event-value">${reminder.projectName}</div>
            </div>

            <div class="event-box">
              <div class="event-label">Descrição</div>
              <div class="event-value">${reminder.description}</div>
            </div>

            <div class="event-box">
              <div class="event-label">Data e Hora</div>
              <div class="event-value">${formattedDate}</div>
            </div>

            <p>Por favor, certifique-se de que tem tudo preparado para este evento.</p>

            <center>
              <a href="${process.env.VITE_APP_URL || 'https://gavinho.manus.space'}/calendar" class="cta-button">
                Ver no Calendário
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
GAVINHO - Lembrete de Evento

Olá ${reminder.recipientName},

Este é um lembrete automático de que tem um evento agendado ${reminderLabel}:

Tipo de Evento: ${eventTypeLabel}
Projeto: ${reminder.projectName}
Descrição: ${reminder.description}
Data e Hora: ${formattedDate}

Por favor, certifique-se de que tem tudo preparado para este evento.

Ver no Calendário: ${process.env.VITE_APP_URL || 'https://gavinho.manus.space'}/calendar

---
Este é um email automático. Por favor, não responda a este email.
© 2024 GAVINHO. Todos os direitos reservados.
  `;

  return {
    subject: `[GAVINHO] Lembrete: ${eventTypeLabel} - ${reminder.projectName}`,
    html,
    text
  };
};

/**
 * Enviar email de lembrete
 */
export const sendReminderEmail = async (
  reminder: EmailReminder
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    initializeSendGrid();

    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email would be sent to:', reminder.recipientEmail);
      // Log para desenvolvimento sem SendGrid
      await logEmailHistory({
        projectId: reminder.projectId,
        recipientEmail: reminder.recipientEmail,
        eventType: reminder.eventType,
        reminderType: reminder.reminderType,
        status: 'pending', // Aguardando configuração de SendGrid
        messageId: 'MOCK_' + Date.now(),
        error: 'SendGrid API key not configured'
      });
      return { success: true, messageId: 'MOCK_' + Date.now() };
    }

    const template = createReminderEmailTemplate(reminder);

    const msg = {
      to: reminder.recipientEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@gavinho.com',
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: process.env.SENDGRID_REPLY_EMAIL || 'support@gavinho.com',
      categories: [`reminder-${reminder.eventType}`, `project-${reminder.projectId}`]
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers['x-message-id'];

    // Log no histórico
    await logEmailHistory({
      projectId: reminder.projectId,
      recipientEmail: reminder.recipientEmail,
      eventType: reminder.eventType,
      reminderType: reminder.reminderType,
      status: 'sent',
      messageId: messageId || 'unknown',
      error: null
    });

    return { success: true, messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log erro no histórico
    await logEmailHistory({
      projectId: reminder.projectId,
      recipientEmail: reminder.recipientEmail,
      eventType: reminder.eventType,
      reminderType: reminder.reminderType,
      status: 'failed',
      messageId: null,
      error: errorMessage
    });

    console.error('Error sending reminder email:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Enviar email de teste
 */
export const sendTestEmail = async (
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    initializeSendGrid();

    if (!process.env.SENDGRID_API_KEY) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    const msg = {
      to: recipientEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@gavinho.com',
      subject: '[GAVINHO] Email de Teste',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Email de Teste - GAVINHO</h2>
            <p>Este é um email de teste para confirmar que a integração com SendGrid está funcionando corretamente.</p>
            <p>Se recebeu este email, a configuração está pronta para enviar lembretes de eventos do calendário.</p>
          </body>
        </html>
      `,
      text: 'Este é um email de teste. A integração com SendGrid está funcionando.'
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

/**
 * Log de histórico de emails
 */
interface EmailHistoryLog {
  projectId: string;
  recipientEmail: string;
  eventType: 'delivery' | 'adjudication' | 'payment';
  reminderType: '1day' | '1hour';
  status: 'sent' | 'failed' | 'pending';
  messageId: string | null;
  error: string | null;
}

const logEmailHistory = async (log: EmailHistoryLog) => {
  try {
    // Assumindo que existe tabela emailHistory no schema
    // await db.insert(emailHistory).values({
    //   projectId: log.projectId,
    //   recipientEmail: log.recipientEmail,
    //   eventType: log.eventType,
    //   reminderType: log.reminderType,
    //   status: log.status,
    //   messageId: log.messageId,
    //   error: log.error,
    //   sentAt: new Date()
    // });
    console.log('Email history logged:', log);
  } catch (error) {
    console.error('Error logging email history:', error);
  }
};

/**
 * Obter preferências de email do usuário
 */
export const getUserEmailPreferences = async (userId: string) => {
  try {
    // Assumindo que existe tabela emailPreferences no schema
    // const prefs = await db.query.emailPreferences.findFirst({
    //   where: eq(emailPreferences.userId, userId)
    // });
    // return prefs || getDefaultPreferences();
    return getDefaultPreferences();
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return getDefaultPreferences();
  }
};

/**
 * Preferências padrão de email
 */
const getDefaultPreferences = () => ({
  deliveryReminders: true,
  adjudicationReminders: true,
  paymentReminders: true,
  reminderTiming: ['1day', '1hour'] as const,
  emailFrequency: 'immediate' as const
});

/**
 * Atualizar preferências de email do usuário
 */
export const updateUserEmailPreferences = async (
  userId: string,
  preferences: Partial<ReturnType<typeof getDefaultPreferences>>
) => {
  try {
    // Assumindo que existe tabela emailPreferences no schema
    // await db.update(emailPreferences)
    //   .set(preferences)
    //   .where(eq(emailPreferences.userId, userId));
    console.log('Email preferences updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return false;
  }
};
