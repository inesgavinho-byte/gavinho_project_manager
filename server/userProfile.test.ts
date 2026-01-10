import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  getUserStats,
  searchUsers,
} from "./userProfileDb";
import { eq } from "drizzle-orm";

describe("User Profile DB Functions", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [result] = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      loginMethod: "test",
      role: "user",
    });

    testUserId = Number(result.insertId);
  });

  afterAll(async () => {
    // Clean up test user
    const db = await getDb();
    if (!db) return;

    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should get user profile by ID", async () => {
    const profile = await getUserProfile(testUserId);
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(testUserId);
    expect(profile?.name).toBe("Test User");
  });

  it("should update user profile", async () => {
    const updated = await updateUserProfile(testUserId, {
      bio: "This is a test bio",
      phone: "+351 912 345 678",
      location: "Lisbon, Portugal",
      jobTitle: "Test Architect",
    });

    expect(updated).toBeDefined();
    expect(updated?.bio).toBe("This is a test bio");
    expect(updated?.phone).toBe("+351 912 345 678");
    expect(updated?.location).toBe("Lisbon, Portugal");
    expect(updated?.jobTitle).toBe("Test Architect");
  });

  it("should update profile picture URL", async () => {
    const pictureUrl = "https://example.com/profile.jpg";
    const updated = await updateProfilePicture(testUserId, pictureUrl);

    expect(updated).toBeDefined();
    expect(updated?.profilePicture).toBe(pictureUrl);
  });

  it("should get user statistics", async () => {
    const stats = await getUserStats(testUserId);

    expect(stats).toBeDefined();
    expect(stats?.projectsCreated).toBeGreaterThanOrEqual(0);
    expect(stats?.projectsAsMember).toBeGreaterThanOrEqual(0);
    expect(stats?.totalProjects).toBeGreaterThanOrEqual(0);
    expect(stats?.totalHours).toBeGreaterThanOrEqual(0);
  });

  it("should search users by name", async () => {
    const results = await searchUsers("Test");

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    // Should find our test user
    const found = results.find((u) => u.id === testUserId);
    expect(found).toBeDefined();
  });

  it("should return null for non-existent user", async () => {
    const profile = await getUserProfile(99999);
    expect(profile).toBeNull();
  });
});
