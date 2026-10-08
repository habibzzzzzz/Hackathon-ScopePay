import Link from "next/link";
import { notFound } from "next/navigation";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { Money, PageHeader, Status } from "@/shared/presentation/components";
import { OrderActions } from "@/modules/change-orders/presentation/order-actions";
export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace: w } = await workspaceData();
  const o = w.orders.find((o) => o.id === id);
  if (!o) notFound();
  const project = w.projects.find((p) => p.id === o.projectId);
  const invoice = w.invoices.find((i) => i.changeOrderId === o.id);
  return (
    <>
      <PageHeader
        title={o.number}
        description={project?.name}
        action={<Status value={o.status} />}
      />
      <section className="panel form-container">
        <h2>Requested changes</h2>
        <p className="scope-text">{o.description}</p>
        <dl className="detail-grid">
          <div>
            <dt>Timeline impact</dt>
            <dd>+{o.timelineDays} working days</dd>
          </div>
          <div>
            <dt>Original contract</dt>
            <dd>
              {project && (
                <Money
                  minor={project.originalValueMinor}
                  currency={project.currency}
                />
              )}
            </dd>
          </div>
          <div>
            <dt>Additional charge</dt>
            <dd>
              <Money minor={o.amountMinor} currency={o.currency} />
            </dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{w.clients.find((c) => c.id === project?.clientId)?.name}</dd>
          </div>
        </dl>
        <div className="spaced">
          <OrderActions order={o} />
        </div>
        {o.tokenExpiresAt && (
          <p className="small spaced">
            Approval link expires{" "}
            {new Date(o.tokenExpiresAt).toLocaleString("en-GB", {
              timeZone: "Asia/Jakarta",
            })}{" "}
            (Jakarta). {o.tokenRevokedAt ? "Link revoked." : ""}
          </p>
        )}
        {invoice && (
          <section className="scope-section">
            <h3>Invoice {invoice.number}</h3>
            <Status value={invoice.status} />
            <p className="spaced">
              Paid:{" "}
              <Money minor={invoice.paidMinor} currency={invoice.currency} />
            </p>
            {invoice.payerViewUrl && (
              <a
                className="button secondary"
                href={
                  invoice.payerViewUrl.startsWith("/demo/")
                    ? `/app/payments/${invoice.id}`
                    : invoice.payerViewUrl
                }
              >
                View invoice
              </a>
            )}
          </section>
        )}
      </section>
      <p className="spaced">
        <Link href={`/app/projects/${o.projectId}`}>Return to project</Link>
      </p>
    </>
  );
}
