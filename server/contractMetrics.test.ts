/**
 * Tests for contract metrics and analytics functionality
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as contractMetricsDb from "./contractMetricsDb";

describe("Contract Metrics", () => {
  const testStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  
  it("should get overall statistics", async () => {
    const stats = await contractMetricsDb.getOverallStatistics();
    
    expect(stats).toBeTruthy();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.success).toBe("number");
    expect(typeof stats.error).toBe("number");
    expect(typeof stats.processing).toBe("number");
    expect(typeof stats.reprocessed).toBe("number");
    expect(typeof stats.successRate).toBe("number");
    
    // Success rate should be between 0 and 100
    expect(stats.successRate).toBeGreaterThanOrEqual(0);
    expect(stats.successRate).toBeLessThanOrEqual(100);
    
    // Total should equal sum of statuses
    expect(stats.total).toBe(stats.success + stats.error + stats.processing);
  });
  
  it("should get overall statistics with date filter", async () => {
    const stats = await contractMetricsDb.getOverallStatistics(testStartDate);
    
    expect(stats).toBeTruthy();
    expect(typeof stats.total).toBe("number");
    
    // Should have fewer or equal results than all-time
    const allTimeStats = await contractMetricsDb.getOverallStatistics();
    expect(stats.total).toBeLessThanOrEqual(allTimeStats.total);
  });
  
  it("should get time series data", async () => {
    const endDate = new Date();
    const timeSeries = await contractMetricsDb.getTimeSeriesData(testStartDate, endDate);
    
    expect(Array.isArray(timeSeries)).toBe(true);
    
    if (timeSeries.length > 0) {
      const firstEntry = timeSeries[0];
      expect(firstEntry).toHaveProperty("date");
      expect(firstEntry).toHaveProperty("total");
      expect(firstEntry).toHaveProperty("success");
      expect(firstEntry).toHaveProperty("error");
      expect(firstEntry).toHaveProperty("successRate");
      
      // Success rate should be valid percentage
      expect(firstEntry.successRate).toBeGreaterThanOrEqual(0);
      expect(firstEntry.successRate).toBeLessThanOrEqual(100);
      
      // Verify data is ordered by date
      if (timeSeries.length > 1) {
        const firstDate = new Date(timeSeries[0].date);
        const secondDate = new Date(timeSeries[1].date);
        expect(firstDate.getTime()).toBeLessThanOrEqual(secondDate.getTime());
      }
    }
  });
  
  it("should get common errors", async () => {
    const errors = await contractMetricsDb.getCommonErrors(undefined, 5);
    
    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeLessThanOrEqual(5);
    
    if (errors.length > 0) {
      const firstError = errors[0];
      expect(firstError).toHaveProperty("errorMessage");
      expect(firstError).toHaveProperty("count");
      expect(firstError).toHaveProperty("lastOccurrence");
      
      expect(typeof firstError.errorMessage).toBe("string");
      expect(typeof firstError.count).toBe("number");
      expect(firstError.count).toBeGreaterThan(0);
      
      // Verify errors are ordered by count (descending)
      if (errors.length > 1) {
        expect(errors[0].count).toBeGreaterThanOrEqual(errors[1].count);
      }
    }
  });
  
  it("should get performance metrics", async () => {
    const metrics = await contractMetricsDb.getPerformanceMetrics();
    
    expect(metrics).toBeTruthy();
    expect(typeof metrics.avgDuration).toBe("number");
    expect(typeof metrics.minDuration).toBe("number");
    expect(typeof metrics.maxDuration).toBe("number");

    expect(typeof metrics.count).toBe("number");
    
    if (metrics.count > 0) {
      // Min should be <= avg <= max
      expect(metrics.minDuration).toBeLessThanOrEqual(metrics.avgDuration);
      expect(metrics.avgDuration).toBeLessThanOrEqual(metrics.maxDuration);
      
      // All durations should be non-negative
      expect(metrics.minDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.avgDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.maxDuration).toBeGreaterThanOrEqual(0);

    }
  });
  
  it("should get performance metrics with date filter", async () => {
    const metrics = await contractMetricsDb.getPerformanceMetrics(testStartDate);
    
    expect(metrics).toBeTruthy();
    expect(typeof metrics.count).toBe("number");
    
    // Should have fewer or equal results than all-time
    const allTimeMetrics = await contractMetricsDb.getPerformanceMetrics();
    expect(metrics.count).toBeLessThanOrEqual(allTimeMetrics.count);
  });
  
  it("should get duration distribution", async () => {
    const distribution = await contractMetricsDb.getDurationDistribution();
    
    expect(Array.isArray(distribution)).toBe(true);
    
    if (distribution.length > 0) {
      const firstBucket = distribution[0];
      expect(firstBucket).toHaveProperty("bucket");
      expect(firstBucket).toHaveProperty("count");
      
      expect(typeof firstBucket.bucket).toBe("string");
      expect(typeof firstBucket.count).toBe("number");
      expect(firstBucket.count).toBeGreaterThan(0);
      
      // Verify buckets are in expected format
      const validBuckets = ["< 5s", "5-10s", "10-20s", "20-30s", "30-60s", "> 60s"];
      expect(validBuckets).toContain(firstBucket.bucket);
      
      // Verify total count matches performance metrics count
      const totalCount = distribution.reduce((sum, bucket) => sum + bucket.count, 0);
      const perfMetrics = await contractMetricsDb.getPerformanceMetrics();
      expect(totalCount).toBe(perfMetrics.count);
    }
  });
  
  it("should get file size statistics", async () => {
    const stats = await contractMetricsDb.getFileSizeStats();
    
    expect(stats).toBeTruthy();
    expect(typeof stats.avgSize).toBe("number");
    expect(typeof stats.minSize).toBe("number");
    expect(typeof stats.maxSize).toBe("number");
    expect(typeof stats.totalSize).toBe("number");
    
    if (stats.totalSize > 0) {
      // Min should be <= avg <= max
      expect(stats.minSize).toBeLessThanOrEqual(stats.avgSize);
      expect(stats.avgSize).toBeLessThanOrEqual(stats.maxSize);
      
      // All sizes should be non-negative
      expect(stats.minSize).toBeGreaterThanOrEqual(0);
      expect(stats.avgSize).toBeGreaterThanOrEqual(0);
      expect(stats.maxSize).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
    }
  });
  
  it("should get file size statistics with date filter", async () => {
    const stats = await contractMetricsDb.getFileSizeStats(testStartDate);
    
    expect(stats).toBeTruthy();
    
    // Should have fewer or equal total size than all-time
    const allTimeStats = await contractMetricsDb.getFileSizeStats();
    expect(stats.totalSize).toBeLessThanOrEqual(allTimeStats.totalSize);
  });
  
  it("should handle empty results gracefully", async () => {
    // Use a future date to get no results
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const stats = await contractMetricsDb.getOverallStatistics(futureDate);
    expect(stats.total).toBe(0);
    expect(stats.successRate).toBe(0);
    
    const timeSeries = await contractMetricsDb.getTimeSeriesData(futureDate, new Date(futureDate.getTime() + 1000));
    expect(timeSeries.length).toBe(0);
    
    const errors = await contractMetricsDb.getCommonErrors(futureDate);
    expect(errors.length).toBe(0);
  });
});
