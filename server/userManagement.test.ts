import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("User Management & Audit Log", () => {
  const mockReq = { ip: "127.0.0.1", headers: { "user-agent": "test" } } as any;
  const mockRes = {} as any;

  const adminContext: TrpcContext = {
    user: {
      id: 1,
      openId: "admin-test",
      name: "Admin User",
      email: "admin@test.com",
      role: "admin",
      loginMethod: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      outlookAccessToken: null,
      outlookRefreshToken: null,
      outlookTokenExpiry: null,
      outlookEmail: null,
    },
    req: mockReq,
    res: mockRes,
  };

  const userContext: TrpcContext = {
    user: {
      id: 2,
      openId: "user-test",
      name: "Regular User",
      email: "user@test.com",
      role: "user",
      loginMethod: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      outlookAccessToken: null,
      outlookRefreshToken: null,
      outlookTokenExpiry: null,
      outlookEmail: null,
    },
    req: mockReq,
    res: mockRes,
  };

  const clientContext: TrpcContext = {
    user: {
      id: 3,
      openId: "client-test",
      name: "Client User",
      email: "client@test.com",
      role: "client",
      loginMethod: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      outlookAccessToken: null,
      outlookRefreshToken: null,
      outlookTokenExpiry: null,
      outlookEmail: null,
    },
    req: mockReq,
    res: mockRes,
  };

  describe("User Management Router - Admin Only", () => {
    it("should allow admin to list all users", async () => {
      const caller = appRouter.createCaller(adminContext);
      const users = await caller.userManagement.list();
      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
    });

    it("should deny non-admin to list users", async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(caller.userManagement.list()).rejects.toThrow();
    });

    it("should allow admin to update user role", async () => {
      const caller = appRouter.createCaller(adminContext);
      // Create a test user first (user ID 2 from userContext)
      await expect(
        caller.userManagement.updateRole({
          userId: 2,
          role: "client",
        })
      ).resolves.toBeDefined();
    });

    it("should deny non-admin to update user role", async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.userManagement.updateRole({
          userId: 3,
          role: "admin",
        })
      ).rejects.toThrow();
    });
  });

  describe("Audit Logs", () => {
    it("should allow admin to view audit logs", async () => {
      const caller = appRouter.createCaller(adminContext);
      const logs = await caller.userManagement.auditLogs.list({});
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should deny non-admin to view audit logs", async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.userManagement.auditLogs.list({})
      ).rejects.toThrow();
    });

    it("should create audit log when admin updates user role", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      // Update role (should create audit log)
      await caller.userManagement.updateRole({
        userId: 2,
        role: "user",
      });

      // Check audit logs
      const logs = await caller.userManagement.auditLogs.list({
        action: "change_user_role",
      });

      expect(logs.length).toBeGreaterThan(0);
      const latestLog = logs[0];
      expect(latestLog.action).toBe("change_user_role");
      expect(latestLog.userId).toBe(1); // Admin ID
      expect(latestLog.entityType).toBe("user");
    });
  });

  describe("Client Access Control", () => {
    it("should allow admin to grant client access to project", async () => {
      const caller = appRouter.createCaller(adminContext);
      await expect(
        caller.userManagement.grantClientAccess({
          projectId: 1,
          clientUserId: 3,
          accessLevel: "view",
        })
      ).resolves.toBeDefined();
    });

    it("should deny non-admin to grant client access", async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.userManagement.grantClientAccess({
          projectId: 1,
          clientUserId: 3,
          accessLevel: "view",
        })
      ).rejects.toThrow();
    });

    it("should allow admin to revoke client access", async () => {
      const caller = appRouter.createCaller(adminContext);
      await expect(
        caller.userManagement.revokeClientAccess({
          projectId: 1,
          clientUserId: 3,
        })
      ).resolves.toBeDefined();
    });
  });

  describe("Budget Access with Audit Log", () => {
    it("should create audit log when admin views budgets", async () => {
      const caller = appRouter.createCaller(adminContext);
      
      // View budgets (should create audit log)
      try {
        await caller.budgets.list({ projectId: 1 });
      } catch (error) {
        // Budget might not exist, but audit log should still be created
      }

      // Check audit logs
      const logs = await caller.userManagement.auditLogs.list({
        action: "view_budget",
      });

      expect(logs.length).toBeGreaterThan(0);
      const latestLog = logs[0];
      expect(latestLog.action).toBe("view_budget");
      expect(latestLog.userId).toBe(1); // Admin ID
    });
  });
});
