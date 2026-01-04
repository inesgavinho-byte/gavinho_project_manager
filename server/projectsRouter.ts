import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as projectsDb from "./projectsDb";
import { storagePut } from "./storage";

// ============= PROJECTS ROUTER =============

export const projectsRouter = router({
  // List all projects
  list: protectedProcedure.query(async () => {
    return await projectsDb.getAllProjects();
  }),

  // Get project by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await projectsDb.getProjectById(input.id);
    }),

  // Get project with full stats
  getStats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await projectsDb.getProjectStats(input.id);
    }),

  // Create project
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).default("planning"),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      budget: z.string().optional(),
      clientName: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const projectId = await projectsDb.createProject({
        ...input,
        createdById: ctx.user.id,
      });
      return { id: projectId };
    }),

  // Update project
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      progress: z.number().min(0).max(100).optional(),
      budget: z.string().optional(),
      actualCost: z.string().optional(),
      clientName: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await projectsDb.updateProject(id, data);
      return { success: true };
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await projectsDb.deleteProject(input.id);
      return { success: true };
    }),

  // Get projects by status
  getByStatus: protectedProcedure
    .input(z.object({ status: z.string() }))
    .query(async ({ input }) => {
      return await projectsDb.getProjectsByStatus(input.status);
    }),

  // ============= PHASES =============

  phases: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getProjectPhases(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        order: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).default("not_started"),
      }))
      .mutation(async ({ input }) => {
        const phaseId = await projectsDb.createPhase(input);
        return { id: phaseId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).optional(),
        progress: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await projectsDb.updatePhase(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await projectsDb.deletePhase(input.id);
        return { success: true };
      }),
  }),

  // ============= MILESTONES =============

  milestones: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getProjectMilestones(input.projectId);
      }),

    listByPhase: protectedProcedure
      .input(z.object({ phaseId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getMilestonesByPhase(input.phaseId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        phaseId: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.date(),
        isKeyMilestone: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const milestoneId = await projectsDb.createMilestone({
          ...input,
          isKeyMilestone: input.isKeyMilestone ? 1 : 0,
        });
        return { id: milestoneId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        completedDate: z.date().optional(),
        status: z.enum(["pending", "completed", "overdue"]).optional(),
        isKeyMilestone: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, isKeyMilestone, ...data } = input;
        await projectsDb.updateMilestone(id, {
          ...data,
          ...(isKeyMilestone !== undefined && { isKeyMilestone: isKeyMilestone ? 1 : 0 }),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await projectsDb.deleteMilestone(input.id);
        return { success: true };
      }),
  }),

  // ============= TEAM =============

  team: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getProjectTeam(input.projectId);
      }),

    add: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.string().min(1),
        responsibilities: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const memberId = await projectsDb.addTeamMember(input);
        return { id: memberId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        role: z.string().optional(),
        responsibilities: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await projectsDb.updateTeamMember(id, data);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await projectsDb.removeTeamMember(input.id);
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({
        updates: z.array(z.object({
          memberId: z.number(),
          displayOrder: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        await projectsDb.reorderTeamMembers(input.updates);
        return { success: true };
      }),
  }),

  // ============= DOCUMENTS =============

  documents: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getProjectDocuments(input.projectId);
      }),

    listByCategory: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        category: z.string(),
      }))
      .query(async ({ input }) => {
        return await projectsDb.getDocumentsByCategory(input.projectId, input.category);
      }),

    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        fileData: z.string(), // base64
        fileType: z.string(),
        fileSize: z.number(),
        category: z.enum(["contract", "drawing", "specification", "photo", "report", "other"]).default("other"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `projects/${input.projectId}/documents/${Date.now()}-${input.name}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        const documentId = await projectsDb.createDocument({
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          fileUrl: url,
          fileKey,
          fileType: input.fileType,
          fileSize: input.fileSize,
          category: input.category,
          uploadedById: ctx.user.id,
        });

        return { id: documentId, url };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await projectsDb.deleteDocument(input.id);
        return { success: true };
      }),
  }),

  // ============= GALLERY =============

  gallery: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getProjectGallery(input.projectId);
      }),

    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageData: z.string(), // base64
        category: z.string().optional(),
        takenAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.imageData, 'base64');
        const imageKey = `projects/${input.projectId}/gallery/${Date.now()}.jpg`;
        const { url } = await storagePut(imageKey, buffer, 'image/jpeg');

        const imageId = await projectsDb.addGalleryImage({
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          imageUrl: url,
          imageKey,
          category: input.category,
          takenAt: input.takenAt,
          uploadedById: ctx.user.id,
          order: 0,
        });

        return { id: imageId, url };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await projectsDb.updateGalleryImage(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await projectsDb.deleteGalleryImage(input.id);
        return { success: true };
      }),
  }),
});
