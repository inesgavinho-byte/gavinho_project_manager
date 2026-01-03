import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@gavinho.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("projects router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should list all projects", async () => {
    const projects = await caller.projects.list();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it("should get project by id", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const project = await caller.projects.getById({ id: projects[0]!.id });
      expect(project).toBeDefined();
      expect(project?.id).toBe(projects[0]!.id);
    }
  });

  it("should create a new project", async () => {
    const result = await caller.projects.create({
      name: "Test Project",
      description: "Test Description",
      status: "planning",
      priority: "medium",
      clientName: "Test Client",
      location: "Test Location",
    });

    expect(result.success).toBe(true);
  });

  it("should update project", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const result = await caller.projects.update({
        id: projects[0]!.id,
        progress: 75,
        status: "in_progress",
      });

      expect(result.success).toBe(true);
    }
  });
});

describe("dashboard router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should return dashboard stats", async () => {
    const stats = await caller.dashboard.stats();
    expect(stats).toBeDefined();
    // MySQL returns bigint as string, so we accept both
    expect(["number", "string"]).toContain(typeof stats?.total);
    expect(["number", "string"]).toContain(typeof stats?.inProgress);
    expect(["number", "string"]).toContain(typeof stats?.completed);
  });
});

describe("suppliers router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should list all suppliers", async () => {
    const suppliers = await caller.suppliers.list();
    expect(Array.isArray(suppliers)).toBe(true);
  });

  it("should create a new supplier", async () => {
    const result = await caller.suppliers.create({
      name: "Test Supplier",
      contactPerson: "John Doe",
      email: "john@testsupplier.com",
      phone: "+55 11 1234-5678",
      category: "Materials",
    });

    expect(result.success).toBe(true);
  });
});

describe("orders router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should list orders by project", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const orders = await caller.orders.listByProject({ projectId: projects[0]!.id });
      expect(Array.isArray(orders)).toBe(true);
    }
  });

  it("should create a new order", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const result = await caller.orders.create({
        projectId: projects[0]!.id,
        description: "Test Order",
        orderType: "material",
        status: "pending",
        totalAmount: "1000.00",
      });

      expect(result.success).toBe(true);
    }
  });
});

describe("tasks router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should list tasks by project", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const tasks = await caller.tasks.listByProject({ projectId: projects[0]!.id });
      expect(Array.isArray(tasks)).toBe(true);
    }
  });

  it("should create a new task", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const result = await caller.tasks.create({
        projectId: projects[0]!.id,
        title: "Test Task",
        description: "Test task description",
        status: "todo",
        priority: "medium",
        urgency: "medium",
        importance: "medium",
      });

      expect(result.success).toBe(true);
    }
  });
});

describe("budgets router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should list budgets by project", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const budgets = await caller.budgets.listByProject({ projectId: projects[0]!.id });
      expect(Array.isArray(budgets)).toBe(true);
    }
  });

  it("should create a new budget", async () => {
    const projects = await caller.projects.list();
    if (projects.length > 0) {
      const result = await caller.budgets.create({
        projectId: projects[0]!.id,
        category: "Test Category",
        description: "Test budget",
        budgetedAmount: "10000.00",
      });

      expect(result.success).toBe(true);
    }
  });
});
