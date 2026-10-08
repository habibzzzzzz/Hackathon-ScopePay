import Link from "next/link";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { Empty, Money, PageHeader } from "@/shared/presentation/components";
import { CURRENCIES } from "@/shared/domain/money";
export default async function Clients() {
  const { workspace: w } = await workspaceData();
  return (
    <>
      <PageHeader
        title="Clients"
        description="The client context behind your projects and invoices."
        action={
          <Link className="button primary" href="/app/clients/new">
            Add client
          </Link>
        }
      />
      {!w.clients.length ? (
        <Empty
          title="No clients yet"
          description="Add a client before creating their project."
          href="/app/clients/new"
          label="Add client"
        />
      ) : (
        <div className="project-grid">
          {w.clients.map((c) => {
            const projects = w.projects.filter((p) => p.clientId === c.id);
            const invoices = w.invoices.filter((i) =>
              projects.some((p) => p.id === i.projectId),
            );
            return (
              <section className="panel" key={c.id}>
                <h2>{c.name}</h2>
                <p>
                  {c.company}
                  <br />
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </p>
                <p className="small">
                  {projects.filter((p) => p.status === "ACTIVE").length} active
                  projects
                </p>
                {CURRENCIES.filter((cur) =>
                  projects.some((p) => p.currency === cur),
                ).map((cur) => (
                  <dl className="detail-grid" key={cur}>
                    <div>
                      <dt>Contracted ({cur})</dt>
                      <dd>
                        <Money
                          minor={projects
                            .filter((p) => p.currency === cur)
                            .reduce((s, p) => s + p.originalValueMinor, 0)}
                          currency={cur}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>Collected ({cur})</dt>
                      <dd>
                        <Money
                          minor={invoices
                            .filter(
                              (i) =>
                                i.currency === cur && i.status !== "REFUNDED",
                            )
                            .reduce((s, i) => s + i.paidMinor, 0)}
                          currency={cur}
                        />
                      </dd>
                    </div>
                  </dl>
                ))}
                {projects.map((p) => (
                  <div className="list-row" key={p.id}>
                    <Link href={`/app/projects/${p.id}`}>{p.name}</Link>
                  </div>
                ))}
                {c.notes && (
                  <p className="scope-text small spaced">{c.notes}</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
