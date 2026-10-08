import Link from "next/link";
import { notFound } from "next/navigation";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { Money, PageHeader, Status } from "@/shared/presentation/components";
export default async function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, workspace: w } = await workspaceData();
  const i = w.invoices.find((i) => i.id === id);
  if (!i) notFound();
  return (
    <>
      <PageHeader
        title={i.number}
        description={w.projects.find((p) => p.id === i.projectId)?.name}
        action={<Status value={i.status} />}
      />
      <section className="panel form-container">
        <h2>Approved additional work</h2>
        <p className="scope-text">
          {w.orders.find((o) => o.id === i.changeOrderId)?.description}
        </p>
        <dl className="detail-grid">
          <div>
            <dt>Invoice amount</dt>
            <dd>
              <Money minor={i.amountMinor} currency={i.currency} />
            </dd>
          </div>
          <div>
            <dt>Recorded payment</dt>
            <dd>
              <Money minor={i.paidMinor} currency={i.currency} />
            </dd>
          </div>
          <div>
            <dt>Sent</dt>
            <dd>
              {i.sentAt
                ? new Date(i.sentAt).toLocaleDateString("en-GB", {
                    timeZone: "Asia/Jakarta",
                  })
                : "Not sent"}
            </dd>
          </div>
          <div>
            <dt>Paid</dt>
            <dd>
              {i.paidAt
                ? new Date(i.paidAt).toLocaleDateString("en-GB", {
                    timeZone: "Asia/Jakarta",
                  })
                : "Not paid"}
            </dd>
          </div>
        </dl>
        <div className="button-row spaced">
          <Link
            className="button secondary"
            href={`/app/change-orders/${i.changeOrderId}`}
          >
            View change order
          </Link>
          {!user.demo && i.payerViewUrl && (
            <a className="button primary" href={i.payerViewUrl}>
              Open PayPal invoice
            </a>
          )}
        </div>
        {user.demo && (
          <p className="small spaced">
            Demo invoice. Simulate payment through the original client approval
            link.
          </p>
        )}
      </section>
    </>
  );
}
