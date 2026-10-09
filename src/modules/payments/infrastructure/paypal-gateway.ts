import "server-only";
import { z } from "zod";
import type {
  InvoiceGateway,
  InvoiceSnapshot,
  WebhookVerifier,
} from "@/modules/workspace/application/ports";
import type { ChangeOrder } from "@/modules/workspace/domain/entities";
import { CURRENCIES, decimal, toMinor } from "@/shared/domain/money";
import { ApplicationError } from "@/shared/errors/application-error";

const moneySchema = z.object({
  currency_code: z.enum(CURRENCIES),
  value: z.string(),
});
const paypalInvoiceSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: moneySchema,
  payments: z.object({ paid_amount: moneySchema.optional() }).optional(),
  detail: z
    .object({
      invoice_number: z.string().optional(),
      metadata: z.object({ recipient_view_url: z.url().optional() }).optional(),
    })
    .optional(),
});
export function mapPayPalInvoice(raw: unknown): InvoiceSnapshot {
  const value = paypalInvoiceSchema.parse(raw);
  const states: Record<string, InvoiceSnapshot["status"]> = {
    DRAFT: "DRAFT",
    SENT: "SENT",
    SCHEDULED: "SENT",
    UNPAID: "UNPAID",
    PAYMENT_PENDING: "UNPAID",
    PARTIALLY_PAID: "PARTIALLY_PAID",
    PAID: "PAID",
    MARKED_AS_PAID: "UNPAID",
    REFUNDED: "REFUNDED",
    MARKED_AS_REFUNDED: "REFUNDED",
    CANCELLED: "CANCELLED",
  };
  const status = states[value.status];
  if (!status)
    throw new ApplicationError(
      "UNKNOWN_INVOICE_STATUS",
      "Invoice status needs review.",
      503,
    );
  if (
    value.payments?.paid_amount &&
    value.payments.paid_amount.currency_code !== value.amount.currency_code
  )
    throw new ApplicationError(
      "PAYMENT_MISMATCH",
      "Payment currency differs from the invoice.",
      409,
    );
  return {
    id: value.id,
    status,
    amountMinor: toMinor(value.amount.value),
    currency: value.amount.currency_code,
    paidMinor:
      value.status === "MARKED_AS_PAID" || value.status === "MARKED_AS_REFUNDED"
        ? 0
        : value.payments?.paid_amount
          ? toMinor(value.payments.paid_amount.value)
          : 0,
  };
}
export function paypalPayload(
  order: ChangeOrder,
  recipient: { name: string; email: string },
  merchantEmail: string,
) {
  return {
    detail: {
      invoice_number: order.number,
      currency_code: order.currency,
      note: order.description,
      payment_term: { term_type: "DUE_ON_RECEIPT" },
      reference: order.id,
    },
    invoicer: { email_address: merchantEmail },
    primary_recipients: [
      {
        billing_info: {
          email_address: recipient.email,
          name: { full_name: recipient.name },
        },
      },
    ],
    items: [
      {
        name: "Approved additional project work",
        description: order.description.slice(0, 1000),
        quantity: "1",
        unit_amount: {
          currency_code: order.currency,
          value: decimal(order.amountMinor),
        },
      },
    ],
    configuration: {
      partial_payment: { allow_partial_payment: false },
      allow_tip: false,
      tax_calculated_after_discount: true,
      tax_inclusive: false,
    },
  };
}
export class PayPalGateway implements InvoiceGateway, WebhookVerifier {
  private token: { value: string; expiresAt: number } | null = null;
  private readonly base: string;
  constructor(
    private readonly config: {
      clientId: string;
      secret: string;
      webhookId: string;
      environment: "sandbox" | "live";
      merchantEmail: string;
    },
  ) {
    this.base =
      config.environment === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";
  }
  private async accessToken() {
    if (this.token && this.token.expiresAt > Date.now())
      return this.token.value;
    const response = await fetch(`${this.base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok)
      throw new ApplicationError(
        "PAYPAL_UNAVAILABLE",
        "PayPal is unavailable. Please retry.",
        503,
      );
    const token = z
      .object({ access_token: z.string(), expires_in: z.number() })
      .parse(await response.json());
    this.token = {
      value: token.access_token,
      expiresAt: Date.now() + (token.expires_in - 60) * 1000,
    };
    return token.access_token;
  }
  private async request(
    path: string,
    method = "GET",
    body?: unknown,
    requestId?: string,
  ): Promise<unknown> {
    const started = Date.now();
    try {
      const response = await fetch(`${this.base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${await this.accessToken()}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20000),
        cache: "no-store",
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const safeCode = (value: unknown) =>
          typeof value === "string" && /^[A-Z][A-Z0-9_]{0,79}$/.test(value)
            ? value
            : undefined;
        const details = Array.isArray(errorBody?.details)
          ? errorBody.details
          : [];
        const issues: string[] = details
          .map((detail: { issue?: unknown } | null) => safeCode(detail?.issue))
          .filter((issue: string | undefined): issue is string =>
            Boolean(issue),
          )
          .slice(0, 3);
        const debugId =
          typeof errorBody?.debug_id === "string" &&
          /^[a-zA-Z0-9_-]{1,80}$/.test(errorBody.debug_id)
            ? errorBody.debug_id
            : undefined;
        console.error(
          JSON.stringify({
            provider: "paypal",
            operation: path.endsWith("/send") ? "send_invoice" : method,
            status: response.status,
            errorName: safeCode(errorBody?.name),
            issues,
            debugId,
            success: false,
          }),
        );
        const detail = issues.length ? `; ${issues.join(", ")}` : "";
        throw new ApplicationError(
          "PAYPAL_UNAVAILABLE",
          `PayPal rejected this operation (HTTP ${response.status}${detail}). Approval is saved. Check the PayPal account configuration before retrying.`,
          503,
        );
      }
      console.info(
        JSON.stringify({
          provider: "paypal",
          operation: method,
          durationMs: Date.now() - started,
          success: true,
          requestId,
        }),
      );
      return response.status === 204 ? {} : response.json();
    } catch (error) {
      console.error(
        JSON.stringify({
          provider: "paypal",
          operation: method,
          durationMs: Date.now() - started,
          success: false,
          requestId,
        }),
      );
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError(
        "PAYPAL_UNAVAILABLE",
        "PayPal is unavailable. Approval is saved; please retry.",
        503,
      );
    }
  }
  async create(order: ChangeOrder, recipient: { name: string; email: string }) {
    if (order.currency === "IDR")
      throw new ApplicationError(
        "UNSUPPORTED_CURRENCY",
        "PayPal invoicing in this MVP supports USD, EUR and GBP. Use a supported project currency.",
      );
    const draft = z
      .object({ id: z.string().regex(/^INV2-[A-Z0-9-]+$/) })
      .parse(
        await this.request(
          "/v2/invoicing/invoices",
          "POST",
          paypalPayload(order, recipient, this.config.merchantEmail),
          order.id,
        ),
      );
    return { id: draft.id, number: order.number };
  }
  async send(id: string) {
    const path = `/v2/invoicing/invoices/${encodeURIComponent(id)}`;
    let raw = paypalInvoiceSchema.parse(await this.request(path));
    if (raw.status === "DRAFT") {
      await this.request(
        `${path}/send`,
        "POST",
        { send_to_recipient: true, send_to_invoicer: false },
        `send-${id}`,
      );
      raw = paypalInvoiceSchema.parse(await this.request(path));
    }
    const payerViewUrl = raw.detail?.metadata?.recipient_view_url;
    if (!payerViewUrl)
      throw new ApplicationError(
        "PAYPAL_LINK_UNAVAILABLE",
        "PayPal has not provided the payment link yet. Retry this invoice.",
        503,
      );
    const url = new URL(payerViewUrl);
    if (
      url.protocol !== "https:" ||
      ![
        "www.paypal.com",
        "www.sandbox.paypal.com",
        "paypal.com",
        "sandbox.paypal.com",
      ].includes(url.hostname)
    )
      throw new ApplicationError(
        "PAYPAL_LINK_INVALID",
        "PayPal returned an unsupported payment link.",
        503,
      );
    return { payerViewUrl };
  }
  async read(id: string) {
    return mapPayPalInvoice(
      await this.request(`/v2/invoicing/invoices/${encodeURIComponent(id)}`),
    );
  }
  async verify(headers: Headers, event: unknown) {
    const required = [
      "paypal-auth-algo",
      "paypal-cert-url",
      "paypal-transmission-id",
      "paypal-transmission-sig",
      "paypal-transmission-time",
    ];
    if (required.some((h) => !headers.get(h))) return false;
    const result = z.object({ verification_status: z.string() }).parse(
      await this.request("/v1/notifications/verify-webhook-signature", "POST", {
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: this.config.webhookId,
        webhook_event: event,
      }),
    );
    return result.verification_status === "SUCCESS";
  }
}
