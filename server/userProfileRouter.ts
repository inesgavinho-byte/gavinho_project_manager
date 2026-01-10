import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc.js";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  changePassword,
  getUserStats,
  searchUsers,
} from "./userProfileDb.js";
import {
  getUserActivities,
  getRecentActivities,
  logActivity,
  getActivityCountByType,
} from "./userActivityDb.js";
import {
  getOrCreateUserPreferences,
  updateUserPreferences,
  updateNotificationPreferences,
  updateDisplayPreferences,
  updateDashboardPreferences,
  resetPreferencesToDefaults,
} from "./userPreferencesDb.js";
import { storagePut } from "./storage.js";

export const userProfileRouter = router({
  /**
   * Get current user's profile
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return getUserProfile(ctx.user.id);
  }),

  /**
   * Get user profile by ID (for viewing other users)
   */
  getUserById: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return getUserProfile(input.userId);
    }),

  /**
   * Update current user's profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        dateOfBirth: z.string().optional(), // ISO date string
        linkedin: z.string().url().optional().or(z.literal("")),
        website: z.string().url().optional().or(z.literal("")),
        jobTitle: z.string().optional(),
        department: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dateOfBirth, ...rest } = input;

      const updateData: any = { ...rest };
      if (dateOfBirth) {
        updateData.dateOfBirth = new Date(dateOfBirth);
      }

      const updated = await updateUserProfile(ctx.user.id, updateData);

      // Log activity
      await logActivity(
        ctx.user.id,
        "profile_updated",
        "Atualizou o perfil",
        "user",
        ctx.user.id
      );

      return updated;
    }),

  /**
   * Upload profile picture
   */
  uploadProfilePicture: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64
      const buffer = Buffer.from(input.fileData, "base64");

      // Generate unique file key
      const timestamp = Date.now();
      const fileKey = `users/${ctx.user.id}/profile-${timestamp}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Update user profile
      const updated = await updateProfilePicture(ctx.user.id, url);

      // Log activity
      await logActivity(
        ctx.user.id,
        "profile_picture_updated",
        "Atualizou a foto de perfil",
        "user",
        ctx.user.id
      );

      return updated;
    }),

  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string().min(6),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await changePassword(
        ctx.user.id,
        input.oldPassword,
        input.newPassword
      );

      if (result.success) {
        // Log activity
        await logActivity(
          ctx.user.id,
          "password_changed",
          "Alterou a password",
          "user",
          ctx.user.id
        );
      }

      return result;
    }),

  /**
   * Get user statistics
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    return getUserStats(ctx.user.id);
  }),

  /**
   * Get user activities
   */
  getMyActivities: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        actionType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getUserActivities(ctx.user.id, input);
    }),

  /**
   * Get activity count by type
   */
  getActivityCountByType: protectedProcedure.query(async ({ ctx }) => {
    return getActivityCountByType(ctx.user.id);
  }),

  /**
   * Get user preferences
   */
  getMyPreferences: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreateUserPreferences(ctx.user.id);
  }),

  /**
   * Update preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.number().optional(),
        pushNotifications: z.number().optional(),
        notificationFrequency: z
          .enum(["realtime", "hourly", "daily", "weekly"])
          .optional(),
        theme: z.enum(["light", "dark", "auto"]).optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
        dateFormat: z.string().optional(),
        defaultView: z.string().optional(),
        showCompletedProjects: z.number().optional(),
        projectsPerPage: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateUserPreferences(ctx.user.id, input);

      // Log activity
      await logActivity(
        ctx.user.id,
        "preferences_updated",
        "Atualizou as preferências",
        "user",
        ctx.user.id
      );

      return updated;
    }),

  /**
   * Reset preferences to defaults
   */
  resetPreferences: protectedProcedure.mutation(async ({ ctx }) => {
    const reset = await resetPreferencesToDefaults(ctx.user.id);

    // Log activity
    await logActivity(
      ctx.user.id,
      "preferences_reset",
      "Restaurou as preferências padrão",
      "user",
      ctx.user.id
    );

    return reset;
  }),

  /**
   * Search users (for mentions, team assignments, etc.)
   */
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return searchUsers(input.query);
    }),

  /**
   * Get recent activities (admin only)
   */
  getRecentActivities: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return getRecentActivities(input.limit);
    }),
});
