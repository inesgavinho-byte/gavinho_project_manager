import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  endorseSkill,
  getTopUserSkills,
  searchSkills,
  getSkillsByLevel,
  getTotalEndorsements,
  getSkillStats,
  type CreateSkillInput,
  type UpdateSkillInput,
} from "./userSkillsDb";
import { logActivity } from "./userActivityDb";
import { TRPCError } from "@trpc/server";

const proficiencyLevels = z.enum(["beginner", "intermediate", "advanced", "expert"]);

const createSkillSchema = z.object({
  skillName: z.string().min(1).max(100),
  proficiencyLevel: proficiencyLevels,
  yearsOfExperience: z.number().min(0).max(99).optional(),
  description: z.string().max(500).optional(),
});

const updateSkillSchema = z.object({
  proficiencyLevel: proficiencyLevels.optional(),
  yearsOfExperience: z.number().min(0).max(99).optional(),
  description: z.string().max(500).optional(),
});

export const userSkillsRouter = router({
  /**
   * Get all skills for the current user
   */
  getMySkills: protectedProcedure.query(async ({ ctx }) => {
    return getUserSkills(ctx.user.id);
  }),

  /**
   * Get a specific skill by ID
   */
  getSkill: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getSkillById(input.skillId, ctx.user.id);
    }),

  /**
   * Create a new skill
   */
  createSkill: protectedProcedure
    .input(createSkillSchema)
    .mutation(async ({ ctx, input }) => {
      const skill = await createSkill(ctx.user.id, input as CreateSkillInput);

      if (skill) {
        await logActivity(ctx.user.id, "skill_added", `Competência adicionada: ${input.skillName}`, {
          skillName: input.skillName,
          proficiencyLevel: input.proficiencyLevel,
        });
      }

      return skill;
    }),

  /**
   * Update an existing skill
   */
  updateSkill: protectedProcedure
    .input(
      z.object({
        skillId: z.number(),
        ...updateSkillSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { skillId, ...updateData } = input;

      // Verify skill belongs to user
      const skill = await getSkillById(skillId, ctx.user.id);
      if (!skill) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competência não encontrada",
        });
      }

      const updated = await updateSkill(skillId, ctx.user.id, updateData as UpdateSkillInput);

      if (updated) {
        await logActivity(ctx.user.id, "skill_updated", `Competência atualizada: ${skill.skillName}`, {
          skillName: skill.skillName,
        });
      }

      return updated;
    }),

  /**
   * Delete a skill
   */
  deleteSkill: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify skill belongs to user
      const skill = await getSkillById(input.skillId, ctx.user.id);
      if (!skill) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competência não encontrada",
        });
      }

      const success = await deleteSkill(input.skillId, ctx.user.id);

      if (success) {
        await logActivity(ctx.user.id, "skill_deleted", `Competência eliminada: ${skill.skillName}`, {
          skillName: skill.skillName,
        });
      }

      return success;
    }),

  /**
   * Endorse a skill (add endorsement)
   */
  endorseSkill: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.skillId, ctx.user.id);
      if (!skill) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competência não encontrada",
        });
      }

      return endorseSkill(input.skillId, ctx.user.id);
    }),

  /**
   * Get top skills for the current user
   */
  getTopSkills: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).optional() }))
    .query(async ({ ctx, input }) => {
      return getTopUserSkills(ctx.user.id, input.limit || 5);
    }),

  /**
   * Search skills by name
   */
  searchSkills: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return searchSkills(ctx.user.id, input.query);
    }),

  /**
   * Get skills by proficiency level
   */
  getSkillsByLevel: protectedProcedure
    .input(z.object({ level: proficiencyLevels }))
    .query(async ({ ctx, input }) => {
      return getSkillsByLevel(ctx.user.id, input.level);
    }),

  /**
   * Get total endorsements for the current user
   */
  getTotalEndorsements: protectedProcedure.query(async ({ ctx }) => {
    return getTotalEndorsements(ctx.user.id);
  }),

  /**
   * Get skill statistics for the current user
   */
  getSkillStats: protectedProcedure.query(async ({ ctx }) => {
    return getSkillStats(ctx.user.id);
  }),
});
