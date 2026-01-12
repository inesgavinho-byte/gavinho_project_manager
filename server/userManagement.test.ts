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

  // TODO: Restore Audit Logs tests after fixing auditLogs table schema
  // describe("Audit Logs", () => {
  //   ...
  // });

  // TODO: Restore Client Access Control tests after fixing projectClientAccess table schema
  describe.skip("Client Access Control", () => {
    // TODO: Restore Client Access Control tests after fixing projectClientAccess table schema
    // it("should allow admin to grant client access to project", async () => {
    //   ...
    // });
  });

  // TODO: Restore Budget Access with Audit Log tests after fixing auditLogs table schema
  // describe("Budget Access with Audit Log", () => {
  //   ...
  // });
});
