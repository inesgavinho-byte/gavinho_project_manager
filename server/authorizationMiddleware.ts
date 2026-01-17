import { TRPCError } from "@trpc/server";
import type { Context } from "./routers";

/**
 * Tipos de roles disponíveis no sistema
 */
export type UserRole = "admin" | "user" | "client";

/**
 * Middleware para verificar se o utilizador tem um papel específico
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Utilizador não autenticado",
      });
    }

    const userRole = (ctx.user.role || "user") as UserRole;

    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Acesso negado. Papéis permitidos: ${allowedRoles.join(", ")}. Seu papel: ${userRole}`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Middleware para verificar se o utilizador é admin
 */
export function requireAdmin() {
  return requireRole("admin");
}

/**
 * Middleware para verificar se o utilizador é gestor (admin ou user com permissões)
 */
export function requireManager() {
  return requireRole("admin", "user");
}

/**
 * Middleware para verificar se o utilizador é cliente
 */
export function requireClient() {
  return requireRole("admin", "client");
}

/**
 * Middleware para verificar se o utilizador é autenticado
 */
export function requireAuth() {
  return async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Utilizador não autenticado",
      });
    }

    return next({ ctx });
  };
}

/**
 * Função auxiliar para verificar se o utilizador é admin
 */
export function isAdmin(user: any): boolean {
  return user?.role === "admin";
}

/**
 * Função auxiliar para verificar se o utilizador tem um papel específico
 */
export function hasRole(user: any, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Função auxiliar para verificar se o utilizador tem qualquer um dos papéis
 */
export function hasAnyRole(user: any, roles: UserRole[]): boolean {
  return roles.includes(user?.role || "user");
}
