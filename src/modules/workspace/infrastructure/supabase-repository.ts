import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApplicationError } from "@/shared/errors/application-error";
import type { ChangeOrder, Entities, Invoice, Table } from "../domain/entities";
import type { PaymentEvent, WorkspaceRepository } from "../application/ports";

function dbError(error: { message: string; code?: string } | null) {
  if (!error) return;
  console.error(
    JSON.stringify({ operation: "database", code: error.code, success: false }),
  );
  const conflict = ["P0001", "23505", "23514"].includes(error.code ?? "");
  throw new ApplicationError(
    conflict ? "STATE_CONFLICT" : "DATABASE_UNAVAILABLE",
    conflict
      ? "The record changed or violates a business rule. Refresh and retry."
      : "Data is temporarily unavailable. Please retry.",
    conflict ? 409 : 503,
  );
}
interface PersistenceRow<K extends Table> {
  id: string;
  user_id: string;
  created_at: string;
  data: Entities[K];
}
function encode<K extends Table>(entity: Entities[K]): PersistenceRow<K> {
  return {
    id: entity.id,
    user_id: entity.userId,
    created_at: entity.createdAt,
    data: entity,
  };
}
function decode<K extends Table>(row: PersistenceRow<K>): Entities[K] {
  return {
    ...row.data,
    id: row.id,
    userId: row.user_id,
    // RPC immutability compares snapshot JSON; PostgREST formats timestamps differently.
    createdAt: row.data.createdAt,
  };
}

export class SupabaseRepository implements WorkspaceRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly serviceClient: SupabaseClient,
  ) {}
  async list<K extends Table>(
    table: K,
    userId: string,
  ): Promise<Entities[K][]> {
    const client = this.userClient;
    const { data, error } = await client
      .from(table)
      .select("id,user_id,created_at,data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000);
    dbError(error);
    return ((data ?? []) as PersistenceRow<K>[]).map(decode);
  }
  async get<K extends Table>(
    table: K,
    id: string,
    userId: string,
  ): Promise<Entities[K] | null> {
    const { data, error } = await this.userClient
      .from(table)
      .select("id,user_id,created_at,data")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    dbError(error);
    return data ? decode(data as PersistenceRow<K>) : null;
  }
  async save<K extends Table>(table: K, entity: Entities[K]) {
    const query = this.userClient.from(table);
    const { error } =
      table === "analyses" ||
      table === "activity_logs" ||
      table === "project_reviews"
        ? await query.insert(encode(entity))
        : await query.upsert(encode(entity));
    dbError(error);
  }
  async findPublicOrder(tokenHash: string) {
    const { data, error } = await this.serviceClient
      .from("change_orders")
      .select("id,user_id,created_at,data")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    dbError(error);
    return data ? decode(data as PersistenceRow<"change_orders">) : null;
  }
  async transition(order: ChangeOrder, previousStatus: ChangeOrder["status"]) {
    const { data, error } = await this.serviceClient.rpc("transition_order", {
      p_order: order,
      p_previous_status: previousStatus,
    });
    dbError(error);
    return data as ChangeOrder;
  }
  async attachInvoice(order: ChangeOrder, invoice: Invoice) {
    const { data, error } = await this.serviceClient.rpc("attach_invoice", {
      p_order_id: order.id,
      p_user_id: order.userId,
      p_invoice: invoice,
    });
    dbError(error);
    return data as Invoice;
  }
  async reconcile(event: PaymentEvent) {
    const { error } = await this.serviceClient.rpc("reconcile_payment", {
      p_event: event,
    });
    dbError(error);
  }
  async rateLimit(key: string, limit: number, windowSeconds: number) {
    const { data, error } = await this.serviceClient.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_seconds: windowSeconds,
    });
    dbError(error);
    if (!data)
      throw new ApplicationError(
        "RATE_LIMITED",
        "Too many requests. Please retry in a minute.",
        429,
      );
  }
}
