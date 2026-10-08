import Link from "next/link";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import {
  Empty,
  Money,
  PageHeader,
  Status,
} from "@/shared/presentation/components";
export default async function Projects() {
  const { workspace: w } = await workspaceData();
  return (
    <>
      <PageHeader
        title="Projects"
        description="Agreed scope and commercial status for each client project."
        action={
          <Link className="button primary" href="/app/projects/new">
            New project
          </Link>
        }
      />
      {!w.projects.length ? (
        <Empty
          title="No projects yet"
          description="Capture the baseline before assessing a client request."
          href="/app/projects/new"
          label="Create project"
        />
      ) : (
        <div className="project-grid">
          {w.projects.map((p) => {
            const invoices = w.invoices.filter((i) => i.projectId === p.id);
            const orders = w.orders.filter((o) => o.projectId === p.id);
            const outstanding = invoices
              .filter(
                (i) => !["DRAFT", "REFUNDED", "CANCELLED"].includes(i.status),
              )
              .reduce((s, i) => s + i.amountMinor - i.paidMinor, 0);
            const protectedMinor = orders
              .filter(
                (o) =>
                  ["APPROVED", "INVOICED", "PAID"].includes(o.status) &&
                  !invoices.some(
                    (i) =>
                      i.changeOrderId === o.id &&
                      ["REFUNDED", "CANCELLED"].includes(i.status),
                  ),
              )
              .reduce((s, o) => s + o.amountMinor, 0);
            return (
              <article className="panel project-card" key={p.id}>
                <h2>
                  <Link href={`/app/projects/${p.id}`}>{p.name}</Link>
                </h2>
                <p>{w.clients.find((c) => c.id === p.clientId)?.name}</p>
                <Status
                  value={
                    outstanding > 0
                      ? "AWAITING_PAYMENT"
                      : orders.some((o) => o.status === "DRAFT")
                        ? "NEEDS_REVIEW"
                        : p.status
                  }
                />
                <dl className="detail-grid">
                  <div>
                    <dt>Original value</dt>
                    <dd>
                      <Money
                        minor={p.originalValueMinor}
                        currency={p.currency}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Collected</dt>
                    <dd>
                      <Money
                        minor={invoices
                          .filter((i) => i.status !== "REFUNDED")
                          .reduce((s, i) => s + i.paidMinor, 0)}
                        currency={p.currency}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Protected additional work</dt>
                    <dd>
                      <Money minor={protectedMinor} currency={p.currency} />
                    </dd>
                  </div>
                  <div>
                    <dt>Invoice outstanding</dt>
                    <dd>
                      <Money minor={outstanding} currency={p.currency} />
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
