import { notFound } from "next/navigation";
import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { PageHeader } from "@/shared/presentation/components";
import { ProjectForm } from "@/modules/workspace/presentation/workspace-forms";
export default async function EditProject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace: w } = await workspaceData();
  const p = w.projects.find((p) => p.id === id);
  if (!p) notFound();
  return (
    <>
      <PageHeader
        title="Edit project baseline"
        description="Existing assessments and change orders retain their original snapshots."
      />
      <div className="panel form-container">
        <ProjectForm clients={w.clients} project={p} />
      </div>
    </>
  );
}
