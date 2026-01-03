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

describe("notifications router", () => {
  it("should list notifications for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.list({ unreadOnly: false });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get unread count", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.unreadCount();

    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("should get user preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getPreferences();

    // May be null if no preferences set yet
    if (result) {
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("aiAlerts");
      expect(result).toHaveProperty("deadlineWarnings");
      expect(result).toHaveProperty("budgetAlerts");
    }
  });

  it("should update user preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.updatePreferences({
      aiAlerts: 1,
      deadlineWarnings: 1,
      budgetAlerts: 1,
      deadlineWarningDays: 7,
      budgetThreshold: 90,
    });

    expect(result).toEqual({ success: true });
  });

  it("should run notification checks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.runChecks();

    expect(result).toEqual({ success: true });
  });
});
