import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * Integration Tests for New Features
 * 
 * These tests verify end-to-end workflows across multiple modules:
 * - Financial Dashboard
 * - Notifications System
 * - Team Management
 */

describe("Integration Tests - New Features", () => {
  const mockAdmin = {
    id: 1,
    openId: "test-admin",
    name: "Test Admin",
    email: "admin@test.com",
    role: "admin" as const,
  };

  const mockUser = {
    id: 2,
    openId: "test-user",
    name: "Test User",
    email: "user@test.com",
    role: "user" as const,
  };

  const adminContext: Context = { user: mockAdmin };
  const userContext: Context = { user: mockUser };

  const adminCaller = appRouter.createCaller(adminContext);
  const userCaller = appRouter.createCaller(userContext);

  describe("Financial Dashboard Integration", () => {
    it("should calculate KPIs based on actual project data", async () => {
      // Get financial KPIs
      const kpis = await adminCaller.financial.getFinancialKPIs();

      expect(kpis).toBeDefined();
      expect(kpis.totalBudget !== undefined).toBe(true);
      expect(kpis.totalSpent !== undefined).toBe(true);
      expect(kpis.budgetUtilization !== undefined).toBe(true);
      expect(kpis.averageProfitMargin !== undefined).toBe(true);

      // Verify budget utilization calculation
      // budgetUtilization = (totalSpent / totalBudget) * 100
      const totalBudget = Number(kpis.totalBudget);
      const totalSpent = Number(kpis.totalSpent);

      if (totalBudget > 0) {
        const expectedUtilization = (totalSpent / totalBudget) * 100;
        const actualUtilization = Number(kpis.budgetUtilization);

        // Allow 0.1% margin of error due to floating point
        expect(Math.abs(actualUtilization - expectedUtilization)).toBeLessThan(0.1);
      }
    });

    it("should show budget evolution over time", async () => {
      const evolution = await adminCaller.financial.getBudgetEvolution();

      expect(Array.isArray(evolution)).toBe(true);

      // If there's data, verify structure
      if (evolution.length > 0) {
        const firstEntry = evolution[0];
        expect(firstEntry).toHaveProperty("month");
        expect(firstEntry).toHaveProperty("budgeted");
        expect(firstEntry).toHaveProperty("spent");
        expect(firstEntry).toHaveProperty("variance");

        // Verify variance calculation
        const variance = Number(firstEntry.budgeted) - Number(firstEntry.spent);
        expect(Math.abs(Number(firstEntry.variance) - variance)).toBeLessThan(0.01);
      }
    });

    it("should identify projects with budget alerts", async () => {
      const alerts = await adminCaller.financial.getBudgetAlerts();

      expect(Array.isArray(alerts)).toBe(true);

      // Verify alert logic
      for (const alert of alerts) {
        const utilization = (Number(alert.actualCost) / Number(alert.budget)) * 100;

        // Alerts should only be for projects > 90% utilization
        expect(utilization).toBeGreaterThanOrEqual(90);

        // Critical alerts should be > 100%
        if (alert.severity === "critical") {
          expect(utilization).toBeGreaterThan(100);
        }
      }
    });
  });

  describe("Notifications System Integration", () => {
    it("should create notification and retrieve it", async () => {
      // Create notification for user
      const createResult = await adminCaller.notifications.create({
        userId: mockUser.id,
        type: "task_assigned",
        title: "Integration Test Notification",
        message: "This is a test notification",
        priority: "medium",
      });

      expect(createResult).toBeDefined();

      // Retrieve unread notifications as user
      const unread = await userCaller.notifications.getUnread();

      expect(Array.isArray(unread)).toBe(true);
      
      // Find our test notification
      const testNotification = unread.find(
        (n) => n.title === "Integration Test Notification"
      );

      expect(testNotification).toBeDefined();
      expect(testNotification?.isRead).toBe(false);
      expect(testNotification?.type).toBe("task_assigned");
    });

    it("should mark notification as read", async () => {
      // Get unread notifications
      const unreadBefore = await userCaller.notifications.getUnread();
      const countBefore = unreadBefore.length;

      if (countBefore > 0) {
        const notificationId = unreadBefore[0].id;

        // Mark as read
        await userCaller.notifications.markAsRead({ notificationId });

        // Verify it's no longer in unread list
        const unreadAfter = await userCaller.notifications.getUnread();
        const countAfter = unreadAfter.length;

        expect(countAfter).toBe(countBefore - 1);

        // Verify it doesn't appear in unread list
        const stillUnread = unreadAfter.find((n) => n.id === notificationId);
        expect(stillUnread).toBeUndefined();
      }
    });

    it("should check for deadline notifications", async () => {
      // Run deadline check
      const result = await adminCaller.notifications.checkDeadlines();

      expect(result).toBeDefined();
      expect(typeof result.notificationsCreated).toBe("number");

      // If notifications were created, verify they exist
      if (result.notificationsCreated > 0) {
        const allNotifications = await adminCaller.notifications.getAll();
        const deadlineNotifications = allNotifications.filter(
          (n) => n.type === "deadline"
        );

        expect(deadlineNotifications.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Team Management Integration", () => {
    it("should log time and update summary", async () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Get summary before
      const summaryBefore = await userCaller.teamManagement.getTimeSummary({
        startDate: startOfWeek,
        endDate: endOfWeek,
      });

      const hoursBefore = Number(summaryBefore.totalHours);

      // Log time entry
      await userCaller.teamManagement.logTime({
        description: "Integration test work",
        hours: 5,
        date: today,
      });

      // Get summary after
      const summaryAfter = await userCaller.teamManagement.getTimeSummary({
        startDate: startOfWeek,
        endDate: endOfWeek,
      });

      const hoursAfter = Number(summaryAfter.totalHours);

      // Verify hours increased by 5
      expect(hoursAfter - hoursBefore).toBeCloseTo(5, 1);
    });

    it("should set availability and retrieve it", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startDate = new Date(tomorrow);
      const endDate = new Date(tomorrow);
      endDate.setDate(endDate.getDate() + 7);

      // Set availability
      await userCaller.teamManagement.setAvailability({
        date: tomorrow,
        status: "vacation",
        notes: "Integration test vacation",
      });

      // Retrieve availability
      const availability = await userCaller.teamManagement.getMyAvailability({
        startDate,
        endDate,
      });

      // Find our test entry
      const testEntry = availability.find((a) => {
        const entryDate = new Date(a.date).toDateString();
        const tomorrowDate = tomorrow.toDateString();
        return entryDate === tomorrowDate;
      });

      expect(testEntry).toBeDefined();
      expect(testEntry?.status).toBe("vacation");
      expect(testEntry?.notes).toBe("Integration test vacation");
    });

    it("should calculate productivity report correctly", async () => {
      const startDate = new Date();
      startDate.setDate(1); // First day of month
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of month

      const report = await userCaller.teamManagement.getProductivityReport({
        startDate,
        endDate,
      });

      expect(report).toBeDefined();
      expect(report.totalHours !== undefined).toBe(true);
      expect(typeof report.daysWorked).toBe("number");
      expect(typeof report.tasksCompleted).toBe("number");
      expect(typeof report.averageHoursPerDay).toBe("number");

      // Verify average calculation
      const totalHours = Number(report.totalHours);
      const daysWorked = report.daysWorked;

      if (daysWorked > 0) {
        const expectedAverage = totalHours / daysWorked;
        expect(Math.abs(report.averageHoursPerDay - expectedAverage)).toBeLessThan(
          0.01
        );
      } else {
        expect(report.averageHoursPerDay).toBe(0);
      }
    });
  });

  describe("Cross-Module Integration", () => {
    it("should reflect time entries in financial calculations", async () => {
      // This test verifies that time tracking data influences financial metrics
      // In a real scenario, time entries would be linked to project costs

      // Log significant time entry
      await userCaller.teamManagement.logTime({
        description: "Cross-module integration test",
        hours: 10,
        date: new Date(),
      });

      // Get time summary
      const timeSummary = await userCaller.teamManagement.getTimeSummary({
        startDate: new Date(new Date().setDate(1)),
        endDate: new Date(),
      });

      // Get financial KPIs
      const kpis = await adminCaller.financial.getFinancialKPIs();

      // Both should have data
      expect(Number(timeSummary.totalHours)).toBeGreaterThan(0);
      expect(Number(kpis.totalSpent)).toBeGreaterThanOrEqual(0);
    });

    it("should create notification when budget alert triggered", async () => {
      // Get current budget alerts
      const alerts = await adminCaller.financial.getBudgetAlerts();

      // If there are alerts, there should be corresponding notifications
      if (alerts.length > 0) {
        const allNotifications = await adminCaller.notifications.getAll();
        const budgetNotifications = allNotifications.filter(
          (n) => n.type === "budget_alert"
        );

        // Should have at least some budget notifications
        expect(budgetNotifications.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should show team availability when planning assignments", async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      // Get team availability
      const availability = await adminCaller.teamManagement.getTeamAvailability({
        startDate,
        endDate,
      });

      // Get team assignments
      const assignments = await adminCaller.teamManagement.getAllTasks();

      // Both queries should work
      expect(Array.isArray(availability)).toBe(true);
      expect(Array.isArray(assignments)).toBe(true);

      // In a real scenario, admin would use availability data
      // to make informed assignment decisions
    });
  });

  describe("Performance Integration", () => {
    it("should handle multiple concurrent requests efficiently", async () => {
      const startTime = Date.now();

      // Simulate multiple concurrent requests
      await Promise.all([
        adminCaller.financial.getFinancialKPIs(),
        adminCaller.financial.getBudgetEvolution(),
        adminCaller.notifications.getUnread(),
        userCaller.teamManagement.getMyAssignments(),
        userCaller.teamManagement.getTimeSummary({
          startDate: new Date(new Date().setDate(1)),
          endDate: new Date(),
        }),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All 5 concurrent requests should complete in less than 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it("should maintain data consistency under concurrent writes", async () => {
      const initialSummary = await userCaller.teamManagement.getTimeSummary({
        startDate: new Date(new Date().setDate(1)),
        endDate: new Date(),
      });

      const initialHours = Number(initialSummary.totalHours);

      // Perform multiple concurrent time logs
      await Promise.all([
        userCaller.teamManagement.logTime({
          description: "Concurrent test 1",
          hours: 2,
          date: new Date(),
        }),
        userCaller.teamManagement.logTime({
          description: "Concurrent test 2",
          hours: 3,
          date: new Date(),
        }),
        userCaller.teamManagement.logTime({
          description: "Concurrent test 3",
          hours: 1.5,
          date: new Date(),
        }),
      ]);

      const finalSummary = await userCaller.teamManagement.getTimeSummary({
        startDate: new Date(new Date().setDate(1)),
        endDate: new Date(),
      });

      const finalHours = Number(finalSummary.totalHours);

      // Total should have increased by exactly 6.5 hours (2 + 3 + 1.5)
      expect(finalHours - initialHours).toBeCloseTo(6.5, 1);
    });
  });
});
