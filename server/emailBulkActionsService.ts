import { getDb } from './db';
import { emailHistory } from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';
import { storagePut } from './storage';
import PDFDocument from 'pdfkit';

/**
 * Marcar múltiplos emails como lido
 */
export async function markEmailsAsRead(emailIds: number[]): Promise<number> {
  if (emailIds.length === 0) return 0;

  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return 0;
    }

    const result = await db
      .update(emailHistory)
      .set({
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(emailHistory.id, emailIds));

    return emailIds.length;
  } catch (error) {
    console.error('Error marking emails as read:', error);
    return 0;
  }
}

/**
 * Reenviar múltiplos emails
 */
export async function resendEmails(emailIds: number[]): Promise<{ success: number; failed: number }> {
  if (emailIds.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return { success: 0, failed: emailIds.length };
    }

    const emails = await db
      .select()
      .from(emailHistory)
      .where(inArray(emailHistory.id, emailIds));

    for (const email of emails) {
      try {
        // Criar novo registro de email para reenvio
        await db.insert(emailHistory).values({
          projectId: email.projectId,
          subject: `[REENVIADO] ${email.subject}`,
          senderEmail: email.senderEmail,
          senderName: email.senderName,
          recipientEmail: email.recipientEmail,
          recipientName: email.recipientName,
          content: email.content,
          eventType: email.eventType,
          status: 'pending',
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        success++;
      } catch (error) {
        console.error(`Error resending email ${email.id}:`, error);
        failed++;
      }
    }
  } catch (error) {
    console.error('Error in resendEmails:', error);
    failed = emailIds.length;
  }

  return { success, failed };
}

/**
 * Deletar múltiplos emails
 */
export async function deleteEmails(emailIds: number[]): Promise<number> {
  if (emailIds.length === 0) return 0;

  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return 0;
    }

    // Soft delete - marcar como deletado
    const result = await db
      .update(emailHistory)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(emailHistory.id, emailIds));

    return emailIds.length;
  } catch (error) {
    console.error('Error deleting emails:', error);
    return 0;
  }
}

/**
 * Exportar múltiplos emails como PDF
 */
export async function exportEmailsAsPDF(
  emailIds: number[],
  projectName: string
): Promise<{ url: string; filename: string } | null> {
  if (emailIds.length === 0) return null;

  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return null;
    }

    const emails = await db
      .select()
      .from(emailHistory)
      .where(inArray(emailHistory.id, emailIds));

    if (emails.length === 0) return null;

    // Criar documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Adicionar header
    doc.fontSize(20).font('Helvetica-Bold').text('Histórico de Emails', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Projeto: ${projectName}`, { align: 'center' });
    doc.fontSize(10).text(`Data de Exportação: ${new Date().toLocaleDateString('pt-PT')}`, { align: 'center' });
    doc.moveDown();

    // Adicionar linha separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Adicionar emails
    for (const email of emails) {
      // Título do email
      doc.fontSize(12).font('Helvetica-Bold').text(`De: ${email.senderName || email.senderEmail}`);
      doc.fontSize(10).font('Helvetica').text(`Para: ${email.recipientName || email.recipientEmail}`);
      doc.text(`Data: ${email.sentAt ? new Date(email.sentAt).toLocaleDateString('pt-PT') : 'N/A'}`);
      doc.text(`Assunto: ${email.subject}`);
      doc.text(`Status: ${email.status?.toUpperCase() || 'N/A'}`);
      doc.moveDown(0.5);

      // Conteúdo do email
      if (email.content) {
        doc.fontSize(9).font('Helvetica').text(email.content, { width: 450, height: 100 });
      }

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
    }

    // Converter para buffer
    const chunks: Buffer[] = [];
    await new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', resolve);
      doc.on('error', reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Upload para S3
    const filename = `email-history-${projectName}-${Date.now()}.pdf`;
    const result = await storagePut(`exports/${filename}`, pdfBuffer, 'application/pdf');

    return {
      url: result.url,
      filename,
    };
  } catch (error) {
    console.error('Error exporting emails as PDF:', error);
    return null;
  }
}

/**
 * Adicionar tag a múltiplos emails
 */
export async function tagEmails(emailIds: number[], tag: string): Promise<number> {
  if (emailIds.length === 0) return 0;

  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return 0;
    }

    const emails = await db
      .select()
      .from(emailHistory)
      .where(inArray(emailHistory.id, emailIds));

    let updated = 0;

    for (const email of emails) {
      const currentTags = email.tags ? JSON.parse(email.tags as string) : [];
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);

        await db
          .update(emailHistory)
          .set({
            tags: JSON.stringify(currentTags),
            updatedAt: new Date(),
          })
          .where(eq(emailHistory.id, email.id));

        updated++;
      }
    }

    return updated;
  } catch (error) {
    console.error('Error tagging emails:', error);
    return 0;
  }
}

/**
 * Remover tag de múltiplos emails
 */
export async function untagEmails(emailIds: number[], tag: string): Promise<number> {
  if (emailIds.length === 0) return 0;

  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return 0;
    }

    const emails = await db
      .select()
      .from(emailHistory)
      .where(inArray(emailHistory.id, emailIds));

    let updated = 0;

    for (const email of emails) {
      const currentTags = email.tags ? JSON.parse(email.tags as string) : [];
      const newTags = currentTags.filter((t: string) => t !== tag);

      if (newTags.length !== currentTags.length) {
        await db
          .update(emailHistory)
          .set({
            tags: JSON.stringify(newTags),
            updatedAt: new Date(),
          })
          .where(eq(emailHistory.id, email.id));

        updated++;
      }
    }

    return updated;
  } catch (error) {
    console.error('Error untagging emails:', error);
    return 0;
  }
}

/**
 * Gerar relatório de ações em massa
 */
export async function generateBulkActionReport(
  action: string,
  emailIds: number[],
  result: any
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const reportData = {
      timestamp,
      action,
      emailCount: emailIds.length,
      result,
    };

    // Log para auditoria
    console.log('Bulk Action Report:', reportData);

    // Aqui você pode adicionar lógica para armazenar o relatório em um banco de dados
    // ou enviar para um serviço de auditoria
  } catch (error) {
    console.error('Error generating bulk action report:', error);
  }
}
