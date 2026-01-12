import { z } from "zod";
import { router, adminProcedure } from "./_core/trpc";
import * as userManagementDb from "./userManagementDb";

export const userManagementRouter = router({
  // List all users (admin only)
  list: adminProcedure.query(async () => {
    return await userManagementDb.getAllUsers();
  }),

  // Get users by role (admin only)
  listByRole: adminProcedure
    .input(z.object({ role: z.enum(["user", "admin", "client"]) }))
    .query(async ({ input }) => {
      return await userManagementDb.getUsersByRole(input.role);
    }),

  // Update user role (admin only)
  updateRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin", "client"]),
    }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Re-enable audit logging after fixing auditLogs table schema
      // await userManagementDb.createAuditLog({
      //   userId: ctx.user.id,
      //   action: "change_user_role",
      //   entityType: "user",
      //   entityId: input.userId,
      //   details: JSON.stringify({ newRole: input.role }),
      //   ipAddress: ctx.req.ip || null,
      //   userAgent: ctx.req.headers["user-agent"] || null,
      // });

      return await userManagementDb.updateUserRole(input.userId, input.role);
    }),

  // TODO: Restore client access functionality after fixing projectClientAccess table schema
  // grantClientAccess: adminProcedure
  //   .input(z.object({
  //     projectId: z.number(),
  //     clientUserId: z.number(),
  //     accessLevel: z.enum(["view", "comment", "upload"]).default("view"),
  //   }))
  //   .mutation(async ({ input, ctx }) => {
  //     const accessId = await userManagementDb.grantClientAccess({
  //       projectId: input.projectId,
  //       clientUserId: input.clientUserId,
  //       accessLevel: input.accessLevel,
  //       grantedById: ctx.user.id,
  //     });
  //
  //     // Create audit log
  //     await userManagementDb.createAuditLog({
  //       userId: ctx.user.id,
  //       action: "grant_client_access",
  //       entityType: "project",
  //       entityId: input.projectId,
  //       details: JSON.stringify({ clientUserId: input.clientUserId, accessLevel: input.accessLevel }),
  //       ipAddress: ctx.req.ip || null,
  //       userAgent: ctx.req.headers["user-agent"] || null,
  //     });
  //
  //     return { accessId };
  //   }),

  // TODO: Restore client access functionality after fixing projectClientAccess table schema
  // revokeClientAccess: adminProcedure
  //   .input(z.object({
  //     projectId: z.number(),
  //     clientUserId: z.number(),
  //   }))
  //   .mutation(async ({ input, ctx }) => {
  //     await userManagementDb.revokeClientAccess(input.projectId, input.clientUserId);
  //
  //     // Create audit log
  //     await userManagementDb.createAuditLog({
  //       userId: ctx.user.id,
  //       action: "revoke_client_access",
  //       entityType: "project",
  //       entityId: input.projectId,
  //       details: JSON.stringify({ clientUserId: input.clientUserId }),
  //       ipAddress: ctx.req.ip || null,
  //       userAgent: ctx.req.headers["user-agent"] || null,
  //     });
  //
  //     return { success: true };
  //   }),

  // TODO: Restore client access functionality after fixing projectClientAccess table schema
  // getProjectClients: adminProcedure
  //   .input(z.object({ projectId: z.number() }))
  //   .query(async ({ input }) => {
  //     return await userManagementDb.getProjectClients(input.projectId);
  //   }),

  // TODO: Restore audit logs functionality after fixing auditLogs table schema
  // auditLogs: router({
  //   list: adminProcedure
  //     .input(z.object({
  //       userId: z.number().optional(),
  //       action: z.string().optional(),
  //       entityType: z.string().optional(),
  //       limit: z.number().optional(),
  //     }))
  //     .query(async ({ input }) => {
  //       return await userManagementDb.getAuditLogs(input);
  //     }),
  //
  //   byEntity: adminProcedure
  //     .input(z.object({
  //       entityType: z.string(),
  //       entityId: z.number(),
  //     }))
  //     .query(async ({ input }) => {
  //       return await userManagementDb.getAuditLogsByEntity(input.entityType, input.entityId);
  //     }),
  // })
});
