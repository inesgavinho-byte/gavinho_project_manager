import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, like, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export type UserRole = "admin" | "user" | "client";

export interface UserWithAudit {
  id: number;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  lastSignedIn: string;
  status: "active" | "inactive";
}

/**
 * Serviço de gestão de utilizadores e papéis
 */
export class UserManagementService {
  /**
   * Listar todos os utilizadores com filtros opcionais
   */
  static async listUsers(filters?: {
    role?: UserRole;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserWithAudit[]> {
    const db = getDb();
    let query = db.select().from(users);

    if (filters?.role) {
      query = query.where(eq(users.role, filters.role));
    }

    if (filters?.search) {
      query = query.where(
        like(users.name, `%${filters.search}%`)
      );
    }

    const result = await query.limit(filters?.limit || 50).offset(filters?.offset || 0);

    return result.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role || "user") as UserRole,
      createdAt: u.createdAt,
      lastSignedIn: u.lastSignedIn,
      status: new Date(u.lastSignedIn) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? "active" : "inactive",
    }));
  }

  /**
   * Obter utilizador por ID
   */
  static async getUserById(userId: number): Promise<UserWithAudit | null> {
    const db = getDb();
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const u = result[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role || "user") as UserRole,
      createdAt: u.createdAt,
      lastSignedIn: u.lastSignedIn,
      status: new Date(u.lastSignedIn) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? "active" : "inactive",
    };
  }

  /**
   * Atualizar papel de utilizador
   */
  static async updateUserRole(
    userId: number,
    newRole: UserRole,
    changedBy: number
  ): Promise<UserWithAudit> {
    const db = getDb();

    // Verificar se o utilizador existe
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilizador não encontrado",
      });
    }

    // Atualizar papel
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

    // Retornar utilizador atualizado
    return this.getUserById(userId) as Promise<UserWithAudit>;
  }

  /**
   * Desativar utilizador (sem eliminar dados)
   */
  static async deactivateUser(userId: number, changedBy: number): Promise<void> {
    const db = getDb();

    // Verificar se o utilizador existe
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilizador não encontrado",
      });
    }

    // Nota: Desativação seria implementada com um campo "status" na tabela users
    // Por enquanto, apenas registamos a intenção
    console.log(`User ${userId} deactivation requested by ${changedBy}`);
  }

  /**
   * Reativar utilizador
   */
  static async reactivateUser(userId: number, changedBy: number): Promise<void> {
    const db = getDb();

    // Verificar se o utilizador existe
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilizador não encontrado",
      });
    }

    // Nota: Reativação seria implementada com um campo "status" na tabela users
    console.log(`User ${userId} reactivation requested by ${changedBy}`);
  }

  /**
   * Contar utilizadores por papel
   */
  static async countUsersByRole(): Promise<Record<UserRole, number>> {
    const db = getDb();
    const result = await db.select().from(users);

    const counts = {
      admin: 0,
      user: 0,
      client: 0,
    };

    result.forEach((u) => {
      const role = (u.role || "user") as UserRole;
      counts[role]++;
    });

    return counts;
  }

  /**
   * Verificar se um utilizador é admin
   */
  static async isAdmin(userId: number): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.role === "admin";
  }

  /**
   * Verificar se um utilizador tem um papel específico
   */
  static async hasRole(userId: number, role: UserRole): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.role === role;
  }
}
