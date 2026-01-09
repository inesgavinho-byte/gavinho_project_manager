import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Team Management", () => {
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

  it("should get user assignments", async () => {
    const result = await caller.teamManagement.getMyAssignments();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get all tasks", async () => {
    const result = await caller.teamManagement.getAllTasks();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get time summary", async () => {
    const startDate = new Date("2025-01-01");
    const endDate = new Date("2025-01-31");

    const result = await caller.teamManagement.getTimeSummary({
      startDate,
      endDate,
    });

    expect(result).toBeDefined();
    expect(result.totalHours !== undefined).toBe(true);
    expect(typeof result.daysWorked).toBe("number");
    expect(typeof result.tasksCompleted).toBe("number");
  });

  it("should log time entry", async () => {
    const result = await caller.teamManagement.logTime({
      description: "Test work",
      hours: 8,
      date: new Date(),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should get user availability", async () => {
    const startDate = new Date("2025-01-01");
    const endDate = new Date("2025-01-31");

    const result = await caller.teamManagement.getMyAvailability({
      startDate,
      endDate,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should set availability", async () => {
    const result = await caller.teamManagement.setAvailability({
      date: new Date(),
      status: "available",
      notes: "Test availability",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should get productivity report", async () => {
    const startDate = new Date("2025-01-01");
    const endDate = new Date("2025-01-31");

    const result = await caller.teamManagement.getProductivityReport({
      startDate,
      endDate,
    });

    expect(result).toBeDefined();
    expect(result.totalHours !== undefined).toBe(true);
    expect(typeof result.daysWorked).toBe("number");
    expect(typeof result.tasksCompleted).toBe("number");
    expect(typeof result.averageHoursPerDay).toBe("number");
  });
});
