import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { Empty, PageHeader } from "@/shared/presentation/components";
import { ProjectForm } from "@/modules/workspace/presentation/workspace-forms";
export default async function NewProject() {
  const { workspace: w } = await workspaceData();
  return (
    <>
      <PageHeader
        title="Create project"
        description="Define what was agreed before reviewing extra work."
      />
      {!w.profile ? (
        <Empty
          title="Set your pricing profile"
          description="Add your profile and rates first."
          href="/app/settings"
          label="Complete profile"
        />
      ) : !w.clients.length ? (
        <Empty
          title="Add the client first"
          description="A project needs a client contact for approval and invoicing."
          href="/app/clients/new"
          label="Add client"
        />
      ) : (
        <div className="panel form-container">
          <ProjectForm clients={w.clients} currency={w.profile.currency} />
        </div>
      )}
    </>
  );
}
