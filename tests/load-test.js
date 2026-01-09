/**
 * Load Testing Script for Gavinho Platform
 * 
 * This script tests the performance of the new features under load:
 * - Financial Dashboard
 * - Notifications System
 * - Team Management
 * 
 * Usage: k6 run tests/load-test.js
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Warm up: ramp to 10 users
    { duration: '1m', target: 50 },   // Load: ramp to 50 users
    { duration: '2m', target: 50 },   // Sustain: stay at 50 users
    { duration: '30s', target: 100 }, // Spike: jump to 100 users
    { duration: '1m', target: 100 },  // Sustain spike
    { duration: '1m', target: 0 },    // Cool down: ramp to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests must complete below 1s
    'http_req_failed': ['rate<0.01'],    // Error rate must be below 1%
    'errors': ['rate<0.05'],             // Custom error rate below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Simulated auth token (replace with actual token generation)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
};

/**
 * Test: Financial Dashboard KPIs
 */
function testFinancialKPIs() {
  const res = http.get(
    `${BASE_URL}/api/trpc/financial.getFinancialKPIs`,
    { headers }
  );

  const success = check(res, {
    'Financial KPIs: status 200': (r) => r.status === 200,
    'Financial KPIs: response time < 500ms': (r) => r.timings.duration < 500,
    'Financial KPIs: has totalBudget': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result?.data?.totalBudget !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

/**
 * Test: Budget Evolution
 */
function testBudgetEvolution() {
  const res = http.get(
    `${BASE_URL}/api/trpc/financial.getBudgetEvolution`,
    { headers }
  );

  const success = check(res, {
    'Budget Evolution: status 200': (r) => r.status === 200,
    'Budget Evolution: response time < 800ms': (r) => r.timings.duration < 800,
    'Budget Evolution: returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.result?.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

/**
 * Test: Get Notifications
 */
function testGetNotifications() {
  const res = http.get(
    `${BASE_URL}/api/trpc/notifications.getUnread`,
    { headers }
  );

  const success = check(res, {
    'Notifications: status 200': (r) => r.status === 200,
    'Notifications: response time < 300ms': (r) => r.timings.duration < 300,
    'Notifications: returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.result?.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

/**
 * Test: Team Management - My Assignments
 */
function testMyAssignments() {
  const res = http.get(
    `${BASE_URL}/api/trpc/teamManagement.getMyAssignments`,
    { headers }
  );

  const success = check(res, {
    'My Assignments: status 200': (r) => r.status === 200,
    'My Assignments: response time < 400ms': (r) => r.timings.duration < 400,
    'My Assignments: returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.result?.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

/**
 * Test: Log Time Entry (Write operation)
 */
function testLogTime() {
  const payload = JSON.stringify({
    description: `Load test entry ${Date.now()}`,
    hours: 8,
    date: new Date().toISOString(),
  });

  const res = http.post(
    `${BASE_URL}/api/trpc/teamManagement.logTime`,
    payload,
    { headers }
  );

  const success = check(res, {
    'Log Time: status 200': (r) => r.status === 200,
    'Log Time: response time < 600ms': (r) => r.timings.duration < 600,
  });

  errorRate.add(!success);
}

/**
 * Main test scenario
 * Simulates a typical user session
 */
export default function () {
  // Simulate user navigating through the platform
  
  // 1. Check notifications (common action)
  testGetNotifications();
  sleep(1);

  // 2. View financial dashboard (heavy query)
  testFinancialKPIs();
  sleep(2);

  // 3. View budget evolution chart
  testBudgetEvolution();
  sleep(1);

  // 4. Check team assignments
  testMyAssignments();
  sleep(2);

  // 5. Log time entry (write operation)
  // Only 20% of users log time in a session
  if (Math.random() < 0.2) {
    testLogTime();
    sleep(1);
  }

  // Random think time between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}

/**
 * Setup function - runs once before test
 */
export function setup() {
  console.log('🚀 Starting load test for Gavinho Platform');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('⏱️  Duration: ~6 minutes');
  console.log('👥 Max users: 100 concurrent');
}

/**
 * Teardown function - runs once after test
 */
export function teardown(data) {
  console.log('✅ Load test completed');
}
