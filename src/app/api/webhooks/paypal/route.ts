import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/shared/config/env";
import { runtime } from "@/shared/infrastructure/runtime";
import { PayPalGateway } from "@/modules/payments/infrastructure/paypal-gateway";
import { errorResponse, readJson } from "@/shared/presentation/http";
import { ApplicationError } from "@/shared/errors/application-error";

const eventSchema = z.object({
  id: z.string().min(1).max(100),
  event_type: z.string().max(100),
  create_time: z.iso.datetime(),
  resource: z.object({
    id: z.string().max(100).optional(),
    invoice_id: z.string().max(100).optional(),
    invoice: z.object({ id: z.string().max(100) }).optional(),
  }),
});
export async function POST(request: Request) {
  try {
    if (env().APP_MODE !== "live")
      throw new ApplicationError(
        "WEBHOOK_DISABLED",
        "Webhooks require live mode.",
        404,
      );
    const raw = await readJson(request, 300000);
    const { service, gateway } = await runtime(true);
    if (
      !(gateway instanceof PayPalGateway) ||
      !(await gateway.verify(request.headers, raw))
    )
      throw new ApplicationError(
        "INVALID_SIGNATURE",
        "Invalid webhook signature.",
        401,
      );
    const event = eventSchema.parse(raw);
    if (
      ![
        "INVOICING.INVOICE.PAID",
        "INVOICING.INVOICE.REFUNDED",
        "INVOICING.INVOICE.CANCELLED",
        "INVOICING.INVOICE.UPDATED",
      ].includes(event.event_type)
    )
      return NextResponse.json({ received: true, ignored: true });
    const invoiceId =
      event.resource.invoice?.id ??
      event.resource.invoice_id ??
      event.resource.id;
    if (!invoiceId || !/^INV2-[A-Z0-9-]+$/.test(invoiceId))
      throw new ApplicationError("INVALID_EVENT", "Invoice ID is missing.");
    await service.processPayment(
      event.id,
      event.event_type,
      invoiceId,
      event.create_time,
    );
    return NextResponse.json({ received: true });
  } catch (error) {
    return errorResponse(error);
  }
}
