import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRepository } from "@/modules/workspace/infrastructure/supabase-repository";
import {
  owner,
  clientId,
  projectId,
  profileFixture,
  projectFixture,
  orderFixture,
} from "./fixtures";
let db: PGlite;
const other = "52345678-1234-4123-a123-123456789012";
const invoiceId = "62345678-1234-4123-a123-123456789012";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${owner}'),('${other}');`);
  await db.exec(
    await readFile("supabase/migrations/202610080001_core.sql", "utf8"),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/202610080002_project_reviews.sql",
      "utf8",
    ),
  );
  for (const [table, record] of [
    ["profiles", profileFixture],
    [
      "clients",
      {
        id: clientId,
        userId: owner,
        createdAt: new Date().toISOString(),
        name: "Client",
        email: "client@example.com",
      },
    ],
    ["projects", projectFixture],
    ["change_orders", orderFixture()],
  ] as const) {
    await db.query(
      `insert into public.${table}(id,user_id,data) values($1,$2,$3::jsonb)`,
      [record.id, owner, JSON.stringify(record)],
    );
  }
}, 60000);
afterAll(async () => {
  await db?.close();
});

it("creates an approval link after PostgREST reformats the row timestamp", async () => {
  await db.exec("begin");
  try {
    const record = orderFixture({
      id: crypto.randomUUID(),
      createdAt: "2026-10-09T00:00:00.000Z",
    });
    await db.query(
      "insert into public.change_orders(id,user_id,created_at,data) values($1,$2,$3,$4::jsonb)",
      [record.id, owner, record.createdAt, JSON.stringify(record)],
    );
    const row = {
      id: record.id,
      user_id: owner,
      created_at: "2026-10-09T00:00:00+00:00",
      data: record,
    };
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: row, error: null }),
    };
    const client = { from: () => query } as unknown as SupabaseClient;
    const service = {
      rpc: async (
        _name: string,
        args: { p_order: unknown; p_previous_status: string },
      ) => {
        const result = await db.query<{
          data: ReturnType<typeof orderFixture>;
        }>("select public.transition_order($1::jsonb,$2) as data", [
          JSON.stringify(args.p_order),
          args.p_previous_status,
        ]);
        return { data: result.rows[0].data, error: null };
      },
    } as unknown as SupabaseClient;
    const repository = new SupabaseRepository(client, service);
    const loaded = await repository.get("change_orders", record.id, owner);
    expect(loaded?.createdAt).toBe(record.createdAt);
    const sent = {
      ...loaded!,
      status: "SENT" as const,
      tokenHash: "timestamp-regression-token",
      tokenExpiresAt: "2026-10-16T00:00:00.000Z",
    };
    expect((await repository.transition(sent, "DRAFT")).status).toBe("SENT");
    await expect(
      repository.transition(
        { ...sent, status: "VIEWED", amountMinor: sent.amountMinor + 1 },
        "SENT",
      ),
    ).rejects.toThrow("Immutable order data");
  } finally {
    await db.exec("rollback");
  }
});

