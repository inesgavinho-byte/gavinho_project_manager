import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Admin Permissions", () => {
  const adminContext: Context = {
    user: {
      id: 1,
      openId: "admin_test",
      name: "Admin User",
      email: "admin@test.com",
      role: "admin",
      loginMethod: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      outlookAccessToken: null,
      outlookRefreshToken: null,
      outlookTokenExpiry: null,
      outlookEmail: null,
    },
    req: {} as any,
    res: {} as any,
  };

  const userContext: Context = {
    user: {
      id: 2,
      openId: "user_test",
      name: "Regular User",
      email: "user@test.com",
      role: "user",
      loginMethod: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      outlookAccessToken: null,
      outlookRefreshToken: null,
      outlookTokenExpiry: null,
      outlookEmail: null,
    },
    req: {} as any,
    res: {} as any,
  };

  describe("Budget Router - Admin Only", () => {
    it("should allow admin to list budgets", async () => {
      const caller = appRouter.createCaller(adminContext);
      // Should not throw FORBIDDEN error
      await expect(
        caller.budgets.list({ projectId: 1 })
      ).resolves.toBeDefined();
    });

    it("should deny non-admin to list budgets", async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.budgets.list({ projectId: 1 })
      ).rejects.toThrow();
    });

    it("should allow admin to create budget", async () => {
      const caller = appRouter.createCaller(adminContext);
      await expect(
        caller.budgets.create({
          projectId: 1,
          name: "Test Budget",
          category: "Construction",
          budgetedAmount: "10000.00",
          status: "draft",
        })
      ).resolves.toBeDefined();
    });

    it("should deny non-admin to create budget", async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.budgets.create({
          projectId: 1,
          name: "Test Budget",
          category: "Construction",
          budgetedAmount: "10000.00",
          status: "draft",
        })
      ).rejects.toThrow();
    });
  });

  describe("Contract Router - Admin Only", () => {
    it("should allow admin to upload contract", async () => {
      const caller = appRouter.createCaller(adminContext);
      // Should not throw FORBIDDEN error
      await expect(
        caller.projects.contract.upload({
          projectId: 1,
          fileData: Buffer.from("test").toString("base64"),
          fileName: "contract.pdf",
          mimeType: "application/pdf",
        })
      ).resolves.toBeDefined();
    });

    it("should deny non-admin to upload contract", async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.projects.contract.upload({
          projectId: 1,
          fileData: Buffer.from("test").toString("base64"),
          fileName: "contract.pdf",
          mimeType: "application/pdf",
        })
      ).rejects.toThrow();
    });
  });
});
