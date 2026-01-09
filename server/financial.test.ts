import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Financial Dashboard", () => {
  const mockUser = {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    role: "admin" as const,
  };

  const mockContext: Context = {
    user: mockUser,
  };

  const caller = appRouter.createCaller(mockContext);

  it("should get financial KPIs", async () => {
    const result = await caller.financial.getFinancialKPIs();
    expect(result).toBeDefined();
    expect(result.totalBudget !== undefined).toBe(true);
    expect(result.totalSpent !== undefined).toBe(true);
    expect(result.budgetUtilization !== undefined).toBe(true);
    expect(result.averageProfitMargin !== undefined).toBe(true);
  });

  it("should get budget evolution", async () => {
    const result = await caller.financial.getBudgetEvolution();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get cost comparison", async () => {
    const result = await caller.financial.getCostComparison();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get project profitability", async () => {
    const result = await caller.financial.getProjectProfitability();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get budget alerts", async () => {
    const result = await caller.financial.getBudgetAlerts();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get expense trends", async () => {
    const result = await caller.financial.getExpenseTrends();
    expect(Array.isArray(result)).toBe(true);
  });
});
