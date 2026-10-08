import { NextResponse } from "next/server";
import { env } from "@/shared/config/env";
import { runtime } from "@/shared/infrastructure/runtime";
import { assertOrigin, errorResponse } from "@/shared/presentation/http";
import { ApplicationError } from "@/shared/errors/application-error";
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    assertOrigin(request);
    if (env().APP_MODE !== "demo")
      throw new ApplicationError(
        "DEMO_DISABLED",
        "Payment simulation is unavailable.",
        404,
      );
    const { token } = await context.params;
    const { service } = await runtime(true);
    const { order, invoice } = await service.publicOrder(token, false);
    if (!invoice || !["INVOICED", "PAID"].includes(order.status))
      throw new ApplicationError(
        "INVOICE_REQUIRED",
        "Approve this order before simulating payment.",
        409,
      );
    await service.processPayment(
      `demo-paid-${invoice.id}`,
      "DEMO.PAYMENT",
      invoice.paypalInvoiceId,
      new Date().toISOString(),
    );
    return NextResponse.json({ data: { status: "PAID" }, error: null });
  } catch (error) {
    return errorResponse(error);
  }
}
