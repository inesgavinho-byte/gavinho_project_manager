import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import * as projectsDb from './projectsDb';

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
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
    res: {} as TrpcContext["res"],
  };
}

describe('Team createAndAdd', () => {
  let testProjectId: number;

  beforeAll(async () => {
    // Create a test project
    testProjectId = await projectsDb.createProject({
      name: 'Test Project for Team',
      code: 'TEST_TEAM_001',
      client: 'Test Client',
      description: 'Test Description',
      status: 'planning',
      startDate: new Date(),
      endDate: new Date(),
      location: 'Test Location',
      budget: 0,
    });
  });

  it('should create a new user and add to project team with phone', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.team.createAndAdd({
      projectId: testProjectId,
      name: 'João Silva',
      email: 'joao.silva.test@example.com',
      phone: '+351 912 345 678',
      role: 'engineer',
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userId');
    expect(result.userId).toBeGreaterThan(0);

    // Verify member was added to team
    const team = await projectsDb.getProjectTeam(testProjectId);
    const member = team.find(m => m.userId === result.userId);
    expect(member).toBeDefined();
    expect(member?.role).toBe('engineer');
    expect(member?.name).toBe('João Silva');
    expect(member?.email).toBe('joao.silva.test@example.com');
  });

  it('should create user without phone', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.team.createAndAdd({
      projectId: testProjectId,
      name: 'Maria Santos',
      email: 'maria.santos.test@example.com',
      role: 'architect',
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userId');

    const team = await projectsDb.getProjectTeam(testProjectId);
    const member = team.find(m => m.userId === result.userId);
    expect(member).toBeDefined();
    expect(member?.name).toBe('Maria Santos');
  });
});
