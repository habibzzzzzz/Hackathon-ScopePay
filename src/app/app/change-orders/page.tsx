import Link from "next/link";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import {
  Empty,
  Money,
  PageHeader,
  Status,
} from "@/shared/presentation/components";
export default async function ChangeOrders() {
  const { workspace: w } = await workspaceData();
  return (
    <>
      <PageHeader
        title="Change orders"
        description="Review additional work before sharing it with your client."
        action={
          <Link className="button primary" href="/app/change-orders/new">
            Create draft
          </Link>
        }
      />
      {!w.orders.length ? (
        <Empty
          title="No change orders yet"
          description="Analyze a client request within a project or create a manual draft."
          href="/app/projects"
          label="Review projects"
        />
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {w.orders.map((o) => (
                <tr key={o.id}>
                  <td data-label="Order">{o.number}</td>
                  <td data-label="Project">
                    {w.projects.find((p) => p.id === o.projectId)?.name}
                  </td>
                  <td data-label="Amount">
                    <Money minor={o.amountMinor} currency={o.currency} />
                  </td>
                  <td data-label="Status">
                    <Status value={o.status} />
                  </td>
                  <td data-label="Action">
                    <Link
                      className="text-link"
                      href={`/app/change-orders/${o.id}`}
                    >
                      Review order
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
