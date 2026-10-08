import type {
  InvoiceGateway,
  InvoiceSnapshot,
} from "@/modules/workspace/application/ports";
import type { ChangeOrder } from "@/modules/workspace/domain/entities";
import type { LocalRepository } from "@/modules/workspace/infrastructure/local-repository";
import { ApplicationError } from "@/shared/errors/application-error";

export class DemoGateway implements InvoiceGateway {
  constructor(private readonly repository: LocalRepository) {}
  async create(order: ChangeOrder) {
    return {
      id: `DEMO-${order.id}`,
      number: order.number.replace("CHG", "DEMO-INV"),
    };
  }
  async send() {
    return { payerViewUrl: "/app/payments" };
  }
  async read(id: string): Promise<InvoiceSnapshot> {
    const data = await this.repository.mutate((data) =>
      data.invoices.find((i) => i.paypalInvoiceId === id),
    );
    if (!data)
      throw new ApplicationError("NOT_FOUND", "Demo invoice unavailable.", 404);
    return {
      id,
      status: "PAID",
      amountMinor: data.amountMinor,
      paidMinor: data.amountMinor,
      currency: data.currency,
    };
  }
}
