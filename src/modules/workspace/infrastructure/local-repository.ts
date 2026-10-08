import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ChangeOrder, Entities, Invoice, Table } from "../domain/entities";
import type { PaymentEvent, WorkspaceRepository } from "../application/ports";
import { ApplicationError } from "@/shared/errors/application-error";

export interface LocalData {
  project_reviews: Entities["project_reviews"][];
  sessions: { tokenHash: string; userId: string; expiresAt: string }[];
  profiles: Entities["profiles"][];
  clients: Entities["clients"][];
  projects: Entities["projects"][];
  analyses: Entities["analyses"][];
  change_orders: ChangeOrder[];
  invoices: Invoice[];
  activity_logs: Entities["activity_logs"][];
  events: string[];
  limits: Record<string, { count: number; start: number }>;
}
function empty(): LocalData {
  return {
    project_reviews: [],
    sessions: [],
    profiles: [],
    clients: [],
    projects: [],
    analyses: [],
    change_orders: [],
    invoices: [],
    activity_logs: [],
    events: [],
    limits: {},
  };
}
const state = globalThis as typeof globalThis & {
  scopepayLocalQueues?: Map<string, Promise<unknown>>;
};
const queues = (state.scopepayLocalQueues ??= new Map<
  string,
  Promise<unknown>
>());
export class LocalRepository implements WorkspaceRepository {
  constructor(private readonly directory: string) {}
  private async read(): Promise<LocalData> {
    try {
      const data = JSON.parse(
        await readFile(join(this.directory, "workspace.json"), "utf8"),
      ) as LocalData;
      return {
        ...data,
        sessions: data.sessions ?? [],
        project_reviews: data.project_reviews ?? [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty();
      throw error;
    }
  }
  async mutate<T>(fn: (data: LocalData) => T): Promise<T> {
    const previous = queues.get(this.directory) ?? Promise.resolve();
    const operation = previous
      .catch(() => undefined)
      .then(async () => {
        const data = await this.read();
        const result = fn(data);
        await mkdir(this.directory, { recursive: true });
        const temp = join(
          this.directory,
          `workspace-${crypto.randomUUID()}.tmp`,
        );
        await writeFile(temp, JSON.stringify(data), "utf8");
        await rename(temp, join(this.directory, "workspace.json"));
        return result;
      });
    queues.set(this.directory, operation);
    return operation;
  }
  async list<K extends Table>(
    table: K,
    userId: string,
  ): Promise<Entities[K][]> {
    return (await this.read())[table]
      .filter((e) => e.userId === userId)
      .toSorted((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ) as Entities[K][];
  }
  async get<K extends Table>(
    table: K,
    id: string,
    userId: string,
  ): Promise<Entities[K] | null> {
    return (await this.list(table, userId)).find((e) => e.id === id) ?? null;
  }
  async save<K extends Table>(table: K, entity: Entities[K]) {
    await this.mutate((data) => {
      const rows = data[table] as Entities[K][];
      const index = rows.findIndex((e) => e.id === entity.id);
      if (index >= 0 && rows[index].userId !== entity.userId)
        throw new ApplicationError("FORBIDDEN", "Ownership mismatch.", 403);
      if (index >= 0) rows[index] = entity;
      else rows.push(entity);
    });
  }
  async findPublicOrder(tokenHash: string) {
    return (
      (await this.read()).change_orders.find(
        (o) => o.tokenHash === tokenHash,
      ) ?? null
    );
  }
  async transition(order: ChangeOrder, previousStatus: ChangeOrder["status"]) {
    return this.mutate((data) => {
      const index = data.change_orders.findIndex(
        (o) => o.id === order.id && o.userId === order.userId,
      );
      if (index < 0 || data.change_orders[index].status !== previousStatus)
        throw new ApplicationError(
          "STALE_ORDER",
          "This order changed. Refresh and retry.",
          409,
        );
      data.change_orders[index] = order;
      data.activity_logs.push({
        id: crypto.randomUUID(),
        userId: order.userId,
        projectId: order.projectId,
        createdAt: new Date().toISOString(),
        eventType: `CHANGE_ORDER_${order.status}`,
        description: `${order.number}: ${order.status.toLowerCase()}.`,
      });
      return order;
    });
  }
  async attachInvoice(order: ChangeOrder, invoice: Invoice) {
    return this.mutate((data) => {
      const current = data.change_orders.find(
        (o) => o.id === order.id && o.userId === order.userId,
      );
      if (!current || !["APPROVED", "INVOICED"].includes(current.status))
        throw new ApplicationError(
          "APPROVAL_REQUIRED",
          "Approval is required.",
          409,
        );
      const index = data.invoices.findIndex(
        (i) => i.changeOrderId === order.id,
      );
      if (index >= 0 && data.invoices[index].status !== "DRAFT")
        return data.invoices[index];
      if (index >= 0)
        data.invoices[index] = { ...invoice, id: data.invoices[index].id };
      else data.invoices.push(invoice);
      if (invoice.status === "SENT") {
        current.status = "INVOICED";
        data.activity_logs.push({
          id: crypto.randomUUID(),
          userId: order.userId,
          projectId: order.projectId,
          createdAt: new Date().toISOString(),
          eventType: "PAYPAL_INVOICE_CREATED",
          description: `Invoice ${invoice.number} sent.`,
        });
      }
      return index >= 0 ? data.invoices[index] : invoice;
    });
  }
  async reconcile(event: PaymentEvent) {
    await this.mutate((data) => {
      if (data.events.includes(event.eventId)) return;
      const invoice = data.invoices.find((i) => i.paypalInvoiceId === event.id);
      if (!invoice)
        throw new ApplicationError(
          "INVOICE_NOT_FOUND",
          "Invoice has not been saved yet. Retry this event.",
          503,
        );
      if (
        invoice.currency !== event.currency ||
        invoice.amountMinor !== event.amountMinor ||
        event.paidMinor < 0 ||
        event.paidMinor > invoice.amountMinor
      )
        throw new ApplicationError(
          "PAYMENT_MISMATCH",
          "Invoice amount or currency mismatch.",
          409,
        );
      if (event.status === "PAID" && event.paidMinor !== invoice.amountMinor)
        throw new ApplicationError(
          "PAYMENT_MISMATCH",
          "Full payment has not been received.",
          409,
        );
      if (
        invoice.status === "REFUNDED" ||
        (invoice.status === "PAID" && event.status !== "REFUNDED")
      ) {
        data.events.push(event.eventId);
        return;
      }
      invoice.status = event.status;
      invoice.paidMinor = event.status === "REFUNDED" ? 0 : event.paidMinor;
      if (event.status === "PAID") {
        invoice.paidAt = event.occurredAt;
        const order = data.change_orders.find(
          (o) => o.id === invoice.changeOrderId,
        );
        if (!order || !["INVOICED", "PAID"].includes(order.status))
          throw new ApplicationError(
            "INVALID_TRANSITION",
            "Payment requires an invoiced order.",
            409,
          );
        order.status = "PAID";
      }
      data.events.push(event.eventId);
      data.activity_logs.push({
        id: crypto.randomUUID(),
        userId: invoice.userId,
        projectId: invoice.projectId,
        createdAt: event.occurredAt,
        eventType: `INVOICE_${event.status}`,
        description: `${invoice.number}: ${event.status.toLowerCase()}.`,
      });
    });
  }
  async rateLimit(key: string, limit: number, windowSeconds: number) {
    await this.mutate((data) => {
      const now = Date.now();
      for (const [k, v] of Object.entries(data.limits))
        if (v.start + windowSeconds * 1000 < now) delete data.limits[k];
      const bucket = data.limits[key] ?? { count: 0, start: now };
      if (bucket.count >= limit)
        throw new ApplicationError(
          "RATE_LIMITED",
          "Too many requests. Please retry in a minute.",
          429,
        );
      bucket.count++;
      data.limits[key] = bucket;
    });
  }
}
