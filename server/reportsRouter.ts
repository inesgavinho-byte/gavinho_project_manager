import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as reportsDb from "./reportsDb";

const chartTypeSchema = z.object({
  metricId: z.string(),
  chartType: z.enum(["line", "bar", "pie", "area", "table"]),
});

const layoutSectionSchema = z.object({
  id: z.string(),
  type: z.enum(["header", "metrics", "chart", "table", "text"]),
  order: z.number(),
  config: z.any(),
});

export const reportsRouter = router({
  // Template Management
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        isPublic: z.boolean(),
        reportType: z.enum(["progress", "financial", "resources", "timeline", "custom"]),
        metrics: z.array(z.string()),
        chartTypes: z.array(chartTypeSchema),
        filters: z.any(),
        layout: z.object({
          sections: z.array(layoutSectionSchema),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const templateId = await reportsDb.createReportTemplate({
        ...input,
        createdById: ctx.user.id,
      });
      return { templateId };
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
        reportType: z.enum(["progress", "financial", "resources", "timeline", "custom"]).optional(),
        metrics: z.array(z.string()).optional(),
        chartTypes: z.array(chartTypeSchema).optional(),
        filters: z.any().optional(),
        layout: z
          .object({
            sections: z.array(layoutSectionSchema),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { templateId, ...updateData } = input;
      await reportsDb.updateReportTemplate(templateId, ctx.user.id, updateData);
      return { success: true };
    }),

  deleteTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await reportsDb.deleteReportTemplate(input.templateId, ctx.user.id);
      return { success: true };
    }),

  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    return await reportsDb.getReportTemplates(ctx.user.id);
  }),

  getTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await reportsDb.getReportTemplate(input.templateId, ctx.user.id);
    }),

  // Report Execution
  executeReport: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        parameters: z.any(),
        exportFormat: z.enum(["pdf", "excel", "csv", "json"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get template
      const template = await reportsDb.getReportTemplate(input.templateId, ctx.user.id);

      // Generate report data based on template configuration
      // This is a simplified version - in production, you'd generate actual data
      const reportData = {
        templateName: template.name,
        generatedAt: new Date().toISOString(),
        parameters: input.parameters,
        sections: template.layout.sections,
        // Add actual data generation logic here
      };

      // Save execution
      const executionId = await reportsDb.saveReportExecution({
        templateId: input.templateId,
        executedById: ctx.user.id,
        parameters: input.parameters,
        data: reportData,
        exportFormat: input.exportFormat,
      });

      return { executionId, data: reportData };
    }),

  getExecutions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      return await reportsDb.getReportExecutions(ctx.user.id, input?.limit);
    }),

  getExecution: protectedProcedure
    .input(
      z.object({
        executionId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await reportsDb.getReportExecution(input.executionId, ctx.user.id);
    }),
});
