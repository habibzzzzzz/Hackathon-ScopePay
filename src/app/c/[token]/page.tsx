import { runtime } from "@/shared/infrastructure/runtime";
import { env } from "@/shared/config/env";
import { ApplicationError } from "@/shared/errors/application-error";
import { Brand, Money, Status } from "@/shared/presentation/components";
import { ClientDecision } from "@/modules/change-orders/presentation/client-decision";
export const dynamic = "force-dynamic";
export default async function ClientApproval({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { service } = await runtime(true);
  let details;
  try {
    details = await service.publicOrder(token);
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    return (
      <main id="main-content" className="approval-shell">
        <Brand />
        <section className="panel">
          <h1>Approval link unavailable</h1>
          <p>{error.message}</p>
          <p>Contact the freelancer for a new proposal.</p>
        </section>
      </main>
    );
  }
  const { order: o, project: p, seller, invoice } = details;
  const demo = env().APP_MODE === "demo";
  return (
    <main id="main-content" className="approval-shell">
      <Brand />
      {demo && (
        <div className="demo-banner">
          Demo approval. All payments are simulated.
        </div>
      )}
      <section className="panel glass spaced">
        <p className="small">{seller.businessName || seller.fullName}</p>
        <h1 className="approval-title">{p.name}</h1>
        <p>Proposed additional work · {o.number}</p>
        <Status value={o.status} />
        <section className="approval-summary">
          <h2>Requested changes</h2>
          <p className="scope-text">{o.description}</p>
          <p>Timeline impact: +{o.timelineDays} working days</p>
        </section>
        <p>Additional charge</p>
        <div className="approval-price">
          <Money minor={o.amountMinor} currency={o.currency} />
        </div>
        {invoice?.status === "REFUNDED" || invoice?.status === "CANCELLED" ? (
          <p>
            Invoice {invoice.status.toLowerCase()}. Contact the freelancer
            before making another payment.
          </p>
        ) : (
          <ClientDecision
            token={token}
            status={o.status}
            demo={demo}
            payerViewUrl={invoice?.payerViewUrl}
          />
        )}
        <p className="approval-note">
          Link expires{" "}
          {new Date(o.tokenExpiresAt!).toLocaleDateString("en-GB", {
            timeZone: "Asia/Jakarta",
          })}
          . Keep this link private.
        </p>
      </section>
    </main>
  );
}
