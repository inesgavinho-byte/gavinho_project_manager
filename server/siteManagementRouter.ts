import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as siteDb from "./siteManagementDb";
import { storagePut } from "./storage";

export const siteManagementRouter = router({
  // ============================================================================
  // WORKERS - Gestão de Trabalhadores
  // ============================================================================
  
  workers: router({
    create: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        userId: z.number().optional(),
        name: z.string(),
        role: z.enum(["worker", "foreman", "technician", "engineer"]),
        phone: z.string().optional(),
        email: z.string().optional(),
        company: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await siteDb.createWorker(input);
      }),

    list: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        activeOnly: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        if (input.activeOnly) {
          return await siteDb.getActiveWorkersByConstruction(input.constructionId);
        }
        return await siteDb.getWorkersByConstruction(input.constructionId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await siteDb.getWorkerById(input.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        role: z.enum(["worker", "foreman", "technician", "engineer"]).optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        company: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await siteDb.updateWorker(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await siteDb.deleteWorker(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // ATTENDANCE - Picagem de Ponto
  // ============================================================================

  attendance: router({
    checkIn: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        constructionId: z.number(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if worker already has active attendance
        const activeAttendance = await siteDb.getActiveAttendance(
          input.workerId,
          input.constructionId
        );

        if (activeAttendance) {
          throw new Error("Worker already checked in. Please check out first.");
        }

        return await siteDb.checkIn({
          ...input,
          checkIn: new Date(),
        });
      }),

    checkOut: protectedProcedure
      .input(z.object({
        attendanceId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await siteDb.checkOut(input.attendanceId, new Date(), input.notes);
      }),

    listByConstruction: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await siteDb.getAttendanceByConstruction(
          input.constructionId,
          input.startDate,
          input.endDate
        );
      }),

    listByWorker: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await siteDb.getAttendanceByWorker(
          input.workerId,
          input.startDate,
          input.endDate
        );
      }),

    getActive: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        constructionId: z.number(),
      }))
      .query(async ({ input }) => {
        return await siteDb.getActiveAttendance(input.workerId, input.constructionId);
      }),
  }),

  // ============================================================================
  // WORK HOURS - Registo de Horas Trabalhadas
  // ============================================================================

  workHours: router({
    create: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        constructionId: z.number(),
        date: z.string(),
        taskDescription: z.string(),
        hours: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await siteDb.createWorkHours(input);
      }),

    listByConstruction: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await siteDb.getWorkHoursByConstruction(
          input.constructionId,
          input.startDate,
          input.endDate
        );
      }),

    listByWorker: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await siteDb.getWorkHoursByWorker(
          input.workerId,
          input.startDate,
          input.endDate
        );
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.approveWorkHours(input.id, ctx.user.id);
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.rejectWorkHours(input.id, ctx.user.id);
      }),
  }),

  // ============================================================================
  // MATERIAL REQUESTS - Requisição de Materiais
  // ============================================================================

  materialRequests: router({
    create: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        materialName: z.string(),
        quantity: z.number(),
        unit: z.string(),
        urgency: z.enum(["low", "medium", "high", "urgent"]).optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.createMaterialRequest({
          ...input,
          requestedBy: ctx.user.id,
        });
      }),

    list: protectedProcedure
      .input(z.object({ constructionId: z.number() }))
      .query(async ({ input }) => {
        return await siteDb.getMaterialRequestsByConstruction(input.constructionId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await siteDb.getMaterialRequestById(input.id);
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.approveMaterialRequest(input.id, ctx.user.id);
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.rejectMaterialRequest(input.id, ctx.user.id);
      }),

    markDelivered: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await siteDb.markMaterialRequestDelivered(input.id);
      }),
  }),

  // ============================================================================
  // MATERIAL USAGE - Consumo de Materiais
  // ============================================================================

  materialUsage: router({
    create: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        materialName: z.string(),
        quantity: z.number(),
        unit: z.string(),
        location: z.string().optional(),
        notes: z.string().optional(),
        date: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.createMaterialUsage({
          ...input,
          usedBy: ctx.user.id,
        });
      }),

    listByConstruction: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await siteDb.getMaterialUsageByConstruction(
          input.constructionId,
          input.startDate,
          input.endDate
        );
      }),

    listByWorker: protectedProcedure
      .input(z.object({
        workerId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await siteDb.getMaterialUsageByWorker(
          input.workerId,
          input.startDate,
          input.endDate
        );
      }),
  }),

  // ============================================================================
  // WORK PHOTOS - Fotografias de Trabalho
  // ============================================================================

  workPhotos: router({
    upload: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        uploaderType: z.enum(["worker", "subcontractor", "director", "inspector", "safety"]),
        photoBase64: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        tags: z.array(z.string()).optional(),
        date: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Upload photo to S3
        const buffer = Buffer.from(input.photoBase64, "base64");
        const fileName = `site-photos/${input.constructionId}/${Date.now()}.jpg`;
        const { url } = await storagePut(fileName, buffer, "image/jpeg");

        // Save to database
        return await siteDb.createWorkPhoto({
          constructionId: input.constructionId,
          uploadedBy: ctx.user.id,
          uploaderType: input.uploaderType,
          photoUrl: url,
          description: input.description,
          location: input.location,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          date: input.date,
        });
      }),

    list: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const photos = await siteDb.getWorkPhotosByConstruction(
          input.constructionId,
          input.startDate,
          input.endDate
        );

        // Parse tags JSON
        return photos.map(photo => ({
          ...photo,
          tags: photo.tags ? JSON.parse(photo.tags) : [],
        }));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await siteDb.deleteWorkPhoto(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // NON-COMPLIANCES - Não Conformidades
  // ============================================================================

  nonCompliances: router({
    create: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        reporterType: z.enum(["director", "inspector", "safety", "quality"]),
        type: z.enum(["quality", "safety", "environmental", "contractual", "other"]),
        severity: z.enum(["minor", "major", "critical"]),
        title: z.string(),
        description: z.string(),
        location: z.string().optional(),
        responsibleParty: z.string().optional(),
        photos: z.array(z.string()).optional(),
        correctiveAction: z.string().optional(),
        deadline: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.createNonCompliance({
          ...input,
          reportedBy: ctx.user.id,
          photos: input.photos ? JSON.stringify(input.photos) : null,
          date: new Date(),
        });
      }),

    list: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        openOnly: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        if (input.openOnly) {
          return await siteDb.getOpenNonCompliancesByConstruction(input.constructionId);
        }
        return await siteDb.getNonCompliancesByConstruction(input.constructionId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const nonCompliance = await siteDb.getNonComplianceById(input.id);
        if (nonCompliance && nonCompliance.photos) {
          return {
            ...nonCompliance,
            photos: JSON.parse(nonCompliance.photos),
          };
        }
        return nonCompliance;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
        correctiveAction: z.string().optional(),
        deadline: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await siteDb.updateNonCompliance(id, data);
      }),

    resolve: protectedProcedure
      .input(z.object({
        id: z.number(),
        resolution: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.resolveNonCompliance(input.id, ctx.user.id, input.resolution);
      }),

    verify: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await siteDb.verifyNonCompliance(input.id, ctx.user.id);
      }),
  }),
});
