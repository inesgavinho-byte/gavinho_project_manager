import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";
import { hasClientAccess } from "../userManagementDb";

/**
 * Client procedure middleware - validates that user is a client
 * and has access to the requested project
 */
export const clientProcedure = protectedProcedure.use(async ({ ctx, next, rawInput }) => {
  // Check if user is a client
  if (ctx.user.role !== "client") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This endpoint is only accessible to clients",
    });
  }

  // Extract projectId from input (assumes input has projectId field)
  const input = rawInput as { projectId?: number };
  
  if (input.projectId) {
    // Verify client has access to this project
    const hasAccess = await hasClientAccess(input.projectId, ctx.user.id);
    
    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this project",
      });
    }
  }

  return next({ ctx });
});

/**
 * Client or Admin procedure - allows both clients (with project access check)
 * and admins (unrestricted access)
 */
export const clientOrAdminProcedure = protectedProcedure.use(async ({ ctx, next, rawInput }) => {
  // Admins have unrestricted access
  if (ctx.user.role === "admin") {
    return next({ ctx });
  }

  // For clients, validate project access
  if (ctx.user.role === "client") {
    const input = rawInput as { projectId?: number };
    
    if (input.projectId) {
      const hasAccess = await hasClientAccess(input.projectId, ctx.user.id);
      
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this project",
        });
      }
    }
    
    return next({ ctx });
  }

  // Regular users don't have access
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have required permissions",
  });
});
