import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("reports router", () => {
  it("should generate executive summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.executive();

    expect(result).toBeDefined();
    expect(typeof result.totalProjects).toBe("number");
    expect(typeof result.activeProjects).toBe("number");
    expect(typeof result.completedProjects).toBe("number");
    expect(typeof result.overallProgress).toBe("number");
    expect(Array.isArray(result.criticalIssues)).toBe(true);
  });

  it("should generate comparison report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.comparison();

    expect(result).toBeDefined();
    expect(Array.isArray(result.projects)).toBe(true);
    expect(result.averages).toBeDefined();
    expect(typeof result.averages.avgProgress).toBe("number");
    expect(typeof result.averages.avgCompletionRate).toBe("number");
    expect(typeof result.averages.avgBudgetUtilization).toBe("number");
  });
});