describe("PostgreSQL migration and isolation", () => {
  it("allows owner reads and rejects another tenant", async () => {
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub = '${owner}'`,
    );
    expect((await db.query("select * from public.projects")).rows).toHaveLength(
      1,
    );
    await db.exec(`set request.jwt.claim.sub = '${other}'`);
    expect((await db.query("select * from public.projects")).rows).toHaveLength(
      0,
    );
    await db.exec("reset role");
  });
  it("blocks anonymous table access and authenticated financial RPC calls", async () => {
    await db.exec("set role anon");
    await expect(
      db.query("select * from public.change_orders"),
    ).rejects.toThrow();
    await db.exec("reset role");
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub = '${owner}'`,
    );
    await expect(
      db.query("select public.transition_order($1::jsonb,'DRAFT')", [
        JSON.stringify(orderFixture({ status: "SENT" })),
      ]),
    ).rejects.toThrow();
    await expect(
      db.query(
        "update public.change_orders set data=jsonb_set(data,'{status}','\"PAID\"')",
      ),
    ).rejects.toThrow();
    await db.exec("reset role");
  });
  it("rejects cross-tenant relationships at the database boundary", async () => {
    const row = { ...projectFixture, id: crypto.randomUUID(), userId: other };
    await expect(
      db.query(
        "insert into public.projects(id,user_id,data) values($1,$2,$3::jsonb)",
        [row.id, other, JSON.stringify(row)],
      ),
    ).rejects.toThrow(/foreign key/i);
  });
  it("runs atomic invoice and verified payment reconciliation with duplicate protection", async () => {
    const original = orderFixture();
    await db.query("select public.transition_order($1::jsonb,'DRAFT')", [
      JSON.stringify({
        ...original,
        status: "SENT",
        tokenHash: "a".repeat(64),
        tokenExpiresAt: "2030-01-01T00:00:00Z",
      }),
    ]);
    const sent = (
      await db.query<{ data: typeof original }>(
        "select data from public.change_orders",
      )
    ).rows[0].data;
    await db.query("select public.transition_order($1::jsonb,'SENT')", [
      JSON.stringify({
        ...sent,
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
      }),
    ]);
    const invoice = {
      id: invoiceId,
      userId: owner,
      projectId,
      changeOrderId: original.id,
      createdAt: new Date().toISOString(),
      paypalInvoiceId: "INV2-TEST",
      number: "INV-TEST",
      amountMinor: 22000,
      paidMinor: 0,
      currency: "USD",
      status: "SENT",
      payerViewUrl: "https://www.sandbox.paypal.com/invoice/test",
      sentAt: new Date().toISOString(),
      paidAt: null,
    };
    await db.query("select public.attach_invoice($1,$2,$3::jsonb)", [
      original.id,
      owner,
      JSON.stringify(invoice),
    ]);
    const event = {
      eventId: "event-db-1",
      eventType: "INVOICING.INVOICE.PAID",
      occurredAt: new Date().toISOString(),
      id: "INV2-TEST",
      status: "PAID",
      amountMinor: 22000,
      paidMinor: 22000,
      currency: "USD",
    };
    await expect(
      db.query("select public.reconcile_payment($1::jsonb)", [
        JSON.stringify({ ...event, currency: "EUR" }),
      ]),
    ).rejects.toThrow(/mismatch/i);
    expect(
      (await db.query("select * from public.paypal_events")).rows,
    ).toHaveLength(0);
    await db.query("select public.reconcile_payment($1::jsonb)", [
      JSON.stringify(event),
    ]);
    await db.query("select public.reconcile_payment($1::jsonb)", [
      JSON.stringify(event),
    ]);
    expect(
      (
        await db.query<{ status: string }>(
          "select status from public.change_orders",
        )
      ).rows[0].status,
    ).toBe("PAID");
    expect(
      (await db.query("select * from public.paypal_events")).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "select * from public.activity_logs where data->>'eventType'='INVOICE_PAID'",
        )
      ).rows,
    ).toHaveLength(1);
    await db.query("select public.reconcile_payment($1::jsonb)", [
      JSON.stringify({
        ...event,
        eventId: "stale-db",
        status: "UNPAID",
        paidMinor: 0,
      }),
    ]);
    expect(
      (await db.query<{ status: string }>("select status from public.invoices"))
        .rows[0].status,
    ).toBe("PAID");
  });
  it("persists a shared rate limit", async () => {
    expect(
      (
        await db.query<{ allowed: boolean }>(
          "select public.consume_rate_limit('test',1,60) as allowed",
        )
      ).rows[0].allowed,
    ).toBe(true);
    expect(
      (
        await db.query<{ allowed: boolean }>(
          "select public.consume_rate_limit('test',1,60) as allowed",
        )
      ).rows[0].allowed,
    ).toBe(false);
  });
});
