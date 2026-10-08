import { workspaceData } from "@/shared/infrastructure/workspace-data";
import { PageHeader } from "@/shared/presentation/components";
import { ProfileForm } from "@/modules/workspace/presentation/workspace-forms";
import { env } from "@/shared/config/env";
export default async function Settings() {
  const { workspace } = await workspaceData();
  return (
    <>
      <PageHeader
        title="Profile & pricing"
        description="Choose the rates used to calculate additional work."
      />
      <div className="panel form-container">
        <ProfileForm profile={workspace.profile} />
      </div>
      <section className="panel form-container spaced">
        <h2>Integrations</h2>
        <p>
          {env().APP_MODE === "demo"
            ? "Demo mode: fixture scope analysis and payment simulation."
            : `Live services: Supabase, ${env().AI_MODEL}, PayPal ${env().PAYPAL_ENV}.`}
        </p>
        <p className="small">
          This MVP supports one configured PayPal seller. Merchant onboarding is
          a later phase. Secrets are configured on the server.
        </p>
      </section>
    </>
  );
}
