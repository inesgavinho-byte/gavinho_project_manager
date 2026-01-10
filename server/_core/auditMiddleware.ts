import { createAuditLog } from "../userManagementDb";
import type { MiddlewareFunction } from "@trpc/server";
import type { TrpcContext } from "./context";

/**
 * Audit middleware - automatically logs sensitive operations
 * Usage: procedure.use(auditLog("action_name", "entity_type"))
 */
export const auditLog = (action: string, entityType: string): MiddlewareFunction<any, TrpcContext, any> => {
  return async ({ ctx, next, rawInput }) => {
    // Only log for authenticated users
    if (!ctx.user) {
      return next({ ctx });
    }

    const input = rawInput as any;
    const entityId = input?.id || input?.projectId || input?.userId || null;

    // Execute the procedure
    const result = await next({ ctx });

    // Log the action after successful execution
    try {
      await createAuditLog({
        userId: ctx.user.id,
        action,
        entityType,
        entityId,
        details: JSON.stringify({
          input: rawInput,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: ctx.req.ip || null,
        userAgent: ctx.req.headers["user-agent"] || null,
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error("Audit log failed:", error);
    }

    return result;
  };
};

/**
 * Audit view middleware - logs when users view sensitive data
 */
export const auditView = (entityType: string) => {
  return auditLog(`view_${entityType}`, entityType);
};

/**
 * Audit modify middleware - logs when users modify sensitive data
 */
export const auditModify = (action: "create" | "update" | "delete", entityType: string) => {
  return auditLog(`${action}_${entityType}`, entityType);
};
