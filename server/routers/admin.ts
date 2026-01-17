import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { UserManagementService } from "../userManagementService";
import { TRPCError } from "@trpc/server";
import { requireRole } from "../authorizationMiddleware";

/**
 * Router para administração de utilizadores e papéis
 * Apenas admins podem aceder a estes endpoints
 */
export const adminRouter = router({
  /**
   * Listar todos os utilizadores com filtros opcionais
   */
  listUsers: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        role: z.enum(["admin", "user", "client"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      return await UserManagementService.listUsers({
        role: input.role,
        search: input.search,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  /**
   * Obter utilizador por ID
   */
  getUser: protectedProcedure
    .use(requireRole("admin"))
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await UserManagementService.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilizador não encontrado",
        });
      }
      return user;
    }),

  /**
   * Atualizar papel de utilizador
   */
  updateUserRole: protectedProcedure
    .use(requireRole("admin"))
    .input(
      z.object({
        userId: z.number(),
        newRole: z.enum(["admin", "user", "client"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilizador não autenticado",
        });
      }

      // Não permitir que um utilizador remova a si próprio de admin
      if (input.userId === ctx.user.id && input.newRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Não pode remover a si próprio de admin",
        });
      }

      return await UserManagementService.updateUserRole(
        input.userId,
        input.newRole,
        ctx.user.id
      );
    }),

  /**
   * Desativar utilizador
   */
  deactivateUser: protectedProcedure
    .use(requireRole("admin"))
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilizador não autenticado",
        });
      }

      // Não permitir desativar a si próprio
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Não pode desativar a si próprio",
        });
      }

      await UserManagementService.deactivateUser(input.userId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Reativar utilizador
   */
  reactivateUser: protectedProcedure
    .use(requireRole("admin"))
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Utilizador não autenticado",
        });
      }

      await UserManagementService.reactivateUser(input.userId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Obter histórico de auditoria de um utilizador
   */
  getUserAuditLog: protectedProcedure
    .use(requireRole("admin"))
    .input(z.object({ userId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await UserManagementService.getUserAuditLog(
        input.userId,
        input.limit
      );
    }),

  /**
   * Contar utilizadores por papel
   */
  countUsersByRole: protectedProcedure
    .use(requireRole("admin"))
    .query(async () => {
      return await UserManagementService.countUsersByRole();
    }),

  /**
   * Obter estatísticas de utilizadores
   */
  getUserStats: protectedProcedure
    .use(requireRole("admin"))
    .query(async () => {
      const counts = await UserManagementService.countUsersByRole();
      const allUsers = await UserManagementService.listUsers({ limit: 1000 });

      const activeUsers = allUsers.filter((u) => u.status === "active").length;
      const inactiveUsers = allUsers.filter((u) => u.status === "inactive").length;

      return {
        totalUsers: allUsers.length,
        activeUsers,
        inactiveUsers,
        byRole: counts,
      };
    }),
});
