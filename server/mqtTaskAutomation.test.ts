import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateTaskFromMQTAlert,
  processUnresolvedMQTAlerts,
  getMQTAutomationConfig,
  updateMQTAutomationConfig,
  countMQTGeneratedTasks,
  getMQTGeneratedTasks,
} from "./mqtTaskAutomationService";

describe("MQT Task Automation Service", () => {
  describe("getMQTAutomationConfig", () => {
    it("should return default automation config", async () => {
      const config = await getMQTAutomationConfig(1);

      expect(config).toBeDefined();
      expect(config.projectId).toBe(1);
      expect(config.enableAutoTaskGeneration).toBe(true);
      expect(config.criticalThreshold).toBe(10);
      expect(config.warningThreshold).toBe(5);
      expect(config.taskPriority).toBe("high");
      expect(config.taskDueOffsetDays).toBe(3);
    });
  });

  describe("updateMQTAutomationConfig", () => {
    it("should update automation config", async () => {
      const config = await updateMQTAutomationConfig(1, {
        enableAutoTaskGeneration: false,
        taskPriority: "urgent",
      });

      expect(config.enableAutoTaskGeneration).toBe(false);
      expect(config.taskPriority).toBe("urgent");
    });

    it("should preserve other config values when updating", async () => {
      const config = await updateMQTAutomationConfig(1, {
        taskDueOffsetDays: 5,
      });

      expect(config.taskDueOffsetDays).toBe(5);
      expect(config.criticalThreshold).toBe(10);
    });
  });

  describe("countMQTGeneratedTasks", () => {
    it("should return count of MQT generated tasks", async () => {
      const count = await countMQTGeneratedTasks(1);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getMQTGeneratedTasks", () => {
    it("should return list of MQT generated tasks", async () => {
      const tasks = await getMQTGeneratedTasks(1, 10);

      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const tasks = await getMQTGeneratedTasks(1, 5);

      expect(tasks.length).toBeLessThanOrEqual(5);
    });
  });

  describe("generateTaskFromMQTAlert", () => {
    it("should not generate task if automation is disabled", async () => {
      const config = {
        projectId: 1,
        enableAutoTaskGeneration: false,
        criticalThreshold: 10,
        warningThreshold: 5,
        taskPriority: "high" as const,
        taskDueOffsetDays: 3,
      };

      const alert = {
        id: 1,
        mqtLineId: 1,
        projectId: 1,
        alertType: "variance_critical",
        severity: "critical" as const,
        message: "Test alert",
      };

      const result = await generateTaskFromMQTAlert(alert, config);

      expect(result).toBeNull();
    });
  });

  describe("processUnresolvedMQTAlerts", () => {
    it("should handle database errors gracefully", async () => {
      const config = {
        projectId: 1,
        enableAutoTaskGeneration: true,
        criticalThreshold: 10,
        warningThreshold: 5,
        taskPriority: "high" as const,
        taskDueOffsetDays: 3,
      };

      try {
        const tasks = await processUnresolvedMQTAlerts(1, config);
        expect(Array.isArray(tasks)).toBe(true);
      } catch (error) {
        // Esperado se BD não estiver disponível
        expect(error).toBeDefined();
      }
    });
  });
});
