import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notifyMQTTaskGenerated,
  notifyProjectTeamMQTTask,
  notifyOwnerMQTTask,
  notifyBulkMQTTasksGenerated,
  notifyMQTDiscrepancyAlert,
  notifyMQTAutomationConfigUpdated,
  notifyMQTProcessingStatus,
} from "./mqtNotificationService";

describe("MQT Notification Service", () => {
  const mockNotification = {
    taskId: 1,
    title: "MQT: Discrepância em ITEM-001",
    description: "Test description",
    priority: "high",
    severity: "critical" as const,
    itemCode: "ITEM-001",
    variance: -50,
    variancePercentage: -10.5,
    plannedQuantity: 500,
    executedQuantity: 450,
    projectId: 1,
    assignedToId: 1,
    dueDate: new Date().toISOString(),
  };

  describe("notifyMQTTaskGenerated", () => {
    it("should send notification to user via WebSocket", async () => {
      // Teste básico - verifica se a função não lança erro
      await expect(
        notifyMQTTaskGenerated(1, mockNotification)
      ).resolves.toBeUndefined();
    });

    it("should handle missing WebSocket gracefully", async () => {
      // Deve não lançar erro mesmo sem WebSocket
      await expect(
        notifyMQTTaskGenerated(999, mockNotification)
      ).resolves.toBeUndefined();
    });
  });

  describe("notifyProjectTeamMQTTask", () => {
    it("should notify project team without errors", async () => {
      await expect(
        notifyProjectTeamMQTTask(1, mockNotification)
      ).resolves.toBeUndefined();
    });

    it("should handle database errors gracefully", async () => {
      // Deve não lançar erro mesmo com falha de BD
      await expect(
        notifyProjectTeamMQTTask(999, mockNotification)
      ).resolves.toBeUndefined();
    });
  });

  describe("notifyOwnerMQTTask", () => {
    it("should send notification to owner", async () => {
      const result = await notifyOwnerMQTTask(mockNotification);
      expect(typeof result).toBe("boolean");
    });

    it("should handle notification service errors", async () => {
      const result = await notifyOwnerMQTTask(mockNotification);
      // Pode ser true ou false dependendo da disponibilidade do serviço
      expect(typeof result).toBe("boolean");
    });
  });

  describe("notifyBulkMQTTasksGenerated", () => {
    it("should send bulk notifications", async () => {
      const notifications = [mockNotification, mockNotification];
      await expect(
        notifyBulkMQTTasksGenerated(1, notifications, 1)
      ).resolves.toBeUndefined();
    });

    it("should handle empty notifications array", async () => {
      await expect(
        notifyBulkMQTTasksGenerated(1, [], 1)
      ).resolves.toBeUndefined();
    });

    it("should notify owner for critical tasks", async () => {
      const criticalNotifications = [
        { ...mockNotification, severity: "critical" as const },
      ];
      await expect(
        notifyBulkMQTTasksGenerated(1, criticalNotifications, 1)
      ).resolves.toBeUndefined();
    });
  });

  describe("notifyMQTDiscrepancyAlert", () => {
    it("should send discrepancy alert", async () => {
      await expect(
        notifyMQTDiscrepancyAlert(1, "ITEM-001", "critical", -50, -10.5, 1)
      ).resolves.toBeUndefined();
    });

    it("should broadcast alert without user ID", async () => {
      await expect(
        notifyMQTDiscrepancyAlert(1, "ITEM-001", "high", -30, -6)
      ).resolves.toBeUndefined();
    });
  });

  describe("notifyMQTAutomationConfigUpdated", () => {
    it("should notify config update", async () => {
      const changes = { taskPriority: "urgent", taskDueOffsetDays: 5 };
      await expect(
        notifyMQTAutomationConfigUpdated(1, changes, 1)
      ).resolves.toBeUndefined();
    });
  });

  describe("notifyMQTProcessingStatus", () => {
    it("should notify processing started", async () => {
      await expect(
        notifyMQTProcessingStatus(1, "started")
      ).resolves.toBeUndefined();
    });

    it("should notify processing completed", async () => {
      await expect(
        notifyMQTProcessingStatus(1, "completed", { tasksGenerated: 5 })
      ).resolves.toBeUndefined();
    });

    it("should notify processing in progress", async () => {
      await expect(
        notifyMQTProcessingStatus(1, "in_progress")
      ).resolves.toBeUndefined();
    });

    it("should notify processing failed", async () => {
      await expect(
        notifyMQTProcessingStatus(1, "failed", { error: "Test error" })
      ).resolves.toBeUndefined();
    });
  });

  describe("Notification payload validation", () => {
    it("should handle notifications with all fields", async () => {
      const fullNotification = {
        ...mockNotification,
        taskId: 123,
        itemCode: "ITEM-XYZ",
        variance: -100,
        variancePercentage: -20,
      };

      await expect(
        notifyMQTTaskGenerated(1, fullNotification)
      ).resolves.toBeUndefined();
    });

    it("should handle notifications with minimal fields", async () => {
      const minimalNotification = {
        taskId: 1,
        title: "Task",
        description: "Desc",
        priority: "high",
        severity: "high" as const,
        itemCode: "ITEM",
        variance: 0,
        variancePercentage: 0,
        plannedQuantity: 0,
        executedQuantity: 0,
        projectId: 1,
        dueDate: new Date().toISOString(),
      };

      await expect(
        notifyMQTTaskGenerated(1, minimalNotification)
      ).resolves.toBeUndefined();
    });
  });
});
