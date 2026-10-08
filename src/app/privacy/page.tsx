import { Brand } from "@/shared/presentation/components";
export default function Privacy() {
  return (
    <main id="main-content" className="marketing">
      <article className="prose">
        <Brand />
        <h1>MVP privacy notice</h1>
        <p>
          The application stores profile and pricing settings, client contact
          details, project scope, client requests, analyses, change orders and
          invoice references.
        </p>
        <h2>Where data goes</h2>
        <p>
          Demo mode saves sample data on the local server. Live mode stores
          account and workspace data in Supabase, sends baseline and request
          text to Gemini for analysis, and sends invoice details and client
          email to PayPal.
        </p>
        <h2>Approval links</h2>
        <p>
          Anyone holding an active client link can review and decide on that
          change order. Share links only with the intended recipient. Links
          expire after seven days and can be revoked from the workspace.
        </p>
        <h2>Before production</h2>
        <p>
          This prototype does not include self-service account deletion or an
          operator contact address. The operator must define retention, support
          contact and deletion procedures before a public launch.
        </p>
      </article>
    </main>
  );
}
