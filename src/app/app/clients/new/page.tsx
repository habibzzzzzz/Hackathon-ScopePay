import { PageHeader } from "@/shared/presentation/components";
import { ClientForm } from "@/modules/workspace/presentation/workspace-forms";
export default function NewClient() {
  return (
    <>
      <PageHeader
        title="Add client"
        description="Save the contact who will receive your change-order invoices."
      />
      <div className="panel form-container">
        <ClientForm />
      </div>
    </>
  );
}
