import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc.js";
import { storagePut } from "./storage.js";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  changePassword,
  getUserStats,
  searchUsers,
} from "./userProfileDb.js";

// Placeholder functions for disabled functionality
const logActivity = async () => { /* disabled */ };
const getUserActivities = async () => { throw new Error("User activity functionality disabled - table schema needs fixing"); };
const getRecentActivities = async () => { throw new Error("User activity functionality disabled - table schema needs fixing"); };
const getActivityCountByType = async () => { throw new Error("User activity functionality disabled - table schema needs fixing"); };
const getOrCreateUserPreferences = async () => { throw new Error("User preferences functionality disabled - table schema needs fixing"); };
const updateUserPreferences = async () => { throw new Error("User preferences functionality disabled - table schema needs fixing"); };
const resetPreferencesToDefaults = async () => { throw new Error("User preferences functionality disabled - table schema needs fixing"); };

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
        dateOfBirth: z.string().optional(),
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

      return updated;
    }),

  /**
   * Upload profile picture
   */
  uploadProfilePicture: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");

      const timestamp = Date.now();
      const fileKey = `users/${ctx.user.id}/profile-${timestamp}-${input.fileName}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const updated = await updateProfilePicture(ctx.user.id, url);

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

      return result;
    }),

  /**
   * Get user statistics
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    return getUserStats(ctx.user.id);
  }),

  /**
   * Search users (for mentions, team assignments, etc.)
   */
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return searchUsers(input.query);
    }),
});
