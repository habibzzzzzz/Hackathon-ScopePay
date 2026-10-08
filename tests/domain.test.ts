import { describe, expect, it } from "vitest";
import { decimal, toMinor } from "@/shared/domain/money";
import { calculateRecommendedCharge } from "@/modules/payments/domain/pricing";
import {
  assertTokenActive,
  assertTransition,
  ORDER_STATUSES,
} from "@/modules/change-orders/domain/policy";
import {
  scopeResultSchema,
  projectInput,
} from "@/modules/workspace/application/validation";
import {
  financialSummary,
  type Workspace,
} from "@/modules/workspace/domain/entities";
import {
  mapPayPalInvoice,
  paypalPayload,
} from "@/modules/payments/infrastructure/paypal-gateway";
import { orderFixture } from "./fixtures";

describe("monetary rules", () => {
  it("calculates the PRD $220 example with transparent inputs", () => {
    const result = calculateRecommendedCharge({
      hoursMin: 8,
      hoursMax: 12,
      hourlyRateMinor: 2000,
      minimumChargeMinor: 5000,
      riskPercent: 10,
      urgencyPercent: 100,
    });
    expect(result).toMatchObject({
      minMinor: 17600,
      maxMinor: 26400,
      recommendedMinor: 22000,
    });
  });
  it("preserves cents and enforces the minimum", () => {
    expect(toMinor("0.29")).toBe(29);
    expect(decimal(12345)).toBe("123.45");
    expect(
      calculateRecommendedCharge({
        hoursMin: 0.25,
        hoursMax: 0.5,
        hourlyRateMinor: 2000,
        minimumChargeMinor: 5000,
        riskPercent: 0,
        urgencyPercent: 100,
      }).recommendedMinor,
    ).toBe(5000);
    for (const invalid of ["NaN", "-1", "1.001", "1e3"])
      expect(() => toMinor(invalid)).toThrow();
  });
  it("rejects inverted or nonfinite effort ranges", () => {
    const input = {
      hoursMin: 8,
      hoursMax: 4,
      hourlyRateMinor: 2000,
      minimumChargeMinor: 0,
      riskPercent: 0,
      urgencyPercent: 100,
    };
    expect(() => calculateRecommendedCharge(input)).toThrow();
    expect(() =>
      calculateRecommendedCharge({ ...input, hoursMax: Infinity }),
    ).toThrow();
  });
});
describe("order authorization", () => {
  it("requires approval before invoicing", () => {
    for (const from of ORDER_STATUSES) {
      if (from === "APPROVED")
        expect(() => assertTransition(from, "INVOICED")).not.toThrow();
      else expect(() => assertTransition(from, "INVOICED")).toThrow();
    }
  });
  it("rejects expiry and revocation, including malformed dates", () => {
    expect(() =>
      assertTokenActive("2030-01-01T00:00:00Z", null, 0),
    ).not.toThrow();
    expect(() => assertTokenActive("invalid", null)).toThrow();
    expect(() => assertTokenActive("2000-01-01T00:00:00Z", null)).toThrow();
    expect(() =>
      assertTokenActive("2030-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
    ).toThrow();
  });
});
describe("boundary validation", () => {
  it("rejects inconsistent AI recommendations", () => {
    const raw = {
      classification: "UNCERTAIN",
      confidence: 0.7,
      summary: "Insufficient contract context.",
      matchedScopeItems: [],
      newScopeItems: [],
      complexity: "LOW",
      hoursMin: 8,
      hoursMax: 4,
      riskLevel: "LOW",
      recommendedAction: "CREATE_CHANGE_ORDER",
    };
    expect(scopeResultSchema.safeParse(raw).success).toBe(false);
    expect(
      scopeResultSchema.safeParse({
        ...raw,
        classification: "WITHIN_SCOPE",
        hoursMax: 10,
      }).success,
    ).toBe(false);
    expect(projectInput.safeParse({}).success).toBe(false);
  });
  it("maps verified PayPal status and never counts manual marks as payment", () => {
    expect(
      mapPayPalInvoice({
        id: "INV2-test",
        status: "PAID",
        amount: { currency_code: "USD", value: "220.00" },
        payments: { paid_amount: { currency_code: "USD", value: "220.00" } },
      }),
    ).toMatchObject({ amountMinor: 22000, paidMinor: 22000, status: "PAID" });
    expect(
      mapPayPalInvoice({
        id: "INV2-test",
        status: "MARKED_AS_PAID",
        amount: { currency_code: "USD", value: "220.00" },
      }).status,
    ).toBe("UNPAID");
    expect(
      paypalPayload(
        orderFixture(),
        { name: "Client", email: "client@example.com" },
        "seller@example.com",
      ).items[0].unit_amount.value,
    ).toBe("220.00");
  });
  it("keeps protected revenue separate from cash and currencies", () => {
    const w: Workspace = {
      reviews: [],
      profile: null,
      clients: [],
      projects: [],
      analyses: [],
      invoices: [],
      activity: [],
      orders: [
        orderFixture({ status: "APPROVED" }),
        orderFixture({
          id: crypto.randomUUID(),
          currency: "EUR",
          status: "PAID",
        }),
        orderFixture({ id: crypto.randomUUID(), status: "DRAFT" }),
      ],
    };
    expect(financialSummary(w, "USD")).toMatchObject({
      protected: 22000,
      collected: 0,
      outstanding: 0,
    });
  });
});
