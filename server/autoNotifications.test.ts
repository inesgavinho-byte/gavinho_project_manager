/**
 * Tests for Auto Notification Service
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runAutoNotifications, generateTestNotifications } from "./autoNotificationService";
import { getDb } from "./db";
import { projects, notifications } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

describe("Auto Notification Service", () => {
  let testProjectId: number;
  let testUserId: number = 1; // Assuming user ID 1 exists

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test project with specific conditions
    const result = await db.insert(projects).values({
      name: "Test Auto Notifications Project",
      description: "Project for testing auto notifications",
      status: "in_progress",
      priority: "high",
      startDate: new Date("2024-01-01"),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      progress: 75,
      budget: "100000",
      actualCost: "91000", // 91% of budget
      createdById: testUserId,
      contractDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      contractValue: "50000",
    });

    testProjectId = Number(result.insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test project
    await db.delete(projects).where(eq(projects.id, testProjectId));

    // Clean up test notifications
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );
  });

  it("should run auto notification checks without errors", async () => {
    const result = await runAutoNotifications();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("created");
    expect(result).toHaveProperty("skipped");
    expect(typeof result.created).toBe("number");
    expect(typeof result.skipped).toBe("number");
  });

  it("should generate test notifications for a project", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Count notifications before
    const beforeCount = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );

    // Generate test notifications
    await generateTestNotifications(testProjectId, testUserId);

    // Count notifications after
    const afterCount = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );

    // Should have created 3 test notifications
    expect(afterCount.length).toBe(beforeCount.length + 3);

    // Verify notification types
    const testNotifs = afterCount.slice(-3);
    const types = testNotifs.map((n) => n.type);
    expect(types).toContain("system");
    expect(types).toContain("deadline_warning");
    expect(types).toContain("budget_exceeded");

    // Verify all test notifications have [TESTE] prefix
    const allHaveTestPrefix = testNotifs.every((n) => n.title.includes("[TESTE]"));
    expect(allHaveTestPrefix).toBe(true);
  });

  it("should detect progress milestones", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clear previous notifications
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );

    // Update project to 75% progress
    await db
      .update(projects)
      .set({ progress: 76 })
      .where(eq(projects.id, testProjectId));

    // Run checks
    const result = await runAutoNotifications();

    // Should create at least one notification for 75% milestone
    const progressNotifs = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId),
          eq(notifications.type, "system")
        )
      );

    expect(progressNotifs.length).toBeGreaterThan(0);
    expect(progressNotifs[0].title).toContain("75%");
  });

  it("should detect budget thresholds", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clear previous notifications
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );

    // Update project to 91% budget usage
    await db
      .update(projects)
      .set({ budget: "100000", actualCost: "91000" })
      .where(eq(projects.id, testProjectId));

    // Run checks
    await runAutoNotifications();

    // Should create notification for 90% budget threshold
    const budgetNotifs = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId),
          eq(notifications.type, "budget_exceeded")
        )
      );

    expect(budgetNotifs.length).toBeGreaterThan(0);
    expect(budgetNotifs[0].title).toContain("90%");
  });

  it("should not create duplicate notifications on same day", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clear previous notifications
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );

    // Run checks first time
    const result1 = await runAutoNotifications();
    const count1 = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );

    // Run checks second time (should skip duplicates)
    const result2 = await runAutoNotifications();
    const count2 = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.projectId, testProjectId),
          eq(notifications.userId, testUserId)
        )
      );

    // Should not create duplicates
    expect(count2.length).toBe(count1.length);
    expect(result2.skipped).toBeGreaterThan(0);
  });
});
