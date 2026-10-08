import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { LocalRepository } from "@/modules/workspace/infrastructure/local-repository";
import { WorkspaceService } from "@/modules/workspace/application/workspace-service";
import { DemoAnalyzer } from "@/modules/scope-analysis/infrastructure/demo-analyzer";
import { DemoGateway } from "@/modules/payments/infrastructure/demo-gateway";
import {
  clientId,
  owner,
  profileFixture,
  projectFixture,
  projectId,
} from "./fixtures";
import { financialSummary } from "@/modules/workspace/domain/entities";

let directory: string;
let repository: LocalRepository;
let service: WorkspaceService;
let gateway: DemoGateway;
beforeEach(async () => {
  directory = await mkdtemp(resolve("tests/.tmp-workspace-"));
  repository = new LocalRepository(directory);
  gateway = new DemoGateway(repository);
  service = new WorkspaceService({
    repository,
    gateway,
    analyzer: new DemoAnalyzer(),
    newId: randomUUID,
    now: () => new Date().toISOString(),
    newToken: () => randomBytes(32).toString("base64url"),
    hashToken: (t) => createHash("sha256").update(t).digest("hex"),
  });
  await repository.save("profiles", profileFixture);
  await repository.save("clients", {
    id: clientId,
    userId: owner,
    createdAt: new Date().toISOString(),
    name: "Demo client",
    company: "",
    email: "client@example.com",
    phone: "",
    notes: "",
  });
  await repository.save("projects", projectFixture);
});
afterEach(async () => {
  if (!directory.startsWith(resolve("tests/.tmp-workspace-")))
    throw new Error("Unsafe test cleanup path");
  await rm(directory, { recursive: true, force: true });
  vi.restoreAllMocks();
});

