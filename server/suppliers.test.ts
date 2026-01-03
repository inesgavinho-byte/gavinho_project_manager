import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("suppliers router - analytics", () => {
  it("should get supplier rankings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.suppliers.getRankings();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get top suppliers by criteria", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.suppliers.getTopSuppliers({
      criteria: "overall",
      limit: 5,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("should compare multiple suppliers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get some suppliers first
    const suppliers = await caller.suppliers.list();
    if (suppliers.length >= 2) {
      const supplierIds = suppliers.slice(0, 2).map(s => s.id);
      const result = await caller.suppliers.compareSuppliers({ supplierIds });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(supplierIds.length);
    }
  });
});

describe("suppliers router - transactions", () => {
  it("should get supplier transactions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first supplier
    const suppliers = await caller.suppliers.list();
    if (suppliers.length > 0) {
      const result = await caller.suppliers.getTransactions({
        supplierId: suppliers[0]!.id,
      });

      expect(Array.isArray(result)).toBe(true);
    }
  });

  it("should create supplier transaction", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first supplier
    const suppliers = await caller.suppliers.list();
    if (suppliers.length > 0) {
      const result = await caller.suppliers.createTransaction({
        supplierId: suppliers[0]!.id,
        type: "purchase",
        amount: "1000.00",
        description: "Test purchase",
        transactionDate: new Date(),
      });

      expect(result).toEqual({ success: true });
    }
  });

  it("should update transaction status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first supplier and their transactions
    const suppliers = await caller.suppliers.list();
    if (suppliers.length > 0) {
      const transactions = await caller.suppliers.getTransactions({
        supplierId: suppliers[0]!.id,
      });

      if (transactions.length > 0) {
        const result = await caller.suppliers.updateTransactionStatus({
          transactionId: transactions[0]!.id,
          status: "completed",
          paidDate: new Date(),
        });

        expect(result).toEqual({ success: true });
      }
    }
  });
});

describe("suppliers router - evaluations", () => {
  it("should get supplier evaluations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first supplier
    const suppliers = await caller.suppliers.list();
    if (suppliers.length > 0) {
      const result = await caller.suppliers.getEvaluations({
        supplierId: suppliers[0]!.id,
      });

      expect(Array.isArray(result)).toBe(true);
    }
  });

  it("should create supplier evaluation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first supplier
    const suppliers = await caller.suppliers.list();
    if (suppliers.length > 0) {
      const result = await caller.suppliers.createEvaluation({
        supplierId: suppliers[0]!.id,
        qualityRating: 5,
        deliveryRating: 4,
        communicationRating: 5,
        priceRating: 4,
        comments: "Excellent supplier",
        wouldRecommend: true,
      });

      expect(result).toEqual({ success: true });
    }
  });

  it("should update supplier evaluation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first supplier and their evaluations
    const suppliers = await caller.suppliers.list();
    if (suppliers.length > 0) {
      const evaluations = await caller.suppliers.getEvaluations({
        supplierId: suppliers[0]!.id,
      });

      if (evaluations.length > 0) {
        const result = await caller.suppliers.updateEvaluation({
          evaluationId: evaluations[0]!.id,
          qualityRating: 5,
          comments: "Updated comment",
        });

        expect(result).toEqual({ success: true });
      }
    }
  });

  it("should delete supplier evaluation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first supplier and their evaluations
    const suppliers = await caller.suppliers.list();
    if (suppliers.length > 0) {
      const evaluations = await caller.suppliers.getEvaluations({
        supplierId: suppliers[0]!.id,
      });

      if (evaluations.length > 0) {
        const result = await caller.suppliers.deleteEvaluation({
          evaluationId: evaluations[0]!.id,
        });

        expect(result).toEqual({ success: true });
      }
    }
  });
});
