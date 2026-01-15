import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as projectService from '../projectManagementService';

export const projectManagementRouter = router({
  // ============ PROJETOS ============

  getProject: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await projectService.getProjectById(input.projectId);
      return { success: true, data: project };
    }),

  listProjects: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      archived: z.boolean().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const projects = await projectService.listProjects(input);
      return { success: true, data: projects };
    }),

  createProject: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budget: z.number().optional(),
      clientName: z.string().optional(),
      location: z.string().optional(),
      projectType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await projectService.createProject({
        ...input,
        createdById: ctx.user.id,
      });
      return { success: true, data: result };
    }),

  updateProject: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        progress: z.number().optional(),
        budget: z.number().optional(),
        actualCost: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const project = await projectService.updateProject(input.projectId, input.data as any);
      return { success: true, data: project };
    }),

  // ============ MARCOS ============

  getMilestones: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const milestones = await projectService.getMilestonesByProject(input.projectId);
      return { success: true, data: milestones };
    }),

  createMilestone: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      phaseId: z.number().optional(),
      name: z.string(),
      description: z.string().optional(),
      dueDate: z.string(),
      isKeyMilestone: z.boolean().optional(),
      dependencies: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await projectService.createMilestone(input);
      return { success: true, data: result };
    }),

  updateMilestone: protectedProcedure
    .input(z.object({
      milestoneId: z.number(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        status: z.string().optional(),
        isKeyMilestone: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const milestone = await projectService.updateMilestone(input.milestoneId, input.data as any);
      return { success: true, data: milestone };
    }),

  completeMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.number() }))
    .mutation(async ({ input }) => {
      await projectService.completeMilestone(input.milestoneId);
      return { success: true };
    }),

  getMilestoneStats: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const stats = await projectService.getMilestoneStats(input.projectId);
      return { success: true, data: stats };
    }),

  // ============ EQUIPA ============

  getTeam: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const team = await projectService.getProjectTeam(input.projectId);
      return { success: true, data: team };
    }),

  addTeamMember: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      role: z.string(),
      responsibilities: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await projectService.addTeamMember(input);
      return { success: true, data: result };
    }),

  removeTeamMember: protectedProcedure
    .input(z.object({ teamMemberId: z.number() }))
    .mutation(async ({ input }) => {
      await projectService.removeTeamMember(input.teamMemberId);
      return { success: true };
    }),

  updateTeamMemberRole: protectedProcedure
    .input(z.object({
      teamMemberId: z.number(),
      role: z.string(),
      responsibilities: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await projectService.updateTeamMemberRole(input.teamMemberId, input.role, input.responsibilities);
      return { success: true };
    }),

  // ============ DOCUMENTOS ============

  getDocuments: publicProcedure
    .input(z.object({
      projectId: z.number(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const documents = await projectService.getProjectDocuments(input.projectId, input.category);
      return { success: true, data: documents };
    }),

  addDocument: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      phaseId: z.number().optional(),
      name: z.string(),
      description: z.string().optional(),
      fileUrl: z.string(),
      fileKey: z.string(),
      fileType: z.string().optional(),
      fileSize: z.number().optional(),
      category: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await projectService.addDocument({
        ...input,
        uploadedById: ctx.user.id,
      });
      return { success: true, data: result };
    }),

  // ============ GALERIA ============

  getGallery: publicProcedure
    .input(z.object({
      projectId: z.number(),
      phaseId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const gallery = await projectService.getProjectGallery(input.projectId, input.phaseId);
      return { success: true, data: gallery };
    }),

  addGalleryImage: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      phaseId: z.number().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string(),
      imageKey: z.string(),
      thumbnailUrl: z.string().optional(),
      category: z.string().optional(),
      takenAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await projectService.addGalleryImage({
        ...input,
        uploadedById: ctx.user.id,
      });
      return { success: true, data: result };
    }),

  reorderGallery: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      imageIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      await projectService.reorderGalleryImages(input.projectId, input.imageIds);
      return { success: true };
    }),

  // ============ FASES ============

  getPhases: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const phases = await projectService.getProjectPhases(input.projectId);
      return { success: true, data: phases };
    }),

  createPhase: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      order: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await projectService.createPhase(input);
      return { success: true, data: result };
    }),

  updatePhaseProgress: protectedProcedure
    .input(z.object({
      phaseId: z.number(),
      progress: z.number(),
    }))
    .mutation(async ({ input }) => {
      await projectService.updatePhaseProgress(input.phaseId, input.progress);
      return { success: true };
    }),

  // ============ TIMELINE & STATS ============

  getTimeline: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const timeline = await projectService.getProjectTimeline(input.projectId);
      return { success: true, data: timeline };
    }),

  getStats: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const stats = await projectService.getProjectStats(input.projectId);
      return { success: true, data: stats };
    }),
});