async function sentOrder() {
  const order = (await service.execute(owner, "seller@example.com", {
    action: "order",
    input: {
      projectId,
      analysisId: null,
      description: "Google login and PDF export",
      amountMinor: 22000,
      timelineDays: 3,
    },
  })) as { id: string };
  const sent = (await service.execute(owner, "seller@example.com", {
    action: "send",
    id: order.id,
  })) as { token: string };
  return { ...sent, id: order.id };
}
describe("commercial golden path", () => {
  it("reviews the project baseline without changing the agreed contract", async () => {
    await service.execute(owner, "seller@example.com", {
      action: "project-review",
      id: projectId,
    });
    const w = await service.workspace(owner);
    expect(w.reviews).toHaveLength(1);
    expect(w.reviews[0].baseline.includedScope).toBe(
      projectFixture.includedScope,
    );
    expect(w.reviews[0].result.clarificationQuestions.length).toBeGreaterThan(
      0,
    );
    expect(w.orders).toHaveLength(0);
    expect(w.projects[0]).toEqual(projectFixture);
  });
  it("rejects stale baseline assessments and records a human price override", async () => {
    await service.execute(owner, "seller@example.com", {
      action: "analyze",
      input: { projectId, requestText: "Add Google login and PDF export" },
    });
    const w = await service.workspace(owner);
    const input = {
      projectId,
      analysisId: w.analyses[0].id,
      description: "Additional work chosen by freelancer",
      amountMinor: 25000,
      timelineDays: 3,
    };
    await service.execute(owner, "seller@example.com", {
      action: "order",
      input,
    });
    expect(
      (await service.workspace(owner)).activity.some(
        (a) => a.eventType === "PRICE_OVERRIDDEN",
      ),
    ).toBe(true);
    await repository.save("projects", {
      ...projectFixture,
      includedScope: "Responsive website with Google login",
    });
    await expect(
      service.execute(owner, "seller@example.com", { action: "order", input }),
    ).rejects.toMatchObject({ code: "BASELINE_CHANGED" });
  });
  it("analyzes, explicitly approves and idempotently records payment", async () => {
    const analysis = (await service.execute(owner, "seller@example.com", {
      action: "analyze",
      input: {
        projectId,
        requestText: "Can we add Google login and PDF sales reports?",
      },
    })) as { pricing: { recommendedMinor: number } };
    expect(analysis.pricing.recommendedMinor).toBe(22000);
    const { token, id } = await sentOrder();
    await service.publicOrder(token);
    expect((await repository.get("change_orders", id, owner))?.status).toBe(
      "VIEWED",
    );
    const invoice = (await service.decide(token, "approve")) as {
      id: string;
      paypalInvoiceId: string;
    };
    const repeated = (await service.decide(token, "approve")) as { id: string };
    expect(repeated.id).toBe(invoice.id);
    expect(await repository.list("invoices", owner)).toHaveLength(1);
    await Promise.all([
      service.processPayment(
        "event-1",
        "DEMO.PAID",
        invoice.paypalInvoiceId,
        new Date().toISOString(),
      ),
      service.processPayment(
        "event-1",
        "DEMO.PAID",
        invoice.paypalInvoiceId,
        new Date().toISOString(),
      ),
    ]);
    expect((await repository.get("change_orders", id, owner))?.status).toBe(
      "PAID",
    );
    expect(
      financialSummary(await service.workspace(owner), "USD"),
    ).toMatchObject({ protected: 22000, collected: 22000, outstanding: 0 });
    expect(
      (await repository.list("activity_logs", owner)).filter(
        (a) => a.eventType === "INVOICE_PAID",
      ),
    ).toHaveLength(1);
  });
  it("retains approval and the draft invoice when PayPal send fails", async () => {
    const { token, id } = await sentOrder();
    vi.spyOn(gateway, "send").mockRejectedValueOnce(
      new Error("Provider offline"),
    );
    await expect(service.decide(token, "approve")).rejects.toThrow(
      "Provider offline",
    );
    expect((await repository.get("change_orders", id, owner))?.status).toBe(
      "APPROVED",
    );
    expect((await repository.list("invoices", owner))[0].status).toBe("DRAFT");
    await service.decide(token, "approve");
    expect(await repository.list("invoices", owner)).toHaveLength(1);
    expect((await repository.get("change_orders", id, owner))?.status).toBe(
      "INVOICED",
    );
  });
  it("does not invoice rejected or unapproved work", async () => {
    const { token, id } = await sentOrder();
    await expect(
      service.execute(owner, "seller@example.com", { action: "invoice", id }),
    ).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });
    await service.decide(token, "reject");
    await service.decide(token, "reject");
    await expect(service.decide(token, "approve")).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
    expect(await repository.list("invoices", owner)).toHaveLength(0);
  });
  it("rejects tenant access, revoked links and unknown tokens", async () => {
    const { token, id } = await sentOrder();
    await expect(
      service.execute(randomUUID(), "other@example.com", {
        action: "send",
        id,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await service.execute(owner, "seller@example.com", {
      action: "revoke",
      id,
    });
    await expect(service.publicOrder(token)).rejects.toMatchObject({
      code: "LINK_UNAVAILABLE",
    });
    await expect(service.publicOrder("123")).rejects.toMatchObject({
      code: "LINK_UNAVAILABLE",
    });
  });
  it("returns uncertain for requests outside the demo fixture without suggesting a charge", async () => {
    await service.execute(owner, "seller@example.com", {
      action: "analyze",
      input: {
        projectId,
        requestText: "Please add a loyalty management system",
      },
    });
    const w = await service.workspace(owner);
    expect(w.analyses[0].result.classification).toBe("UNCERTAIN");
    expect(w.analyses[0].pricing.recommendedMinor).toBe(0);
    await expect(
      service.execute(owner, "seller@example.com", {
        action: "order",
        input: {
          projectId,
          analysisId: w.analyses[0].id,
          description: "Uncertain new request",
          amountMinor: 5000,
          timelineDays: 0,
        },
      }),
    ).rejects.toMatchObject({ code: "REVIEW_REQUIRED" });
  });
  it("rolls back mismatched payment, ignores stale payment status and handles full refunds", async () => {
    const { token, id } = await sentOrder();
    const invoice = (await service.decide(token, "approve")) as {
      paypalInvoiceId: string;
    };
    const event = {
      eventId: "bad",
      eventType: "DEMO.PAID",
      occurredAt: new Date().toISOString(),
      id: invoice.paypalInvoiceId,
      status: "PAID" as const,
      amountMinor: 100,
      paidMinor: 100,
      currency: "USD" as const,
    };
    await expect(repository.reconcile(event)).rejects.toMatchObject({
      code: "PAYMENT_MISMATCH",
    });
    expect((await repository.get("change_orders", id, owner))?.status).toBe(
      "INVOICED",
    );
    await service.processPayment(
      "paid",
      "DEMO.PAID",
      invoice.paypalInvoiceId,
      event.occurredAt,
    );
    await repository.reconcile({
      ...event,
      eventId: "stale",
      amountMinor: 22000,
      paidMinor: 0,
      status: "UNPAID",
    });
    expect((await repository.list("invoices", owner))[0].status).toBe("PAID");
    await repository.reconcile({
      ...event,
      eventId: "refund",
      amountMinor: 22000,
      paidMinor: 0,
      status: "REFUNDED",
    });
    expect(
      financialSummary(await service.workspace(owner), "USD"),
    ).toMatchObject({ protected: 0, collected: 0, outstanding: 0 });
  });
  it("enforces a rate limit across repository instances", async () => {
    await repository.rateLimit("test-key", 1, 60);
    await expect(
      new LocalRepository(directory).rateLimit("test-key", 1, 60),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
