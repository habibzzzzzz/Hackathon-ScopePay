import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { Empty, PageHeader } from "@/shared/presentation/components";
import { ManualOrderForm } from "@/modules/change-orders/presentation/manual-order-form";
export default async function NewOrder({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const { workspace: w } = await workspaceData();
  return (
    <>
      <PageHeader
        title="Create a change-order draft"
        description="Propose a clear charge for additional work."
      />
      {!w.projects.length ? (
        <Empty
          title="Create a project first"
          description="Changes belong to an agreed project baseline."
          href="/app/projects/new"
          label="Create project"
        />
      ) : (
        <div className="panel form-container">
          <ManualOrderForm
            projects={w.projects}
            projectId={
              w.projects.some((p) => p.id === projectId) ? projectId : undefined
            }
          />
        </div>
      )}
    </>
  );
}
