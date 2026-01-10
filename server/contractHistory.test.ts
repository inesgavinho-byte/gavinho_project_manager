/**
 * Tests for contract processing history functionality
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as contractHistoryDb from "./contractHistoryDb";
import { getDb } from "./db";

describe("Contract Processing History", () => {
  let testProjectId: number;
  let testUserId: number;
  let testHistoryId: number;
  
  beforeAll(async () => {
    // Use existing project and user IDs from database
    testProjectId = 30010; // GA00466_PENTHOUSE SI
    testUserId = 1; // Assuming user ID 1 exists
  });
  
  afterAll(async () => {
    // Clean up test data
    if (testHistoryId) {
      try {
        await contractHistoryDb.deleteContractHistory(testHistoryId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
  
  it("should create a new contract processing history record", async () => {
    const historyData = {
      projectId: testProjectId,
      fileName: "test-contract.pdf",
      fileUrl: "https://example.com/test-contract.pdf",
      fileSize: 1024 * 500, // 500KB
      status: "processing" as const,
      processingStartedAt: new Date(),
      uploadedById: testUserId,
      isReprocessing: 0,
    };
    
    testHistoryId = await contractHistoryDb.createContractHistory(historyData);
    
    expect(testHistoryId).toBeGreaterThan(0);
  });
  
  it("should retrieve contract history by ID", async () => {
    const history = await contractHistoryDb.getContractHistoryById(testHistoryId);
    
    expect(history).toBeTruthy();
    expect(history?.fileName).toBe("test-contract.pdf");
    expect(history?.status).toBe("processing");
    expect(history?.projectId).toBe(testProjectId);
  });
  
  it("should update contract history with success status", async () => {
    const processingCompletedAt = new Date();
    const processingDurationMs = 5000; // 5 seconds
    
    await contractHistoryDb.updateContractHistory(testHistoryId, {
      status: "success",
      extractedData: {
        client: { name: "Test Client", nif: "123456789" },
        phases: [],
        deliverables: []
      } as any,
      processingCompletedAt,
      processingDurationMs,
    });
    
    const updated = await contractHistoryDb.getContractHistoryById(testHistoryId);
    
    expect(updated?.status).toBe("success");
    expect(updated?.processingDurationMs).toBe(processingDurationMs);
    expect(updated?.extractedData).toBeTruthy();
  });
  
  it("should retrieve contract history by project", async () => {
    const history = await contractHistoryDb.getContractHistoryByProject(testProjectId);
    
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    // Should be ordered by most recent first
    if (history.length > 1) {
      const first = new Date(history[0].createdAt).getTime();
      const second = new Date(history[1].createdAt).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });
  
  it("should retrieve all contract history", async () => {
    const allHistory = await contractHistoryDb.getAllContractHistory();
    
    expect(Array.isArray(allHistory)).toBe(true);
    expect(allHistory.length).toBeGreaterThan(0);
    
    // Should include our test record
    const testRecord = allHistory.find(h => h.id === testHistoryId);
    expect(testRecord).toBeTruthy();
  });
  
  it("should handle error status updates", async () => {
    // Create another test record for error scenario
    const errorHistoryId = await contractHistoryDb.createContractHistory({
      projectId: testProjectId,
      fileName: "error-contract.pdf",
      fileUrl: "https://example.com/error-contract.pdf",
      fileSize: 1024 * 100,
      status: "processing",
      processingStartedAt: new Date(),
      uploadedById: testUserId,
      isReprocessing: 0,
    });
    
    // Update with error
    await contractHistoryDb.updateContractHistory(errorHistoryId, {
      status: "error",
      errorMessage: "Formato de arquivo inválido",
      processingCompletedAt: new Date(),
      processingDurationMs: 1000,
    });
    
    const errorRecord = await contractHistoryDb.getContractHistoryById(errorHistoryId);
    
    expect(errorRecord?.status).toBe("error");
    expect(errorRecord?.errorMessage).toBe("Formato de arquivo inválido");
    
    // Clean up
    await contractHistoryDb.deleteContractHistory(errorHistoryId);
  });
  
  it("should track reprocessing with original ID", async () => {
    // Create reprocessing record
    const reprocessHistoryId = await contractHistoryDb.createContractHistory({
      projectId: testProjectId,
      fileName: "test-contract.pdf",
      fileUrl: "https://example.com/test-contract.pdf",
      fileSize: 1024 * 500,
      status: "processing",
      processingStartedAt: new Date(),
      uploadedById: testUserId,
      isReprocessing: 1,
      originalProcessingId: testHistoryId,
    });
    
    const reprocessRecord = await contractHistoryDb.getContractHistoryById(reprocessHistoryId);
    
    expect(reprocessRecord?.isReprocessing).toBe(1);
    expect(reprocessRecord?.originalProcessingId).toBe(testHistoryId);
    
    // Clean up
    await contractHistoryDb.deleteContractHistory(reprocessHistoryId);
  });
  
  it("should return null for non-existent history ID", async () => {
    const nonExistent = await contractHistoryDb.getContractHistoryById(999999);
    
    expect(nonExistent).toBeNull();
  });
});
