import Link from "next/link";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import {
  Empty,
  Money,
  PageHeader,
  Stat,
  Status,
} from "@/shared/presentation/components";
import { financialSummary } from "@/modules/workspace/domain/entities";
export default async function Payments() {
  const { workspace: w } = await workspaceData();
  const currency = w.profile?.currency ?? "USD";
  const s = financialSummary(w, currency);
  return (
    <>
      <PageHeader
        title="Payments"
        description="Invoice lifecycle and recorded payment amounts."
      />
      <div className="stats">
        <Stat
          label="Collected"
          minor={s.collected}
          currency={currency}
          detail="Invoice payments received"
        />
        <Stat
          label="Outstanding"
          minor={s.outstanding}
          currency={currency}
          detail="Remaining invoice balance"
        />
        <Stat
          label="Protected revenue"
          minor={s.protected}
          currency={currency}
          detail="Approved additional work"
        />
      </div>
      <p className="small">
        Summary shows {currency}. The table retains each invoice&apos;s original
        currency.
      </p>
      {!w.invoices.length ? (
        <Empty
          title="No invoices yet"
          description="An approved change order can become an invoice."
          href="/app/change-orders"
          label="Review change orders"
        />
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client / project</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {w.invoices.map((i) => {
                const project = w.projects.find((p) => p.id === i.projectId);
                const client = w.clients.find(
                  (c) => c.id === project?.clientId,
                );
                return (
                  <tr key={i.id}>
                    <td data-label="Invoice">
                      {i.number}
                      <small>Change order · Due on receipt</small>
                    </td>
                    <td data-label="Client / project">
                      <span>
                        {client?.name}
                        <small>{project?.name}</small>
                      </span>
                    </td>
                    <td data-label="Amount">
                      <Money minor={i.amountMinor} currency={i.currency} />
                    </td>
                    <td data-label="Paid">
                      <Money minor={i.paidMinor} currency={i.currency} />
                    </td>
                    <td data-label="Status">
                      <Status value={i.status} />
                    </td>
                    <td data-label="Action">
                      <Link
                        className="text-link"
                        href={`/app/payments/${i.id}`}
                      >
                        View invoice
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
