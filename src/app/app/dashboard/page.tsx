import Link from "next/link";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import {
  Empty,
  Money,
  PageHeader,
  Stat,
  Status,
} from "@/shared/presentation/components";
import { ActionButton } from "@/shared/presentation/action-button";
import { financialSummary } from "@/modules/workspace/domain/entities";
export default async function Dashboard() {
  const { user, workspace: w } = await workspaceData();
  const currency = w.profile?.currency ?? "USD";
  const summary = financialSummary(w, currency);
  const date = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  return (
    <>
      <PageHeader
        title={
          w.profile
            ? `Welcome, ${w.profile.fullName.split(" ")[0]}`
            : "Set up your workspace"
        }
        description={`${date} · Your scope, changes and payments in one place.`}
        action={
          <Link className="button primary" href="/app/projects/new">
            New project
          </Link>
        }
      />
      {!w.profile && (
        <div className="panel">
          <h2>Set your pricing first</h2>
          <p>Add your profile and hourly rate before analyzing a request.</p>
          <Link className="button primary" href="/app/settings">
            Complete profile
          </Link>
        </div>
      )}
      <div className="stats">
        <Stat
          label="Total contracted"
          minor={summary.contracted}
          currency={currency}
          detail="Original project values"
        />
        <Stat
          label="Collected"
          minor={summary.collected}
          currency={currency}
          detail="Recorded invoice payments"
        />
        <Stat
          label="Outstanding"
          minor={summary.outstanding}
          currency={currency}
          detail="Unpaid invoice balance"
        />
        <Stat
          label="Protected revenue"
          minor={summary.protected}
          currency={currency}
          detail="Approved additional work"
        />
      </div>
      <p className="small">
        Showing {currency} only. Original contracts are not automatically
        invoiced; collected and outstanding figures cover change-order invoices.
      </p>
      {!w.projects.length ? (
        <>
          <Empty
            title="No projects yet"
            description="Save the agreed scope for your first client project."
            href="/app/projects/new"
            label="Create project"
          />
          {user.demo && (
            <div className="panel">
              <h2>Try the PRD scenario</h2>
              <p>
                Load the fictional HAVN Coffee baseline, then analyze Google
                login and PDF export.
              </p>
              <ActionButton
                endpoint="/api/demo/seed"
                className="button secondary"
              >
                Load sample project
              </ActionButton>
            </div>
          )}
        </>
      ) : (
        <div className="split dashboard-split">
          <section className="panel">
            <div className="section-title">
              <h2>Active projects</h2>
              <Link href="/app/projects">All projects</Link>
            </div>
            {w.projects.filter((p) => p.status === "ACTIVE").length ? (
              w.projects
                .filter((p) => p.status === "ACTIVE")
                .slice(0, 5)
                .map((p) => (
                  <div key={p.id} className="list-row">
                    <div>
                      <Link href={`/app/projects/${p.id}`}>
                        <strong>{p.name}</strong>
                      </Link>
                      <p>{w.clients.find((c) => c.id === p.clientId)?.name}</p>
                    </div>
                    <div className="row-meta">
                      <Money
                        minor={p.originalValueMinor}
                        currency={p.currency}
                      />
                      <p>
                        <Status value={p.status} />
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <p>
                No active projects. Completed projects remain in your project
                list.
              </p>
            )}
          </section>
          <section className="panel">
            <h2>Recent activity</h2>
            {w.activity.length ? (
              <ol className="timeline">
                {w.activity.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <p>{a.description}</p>
                    <small>
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta",
                      }).format(new Date(a.createdAt))}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Commercial decisions and payments will appear here.</p>
            )}
          </section>
        </div>
      )}
      {w.analyses.length > 0 && (
        <section className="panel spaced">
          <h2>Recent scope decisions</h2>
          {w.analyses.slice(0, 3).map((a) => (
            <div className="list-row" key={a.id}>
              <div className="wrap">
                <Link href={`/app/projects/${a.projectId}`}>
                  <strong>
                    {w.projects.find((p) => p.id === a.projectId)?.name}
                  </strong>
                </Link>
                <p>{a.result.summary}</p>
              </div>
              <Status value={a.result.classification} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}
