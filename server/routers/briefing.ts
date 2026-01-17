import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { database } from "../_core/database";
import { projects } from "../../drizzle/schema";

const briefingSchema = z.object({
  projectId: z.number().int(),
  briefing: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  restrictions: z.string().optional().nullable(),
});

const getBriefingSchema = z.object({
  projectId: z.number().int(),
});

export const briefingRouter = router({
  /**
   * Obter briefing do projeto
   */
  get: protectedProcedure
    .input(getBriefingSchema)
    .query(async ({ input }) => {
      const project = await database
        .select({
          id: projects.id,
          briefing: projects.briefing,
          objectives: projects.objectives,
          restrictions: projects.restrictions,
        })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project.length) {
        throw new Error("Projeto não encontrado");
      }

      return project[0];
    }),

  /**
   * Atualizar briefing do projeto
   */
  update: protectedProcedure
    .input(briefingSchema)
    .mutation(async ({ input, ctx }) => {
      // Verificar se o utilizador tem permissão para editar o projeto
      const project = await database
        .select({ id: projects.id, createdById: projects.createdById })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project.length) {
        throw new Error("Projeto não encontrado");
      }

      // Apenas o criador do projeto ou admin podem editar
      if (
        project[0].createdById !== ctx.user.id &&
        ctx.user.role !== "admin"
      ) {
        throw new Error("Sem permissão para editar este projeto");
      }

      // Atualizar briefing
      const result = await database
        .update(projects)
        .set({
          briefing: input.briefing,
          objectives: input.objectives,
          restrictions: input.restrictions,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(projects.id, input.projectId));

      return {
        success: true,
        message: "Briefing atualizado com sucesso",
        projectId: input.projectId,
      };
    }),

  /**
   * Obter histórico de alterações do briefing
   */
  getHistory: protectedProcedure
    .input(getBriefingSchema)
    .query(async ({ input }) => {
      // Placeholder para histórico futuro
      return {
        projectId: input.projectId,
        history: [],
      };
    }),
});
