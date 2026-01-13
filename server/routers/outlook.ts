import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { outlookSyncService } from '../services/outlookSyncService';
import { db } from '../db';
import { emailTracking, emailSyncLog } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const outlookRouter = router({
  // Sync emails from Outlook
  syncEmails: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const syncedCount = await outlookSyncService.syncEmails(input.projectId);
        return {
          success: true,
          syncedCount,
          message: `${syncedCount} emails synced successfully`,
        };
      } catch (error) {
        console.error('Error syncing emails:', error);
        return {
          success: false,
          syncedCount: 0,
          message: error instanceof Error ? error.message : 'Failed to sync emails',
        };
      }
    }),

  // Get emails by category
  getEmailsByCategory: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.enum(['order', 'adjudication', 'purchase', 'delivery', 'invoice', 'other']),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      return outlookSyncService.getEmailsByCategory(input.projectId, input.category, input.limit);
    }),

  // Get all emails for a project
  getProjectEmails: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        isArchived: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = db.select().from(emailTracking).where(eq(emailTracking.projectId, input.projectId));

      if (input.isArchived !== undefined) {
        query = query.where(and(eq(emailTracking.projectId, input.projectId), eq(emailTracking.isArchived, input.isArchived)));
      }

      const emails = await query
        .orderBy(desc(emailTracking.receivedAt))
        .limit(input.limit)
        .offset(input.offset);

      return emails;
    }),

  // Get email statistics
  getEmailStatistics: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const emails = await db.select().from(emailTracking).where(eq(emailTracking.projectId, input.projectId));

      const stats = {
        total: emails.length,
        byCategory: {
          order: emails.filter((e) => e.category === 'order').length,
          adjudication: emails.filter((e) => e.category === 'adjudication').length,
          purchase: emails.filter((e) => e.category === 'purchase').length,
          delivery: emails.filter((e) => e.category === 'delivery').length,
          invoice: emails.filter((e) => e.category === 'invoice').length,
          other: emails.filter((e) => e.category === 'other').length,
        },
        unread: emails.filter((e) => !e.isRead).length,
        archived: emails.filter((e) => e.isArchived).length,
      };

      return stats;
    }),

  // Mark email as read
  markAsRead: protectedProcedure
    .input(z.object({ emailId: z.number() }))
    .mutation(async ({ input }) => {
      await outlookSyncService.markEmailAsRead(input.emailId);
      return { success: true };
    }),

  // Mark email as archived
  markAsArchived: protectedProcedure
    .input(z.object({ emailId: z.number() }))
    .mutation(async ({ input }) => {
      await outlookSyncService.markEmailAsArchived(input.emailId);
      return { success: true };
    }),

  // Get sync history
  getSyncHistory: protectedProcedure
    .input(z.object({ projectId: z.number(), limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(emailSyncLog)
        .where(eq(emailSyncLog.projectId, input.projectId))
        .orderBy(desc(emailSyncLog.syncedAt))
        .limit(input.limit);
    }),

  // Get email detail
  getEmailDetail: protectedProcedure
    .input(z.object({ emailId: z.number() }))
    .query(async ({ input }) => {
      const email = await db.select().from(emailTracking).where(eq(emailTracking.id, input.emailId)).limit(1);
      return email[0] || null;
    }),

  // Search emails
  searchEmails: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        query: z.string(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      // Simple search in subject and summary
      const emails = await db
        .select()
        .from(emailTracking)
        .where(eq(emailTracking.projectId, input.projectId))
        .orderBy(desc(emailTracking.receivedAt));

      return emails
        .filter(
          (e) =>
            e.subject?.toLowerCase().includes(input.query.toLowerCase()) ||
            e.summary?.toLowerCase().includes(input.query.toLowerCase()) ||
            e.senderName?.toLowerCase().includes(input.query.toLowerCase())
        )
        .slice(0, input.limit);
    }),
});
