import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  importMQT,
  getMQTData,
  getMQTAlerts,
  resolveMQTAlert,
} from '../services/mqtImportService';

export const mqtRouter = router({
  /**
   * Import MQT from Google Sheets
   */
  importFromGoogleSheets: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        sheetUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await importMQT(
          input.projectId,
          ctx.user.id,
          'google_sheets',
          input.sheetUrl
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        throw new Error(
          `Failed to import from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Import MQT from Excel file
   */
  importFromExcel: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file data
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const fileBuffer = Buffer.from(input.fileData, 'base64');

        const result = await importMQT(
          input.projectId,
          ctx.user.id,
          'excel',
          undefined,
          fileBuffer,
          input.fileName
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        throw new Error(
          `Failed to import from Excel: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Get MQT data for a project
   */
  getMQTData: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        importId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await getMQTData(input.projectId, input.importId);

        return {
          success: true,
          data,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch MQT data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Get MQT alerts for a project
   */
  getMQTAlerts: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        isResolved: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const alerts = await getMQTAlerts(input.projectId, input.isResolved);

        return {
          success: true,
          data: alerts,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch MQT alerts: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Resolve MQT alert
   */
  resolveAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await resolveMQTAlert(input.alertId, ctx.user.id);

        return {
          success: true,
          message: 'Alert resolved successfully',
        };
      } catch (error) {
        throw new Error(
          `Failed to resolve alert: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),

  /**
   * Get MQT statistics for a project
   */
  getStatistics: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      try {
        const data = await getMQTData(input.projectId);
        const alerts = await getMQTAlerts(input.projectId);

        const stats = {
          totalItems: data.length,
          totalPlanned: data.reduce((sum, item) => sum + (parseFloat(item.plannedQuantity || '0') || 0), 0),
          totalExecuted: data.reduce((sum, item) => sum + (parseFloat(item.executedQuantity || '0') || 0), 0),
          itemsOnTrack: data.filter((item) => item.status === 'on_track').length,
          itemsWarning: data.filter((item) => item.status === 'warning').length,
          itemsCritical: data.filter((item) => item.status === 'critical').length,
          alertsTotal: alerts.length,
          alertsUnresolved: alerts.filter((alert) => !alert.isResolved).length,
        };

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        throw new Error(
          `Failed to fetch MQT statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }),
});
