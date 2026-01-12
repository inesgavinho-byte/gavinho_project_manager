import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as projectsDb from "./projectsDb";
import * as db from "./db";
import { storagePut } from "./storage";
import * as contractHistoryDb from "./contractHistoryDb";
import * as contractMetricsDb from "./contractMetricsDb";

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
      // Contract fields
      contractValue: z.string().optional(),
      contractSignedDate: z.date().optional(),
      contractDeadline: z.date().optional(),
      contractType: z.string().optional(),
      contractDuration: z.string().optional(),
      contractNotes: z.string().optional(),
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

    listAllMembers: protectedProcedure
      .query(async () => {
        return await projectsDb.getAllUniqueTeamMembers();
      }),

    getMemberHistory: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await projectsDb.getMemberProjectHistory(input.userId);
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

    createAndAdd: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        role: z.string().min(1),
        responsibilities: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Create new user first
        const userId = await db.createSimpleUser({
          name: input.name,
          email: input.email,
          phone: input.phone,
        });
        
        // Then add to project team
        const memberId = await projectsDb.addTeamMember({
          projectId: input.projectId,
          userId,
          role: input.role,
          responsibilities: input.responsibilities,
        });
        
        return { id: memberId, userId };
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
        phaseId: z.number().nullable().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        fileData: z.string(), // base64
        fileType: z.string(),
        fileSize: z.number(),
        category: z.enum(["contract", "plan", "license", "invoice", "drawing", "specification", "photo", "report", "render", "approval", "other"]).default("other"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `projects/${input.projectId}/documents/${Date.now()}-${input.name}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        const documentId = await projectsDb.createDocument({
          projectId: input.projectId,
          phaseId: input.phaseId || null,
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

  // ============= MANAGEMENT DOCUMENTS (RESTRICTED ACCESS) =============

  managementDocs: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Only admin and project managers can access
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a Gestores de Projeto e Administração" });
        }
        return await projectsDb.getManagementDocuments(input.projectId);
      }),

    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        phaseId: z.number().nullable().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        fileData: z.string(), // base64
        fileType: z.string(),
        fileSize: z.number(),
        category: z.enum(["contract", "invoice", "receipt", "meeting_minutes", "correspondence", "legal_document", "other"]).default("other"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admin and project managers can upload
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a Gestores de Projeto e Administração" });
        }

        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `projects/${input.projectId}/management/${Date.now()}-${input.name}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        const documentId = await projectsDb.createManagementDocument({
          projectId: input.projectId,
          phaseId: input.phaseId || null,
          documentType: "project_management",
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
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Only admin and project managers can delete
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a Gestores de Projeto e Administração" });
        }
        await projectsDb.deleteDocument(input.documentId);
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

  // Phases router already defined above

  // Contract management - Admin Only
  contract: router({
    // Upload contract file
    upload: adminProcedure
      .input(z.object({
        projectId: z.number(),
        fileData: z.string(), // Base64 encoded file
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Decode base64 and upload to S3
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `contracts/${input.projectId}/${Date.now()}-${input.fileName}`;
        
        const { url } = await storagePut(
          fileKey,
          fileBuffer,
          input.mimeType
        );
        
        // Update project with contract URL
        await projectsDb.updateProject(input.projectId, {
          contractFileUrl: url,
          contractFileName: input.fileName,
        });
        
        return { url, fileKey };
      }),

    // Extract contract data from PDF
    extract: adminProcedure
      .input(z.object({
        projectId: z.number(),
        filePath: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { extractContractData, applyContractDataToProject } = await import("./contractExtractionService");
        
        // Extract data from PDF
        const contractData = await extractContractData(input.filePath);
        
        // Apply data to project
        const result = await applyContractDataToProject(input.projectId, contractData);
        
        return {
          contractData,
          result
        };
      }),

    // Extract and apply contract data from uploaded file
    uploadAndExtract: adminProcedure
      .input(z.object({
        projectId: z.number(),
        fileData: z.string(), // Base64 encoded PDF
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { writeFileSync, unlinkSync } = await import("fs");
        const { tmpdir } = await import("os");
        const { join } = await import("path");
        const { extractContractData, applyContractDataToProject } = await import("./contractExtractionService");
        
        const processingStartedAt = new Date();
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        
        // Upload to S3 first
        const fileKey = `contracts/${input.projectId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(
          fileKey,
          fileBuffer,
          'application/pdf'
        );
        
        // Create processing history record
        const historyId = await contractHistoryDb.createContractHistory({
          projectId: input.projectId,
          fileName: input.fileName,
          fileUrl: url,
          fileSize: fileBuffer.length,
          status: 'processing',
          processingStartedAt,
          uploadedById: ctx.user.id,
          isReprocessing: 0,
        });
        
        // Save file temporarily
        const tempPath = join(tmpdir(), `contract-${Date.now()}-${input.fileName}`);
        writeFileSync(tempPath, fileBuffer);
        
        try {
          // Extract data from PDF
          const contractData = await extractContractData(tempPath);
          
          // Apply data to project
          const result = await applyContractDataToProject(input.projectId, contractData);
          
          // Update project with contract URL
          await projectsDb.updateProject(input.projectId, {
            contractFileUrl: url,
            contractFileName: input.fileName,
          });
          
          // Update history with success
          const processingCompletedAt = new Date();
          const processingDurationMs = processingCompletedAt.getTime() - processingStartedAt.getTime();
          
          await contractHistoryDb.updateContractHistory(historyId, {
            status: 'success',
            extractedData: contractData as any,
            processingCompletedAt,
            processingDurationMs,
          });
          
          return {
            contractData,
            result,
            fileUrl: url,
            historyId
          };
        } catch (error: any) {
          // Update history with error
          const processingCompletedAt = new Date();
          const processingDurationMs = processingCompletedAt.getTime() - processingStartedAt.getTime();
          
          await contractHistoryDb.updateContractHistory(historyId, {
            status: 'error',
            errorMessage: error.message || 'Unknown error',
            processingCompletedAt,
            processingDurationMs,
          });
          
          throw error;
        } finally {
          // Clean up temp file
          try {
            unlinkSync(tempPath);
          } catch (e) {
            console.error('Failed to delete temp file:', e);
          }
        }
      }),

    // Get contract processing history for a project
    getHistory: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .query(async ({ input }) => {
        return await contractHistoryDb.getContractHistoryByProject(input.projectId);
      }),

    // Get all contract processing history
    getAllHistory: adminProcedure
      .query(async () => {
        return await contractHistoryDb.getAllContractHistory();
      }),

    // Reprocess a contract from history
    reprocess: adminProcedure
      .input(z.object({
        historyId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { writeFileSync, unlinkSync } = await import("fs");
        const { tmpdir } = await import("os");
        const { join } = await import("path");
        const { extractContractData, applyContractDataToProject } = await import("./contractExtractionService");
        
        // Get original processing record
        const originalHistory = await contractHistoryDb.getContractHistoryById(input.historyId);
        if (!originalHistory) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contract processing history not found',
          });
        }
        
        const processingStartedAt = new Date();
        
        // Create new processing history record (reprocessing)
        const newHistoryId = await contractHistoryDb.createContractHistory({
          projectId: originalHistory.projectId,
          fileName: originalHistory.fileName,
          fileUrl: originalHistory.fileUrl,
          fileSize: originalHistory.fileSize,
          status: 'processing',
          processingStartedAt,
          uploadedById: ctx.user.id,
          isReprocessing: 1,
          originalProcessingId: originalHistory.id,
        });
        
        try {
          // Download file from S3 URL and save temporarily
          const response = await fetch(originalHistory.fileUrl);
          if (!response.ok) {
            throw new Error('Failed to download contract file from S3');
          }
          
          const fileBuffer = Buffer.from(await response.arrayBuffer());
          const tempPath = join(tmpdir(), `reprocess-${Date.now()}-${originalHistory.fileName}`);
          writeFileSync(tempPath, fileBuffer);
          
          try {
            // Extract data from PDF
            const contractData = await extractContractData(tempPath);
            
            // Apply data to project
            const result = await applyContractDataToProject(originalHistory.projectId, contractData);
            
            // Update project with contract URL (in case it changed)
            await projectsDb.updateProject(originalHistory.projectId, {
              contractFileUrl: originalHistory.fileUrl,
              contractFileName: originalHistory.fileName,
            });
            
            // Update history with success
            const processingCompletedAt = new Date();
            const processingDurationMs = processingCompletedAt.getTime() - processingStartedAt.getTime();
            
            await contractHistoryDb.updateContractHistory(newHistoryId, {
              status: 'success',
              extractedData: contractData as any,
              processingCompletedAt,
              processingDurationMs,
            });
            
            return {
              contractData,
              result,
              historyId: newHistoryId
            };
          } finally {
            // Clean up temp file
            try {
              unlinkSync(tempPath);
            } catch (e) {
              console.error('Failed to delete temp file:', e);
            }
          }
        } catch (error: any) {
          // Update history with error
          const processingCompletedAt = new Date();
          const processingDurationMs = processingCompletedAt.getTime() - processingStartedAt.getTime();
          
          await contractHistoryDb.updateContractHistory(newHistoryId, {
            status: 'error',
            errorMessage: error.message || 'Unknown error',
            processingCompletedAt,
            processingDurationMs,
          });
          
          throw error;
        }
      }),

    // Get contract processing metrics
    getMetrics: adminProcedure
      .input(z.object({
        period: z.enum(["7d", "30d", "90d", "all"]).optional().default("30d"),
      }))
      .query(async ({ input }) => {
        const now = new Date();
        let startDate: Date | undefined;
        
        switch (input.period) {
          case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "90d":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case "all":
            startDate = undefined;
            break;
        }
        
        const [overallStats, performanceMetrics, commonErrors, fileSizeStats] = await Promise.all([
          contractMetricsDb.getOverallStatistics(startDate),
          contractMetricsDb.getPerformanceMetrics(startDate),
          contractMetricsDb.getCommonErrors(startDate, 10),
          contractMetricsDb.getFileSizeStats(startDate),
        ]);
        
        return {
          overallStats,
          performanceMetrics,
          commonErrors,
          fileSizeStats,
        };
      }),

    // Get time series data for charts
    getTimeSeries: adminProcedure
      .input(z.object({
        period: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
      }))
      .query(async ({ input }) => {
        const now = new Date();
        let startDate: Date;
        
        switch (input.period) {
          case "7d":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "90d":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        }
        
        const [timeSeries, durationDistribution] = await Promise.all([
          contractMetricsDb.getTimeSeriesData(startDate, now),
          contractMetricsDb.getDurationDistribution(startDate),
        ]);
        
        return {
          timeSeries,
          durationDistribution,
        };
      }),
  }),
});
