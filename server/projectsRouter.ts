import { z } from "zod";
import { TRPCError } from "@trpc/server";
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
        category: z.enum(["contract", "plan", "license", "invoice", "other"]).default("other"),
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

  // ============= TRASH (SOFT DELETE) =============

  trash: router({
    listProjects: protectedProcedure
      .query(async () => {
        return await projectsDb.getTrashedProjects();
      }),

    restore: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await projectsDb.restoreProject(input.id);
        return { success: true };
      }),

    permanentDelete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await projectsDb.permanentDeleteProject(input.id);
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
        caption: z.string().optional(),
        phaseId: z.number().nullable().optional(),
        images: z.array(z.object({
          data: z.string(), // base64
          type: z.string(),
          size: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const uploadedImages = [];

        for (const img of input.images) {
          // Decode base64 and upload to S3
          const buffer = Buffer.from(img.data, 'base64');
          const imageKey = `projects/${input.projectId}/gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const { url } = await storagePut(imageKey, buffer, img.type);

          const imageId = await projectsDb.addGalleryImage({
            projectId: input.projectId,
            phaseId: input.phaseId || undefined,
            title: input.caption,
            description: input.caption,
            imageUrl: url,
            imageKey,
            takenAt: new Date(),
            uploadedById: ctx.user.id,
            order: 0,
          });

          uploadedImages.push({ id: imageId, url });
        }

        return { images: uploadedImages };
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

  // ============= TIMELINE & GANTT =============
  timeline: router({
    // Get complete timeline data for Gantt chart
    get: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getProjectTimeline(input.projectId);
      }),

    // Calculate critical path
    criticalPath: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.calculateCriticalPath(input.projectId);
      }),

    // Update milestone dates (for drag & drop)
    updateMilestoneDates: protectedProcedure
      .input(z.object({
        milestoneId: z.number(),
        dueDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        await projectsDb.updateMilestoneDates(input.milestoneId, input.dueDate);
        return { success: true };
      }),

    // Update phase dates (for drag & drop)
    updatePhaseDates: protectedProcedure
      .input(z.object({
        phaseId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        await projectsDb.updatePhaseDates(input.phaseId, input.startDate, input.endDate);
        return { success: true };
      }),

    // Update milestone dependencies
    updateDependencies: protectedProcedure
      .input(z.object({
        milestoneId: z.number(),
        dependencies: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await projectsDb.updateMilestoneDependencies(input.milestoneId, input.dependencies);
        return { success: true };
      }),
  }),

  // Archviz procedures
  archviz: router({
    // Get all renders for a project
    list: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .query(async ({ input }) => {
        const renders = await projectsDb.getProjectArchvizRenders(input.projectId);
        return renders;
      }),

    // Get render by ID
    getById: protectedProcedure
      .input(z.object({
        renderId: z.number(),
      }))
      .query(async ({ input }) => {
        const render = await projectsDb.getArchvizRenderById(input.renderId);
        return render;
      }),

    // Get comments for a render
    getComments: protectedProcedure
      .input(z.object({
        renderId: z.number(),
      }))
      .query(async ({ input }) => {
        const comments = await projectsDb.getArchvizComments(input.renderId);
        return comments;
      }),

    // Add comment to a render
    addComment: protectedProcedure
      .input(z.object({
        renderId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const commentId = await projectsDb.addArchvizComment(
          input.renderId,
          ctx.user.id,
          input.content
        );
        return { commentId };
      }),

    // Update render status
    updateStatus: protectedProcedure
      .input(z.object({
        renderId: z.number(),
        status: z.enum(["pending", "approved_dc", "approved_client"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await projectsDb.updateArchvizRenderStatus(
          input.renderId,
          input.status,
          ctx.user.id,
          input.notes
        );
        return { success: true };
      }),

    // Get archviz statistics for a project
    getStats: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .query(async ({ input }) => {
        const stats = await projectsDb.getProjectArchvizStats(input.projectId);
        return stats;
      }),

    // Upload image to S3 and create render
    uploadToS3: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        compartmentId: z.number().nullable().optional(),
        name: z.string(),
        description: z.string().optional(),
        imageBase64: z.string(), // Base64 encoded image
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        
        // Convert base64 to Buffer
        const base64Data = input.imageBase64.split(",")[1] || input.imageBase64;
        const buffer = Buffer.from(base64Data, "base64");
        
        // Detect mime type from base64 header
        const mimeMatch = input.imageBase64.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = mimeType.split("/")[1] || "jpg";
        const fileKey = `archviz/${input.projectId}/${input.compartmentId || 'uncategorized'}/${timestamp}-${randomSuffix}.${extension}`;
        
        // Upload to S3
        const { url: fileUrl } = await storagePut(fileKey, buffer, mimeType);
        
        // Create render in database
        const renderId = await projectsDb.uploadArchvizRender({
          projectId: input.projectId,
          compartmentId: input.compartmentId,
          name: input.name,
          description: input.description,
          fileUrl,
          fileKey,
          mimeType,
          fileSize: buffer.length,
          uploadedById: ctx.user.id,
        });
        
        return { renderId, fileUrl };
      }),

    // Upload new render (legacy, kept for compatibility)
    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        compartmentId: z.number().nullable().optional(),
        name: z.string(),
        description: z.string().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        thumbnailUrl: z.string().optional(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const renderId = await projectsDb.uploadArchvizRender({
          ...input,
          uploadedById: ctx.user.id,
        });
        return { renderId };
      }),
  }),

  // Constructions procedures
  constructions: router({
    // List constructions for a project
    list: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .query(async ({ input }) => {
        const constructions = await projectsDb.getProjectConstructions(input.projectId);
        return constructions;
      }),

    // Get compartments for a construction
    getCompartments: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
      }))
      .query(async ({ input }) => {
        const compartments = await projectsDb.getConstructionCompartments(input.constructionId);
        return compartments;
      }),

    // Create a new compartment
    createCompartment: protectedProcedure
      .input(z.object({
        constructionId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const compartmentId = await projectsDb.createCompartment(input);
        return { compartmentId };
      }),

    updateCompartment: protectedProcedure
      .input(z.object({
        compartmentId: z.number(),
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await projectsDb.updateCompartment(input.compartmentId, input.name, input.description);
        return { success: true };
      }),

    deleteCompartment: protectedProcedure
      .input(z.object({
        compartmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Check if compartment has renders
        const hasRenders = await projectsDb.checkCompartmentHasRenders(input.compartmentId);
        if (hasRenders) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'N\u00e3o \u00e9 poss\u00edvel apagar um compartimento que cont\u00e9m renders. Por favor, mova ou apague os renders primeiro.',
          });
        }
        await projectsDb.deleteCompartment(input.compartmentId);
        return { success: true };
      }),

    reorderCompartments: protectedProcedure
      .input(z.object({
        updates: z.array(z.object({
          compartmentId: z.number(),
          order: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        await projectsDb.reorderCompartments(input.updates);
        return { success: true };
      }),
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
        status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).default("not_started"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        assignedTo: z.number().optional(),
        progress: z.number().min(0).max(100).default(0),
        order: z.number(),
      }))
      .mutation(async ({ input }) => {
        const phaseId = await projectsDb.createPhase(input);
        return { id: phaseId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        assignedTo: z.number().optional(),
        progress: z.number().min(0).max(100).optional(),
        order: z.number().optional(),
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
});
