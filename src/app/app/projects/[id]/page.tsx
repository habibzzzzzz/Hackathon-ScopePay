import Link from "next/link";
import { notFound } from "next/navigation";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { Money, PageHeader, Status } from "@/shared/presentation/components";
import { AnalysisPanel } from "@/modules/scope-analysis/presentation/analysis-panel";
import { ProjectReviewPanel } from "@/modules/scope-analysis/presentation/project-review-panel";
export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, workspace: w } = await workspaceData();
  const p = w.projects.find((p) => p.id === id);
  if (!p) notFound();
  const analyses = w.analyses.filter((a) => a.projectId === id);
  const orders = w.orders.filter((o) => o.projectId === id);
  return (
    <>
      <PageHeader
        title={p.name}
        description={w.clients.find((c) => c.id === p.clientId)?.name}
        action={
          <Link className="button secondary" href={`/app/projects/${id}/edit`}>
            Edit baseline
          </Link>
        }
      />
      <div className="project-strip">
        <div>
          <small>Original contract</small>
          <p>
            <Money minor={p.originalValueMinor} currency={p.currency} />
          </p>
        </div>
        <div>
          <small>Start date</small>
          <p>{p.startDate}</p>
        </div>
        <div>
          <small>Target completion</small>
          <p>{p.dueDate}</p>
        </div>
        <div>
          <small>Status</small>
          <p>
            <Status value={p.status} />
          </p>
        </div>
      </div>
      <div className="split">
        <section className="panel">
          <h2>Agreed scope</h2>
          <ProjectReviewPanel
            projectId={id}
            latest={w.reviews.find((r) => r.projectId === id)}
          />
          {[
            ["Included scope", p.includedScope],
            ["Excluded scope", p.excludedScope || "No exclusions recorded."],
            ["Deliverables", p.deliverables],
            ["Revision policy", p.revisionPolicy],
            ...(p.contractText ? [["Contract text", p.contractText]] : []),
          ].map(([label, text]) => (
            <section key={label} className="scope-section">
              <h3>{label}</h3>
              <div className="scope-text">{text}</div>
            </section>
          ))}
        </section>
        <AnalysisPanel project={p} latest={analyses[0]} demo={user.demo} />
      </div>
      <section className="panel spaced">
        <div className="section-title">
          <h2>Change orders</h2>
          <Link href={`/app/change-orders/new?projectId=${id}`}>
            Create manually
          </Link>
        </div>
        {orders.length ? (
          orders.map((o) => (
            <div className="list-row" key={o.id}>
              <div>
                <Link href={`/app/change-orders/${o.id}`}>
                  <strong>{o.number}</strong>
                </Link>
                <p className="scope-text">{o.description}</p>
              </div>
              <div className="row-meta">
                <Money minor={o.amountMinor} currency={o.currency} />
                <p>
                  <Status value={o.status} />
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>
            No changes proposed yet. Analyze a request or create a draft for
            agreed additional work.
          </p>
        )}
      </section>
      {analyses.length > 0 && (
        <section className="panel analysis-history">
          <h2>Analysis history</h2>
          {analyses.map((a) => (
            <div key={a.id} className="list-row">
              <div className="wrap">
                <p className="scope-text">{a.requestText}</p>
                <small>
                  {new Date(a.createdAt).toLocaleString("en-GB", {
                    timeZone: "Asia/Jakarta",
                  })}{" "}
                  · {a.provider}
                </small>
              </div>
              <Status value={a.result.classification} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}
