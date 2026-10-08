import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PayPalGateway,
  mapPayPalInvoice,
} from "@/modules/payments/infrastructure/paypal-gateway";
import { GeminiAnalyzer } from "@/modules/scope-analysis/infrastructure/gemini-analyzer";
import { projectFixture, orderFixture } from "./fixtures";
afterEach(() => vi.restoreAllMocks());
const config = {
  clientId: "test-id",
  secret: "test-secret",
  webhookId: "test-webhook",
  environment: "sandbox" as const,
  merchantEmail: "seller@example.com",
};
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
describe("provider boundaries", () => {
  it("uses a stable invoice idempotency key and a separate explicit send", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ access_token: "token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(response({ id: "INV2-TEST" }))
      .mockResolvedValueOnce(
        response({
          id: "INV2-TEST",
          status: "DRAFT",
          amount: { currency_code: "USD", value: "220.00" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        response({
          id: "INV2-TEST",
          status: "SENT",
          amount: { currency_code: "USD", value: "220.00" },
          detail: {
            metadata: {
              recipient_view_url:
                "https://www.sandbox.paypal.com/invoice/payer/TEST",
            },
          },
        }),
      );
    const gateway = new PayPalGateway(config);
    const order = orderFixture({ status: "APPROVED" });
    expect(
      await gateway.create(order, {
        name: "Client",
        email: "client@example.com",
      }),
    ).toMatchObject({ id: "INV2-TEST" });
    expect(fetcher.mock.calls[1][1]?.headers).toMatchObject({
      "PayPal-Request-Id": order.id,
    });
    expect(fetcher.mock.calls).toHaveLength(2);
    expect(await gateway.send("INV2-TEST")).toMatchObject({
      payerViewUrl: "https://www.sandbox.paypal.com/invoice/payer/TEST",
    });
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).endsWith("/send")),
    ).toHaveLength(1);
  });
  it("does not resend an already sent invoice and rejects unexpected redirect hosts", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ access_token: "token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        response({
          id: "INV2-TEST",
          status: "SENT",
          amount: { currency_code: "USD", value: "220.00" },
          detail: {
            metadata: { recipient_view_url: "https://attacker.example" },
          },
        }),
      );
    await expect(
      new PayPalGateway(config).send("INV2-TEST"),
    ).rejects.toMatchObject({ code: "PAYPAL_LINK_INVALID" });
    expect(fetcher.mock.calls).toHaveLength(2);
  });
  it("rejects a missing or failed webhook signature", async () => {
    const gateway = new PayPalGateway(config);
    expect(await gateway.verify(new Headers(), {})).toBe(false);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ access_token: "token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(response({ verification_status: "FAILURE" }));
    const headers = new Headers(
      Object.fromEntries(
        [
          "paypal-auth-algo",
          "paypal-cert-url",
          "paypal-transmission-id",
          "paypal-transmission-sig",
          "paypal-transmission-time",
        ].map((k) => [k, "test"]),
      ),
    );
    expect(await gateway.verify(headers, { id: "event" })).toBe(false);
  });
  it("rejects unsupported currencies and refuses to count manually marked payments", async () => {
    await expect(
      new PayPalGateway(config).create(orderFixture({ currency: "IDR" }), {
        name: "Client",
        email: "client@example.com",
      }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_CURRENCY" });
    expect(
      mapPayPalInvoice({
        id: "INV2-TEST",
        status: "MARKED_AS_PAID",
        amount: { currency_code: "USD", value: "220.00" },
        payments: { paid_amount: { currency_code: "USD", value: "220.00" } },
      }).paidMinor,
    ).toBe(0);
  });
  it("fails safely on malformed Gemini output", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      response({
        candidates: [
          {
            content: {
              parts: [
                { text: '{"classification":"OUT_OF_SCOPE","hoursMin":-100}' },
              ],
            },
          },
        ],
      }),
    );
    await expect(
      new GeminiAnalyzer("key", "gemini-2.5-flash").analyze(
        projectFixture,
        "Additional request",
      ),
    ).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
  });
  it("preserves validated structured Gemini results", async () => {
    const result = {
      classification: "OUT_OF_SCOPE",
      confidence: 0.9,
      summary: "Google authentication is absent from the baseline.",
      matchedScopeItems: [],
      newScopeItems: ["Google authentication"],
      complexity: "MEDIUM",
      hoursMin: 4,
      hoursMax: 6,
      riskLevel: "LOW",
      recommendedAction: "CREATE_CHANGE_ORDER",
    };
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      response({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(result) }] } },
        ],
      }),
    );
    expect(
      await new GeminiAnalyzer("key", "gemini-2.5-flash").analyze(
        projectFixture,
        "Add Google login",
      ),
    ).toEqual(result);
    expect(
      JSON.parse(String(fetcher.mock.calls[0][1]?.body)).generationConfig
        .responseMimeType,
    ).toBe("application/json");
  });
});
