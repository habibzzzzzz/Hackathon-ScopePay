import Link from "next/link";
import { Brand } from "@/shared/presentation/components";
import { env } from "@/shared/config/env";
import { redirect } from "next/navigation";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const callback = new URLSearchParams();
  for (const key of ["code", "token_hash", "type", "error", "error_code"])
    if (typeof query[key] === "string") callback.set(key, query[key]);
  if (
    callback.has("code") ||
    callback.has("token_hash") ||
    callback.has("error")
  )
    redirect(`/auth/callback?${callback}`);
  const demo = env().APP_MODE === "demo";
  return (
    <div className="marketing">
      <header className="marketing-nav">
        <Brand />
        <nav aria-label="Main">
          <Link href="/features">Workflow</Link>
          <Link href="/pricing">Pricing</Link>
          <Link className="button secondary" href="/login">
            {demo ? "Open demo" : "Sign in"}
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">For freelancers and small agencies</p>
            <h1>
              Know your scope.
              <br />
              Know your worth.
              <br />
              <span>Get paid.</span>
            </h1>
            <p className="hero-copy">
              Compare client requests with your agreed scope, review a clear
              pricing recommendation, and turn approved additional work into an
              invoice.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/login">
                Analyze your project
              </Link>
              <Link className="text-link" href="#workflow">
                See the workflow
              </Link>
            </div>
            <p className="small">
              {demo
                ? "Hackathon demo. Sample analysis and payment simulation."
                : "You approve each charge. Clients pay through PayPal."}
            </p>
          </div>
          <div
            className="product-preview"
            aria-label="Illustrative project assessment"
          >
            <div className="preview-header">
              <span>HAVN Coffee Website</span>
              <span className="small">PRD sample</span>
            </div>
            <div className="preview-baseline">
              <p className="small">Agreed scope</p>
              <p>Website, digital menu, reservation form</p>
            </div>
            <div className="assessment-preview">
              <p className="small">New client request</p>
              <blockquote>
                “Can we add Google login and PDF sales reports?”
              </blockquote>
              <span className="status status-out_of_scope">Out of scope</span>
              <p className="small">Illustrative effort: 8–12 hours</p>
              <div className="preview-price">
                <span>
                  Additional charge
                  <br />
                  <small>10h × $20 × 1.10</small>
                </span>
                <strong>$220.00</strong>
              </div>
              <p className="small">
                Freelancer review required before sending.
              </p>
            </div>
          </div>
        </section>
        <section id="workflow" className="workflow-section">
          <div>
            <h2>
              Extra work deserves
              <br />a clear agreement.
            </h2>
            <p>
              Keep the request, reasoning, price, and client decision together.
            </p>
          </div>
          <ol className="workflow-list">
            <li>
              <strong>Define the baseline</strong>
              <p>
                Capture what was agreed, what was excluded, and the revision
                policy.
              </p>
            </li>
            <li>
              <strong>Assess the new request</strong>
              <p>
                Compare it with your scope and review the estimated additional
                effort.
              </p>
            </li>
            <li>
              <strong>Agree on the change</strong>
              <p>
                Adjust the charge and share an expiring approval link with your
                client.
              </p>
            </li>
            <li>
              <strong>Invoice approved work</strong>
              <p>
                Send a PayPal invoice. A verified payment event updates the
                financial status.
              </p>
            </li>
          </ol>
        </section>
      </main>
      <footer className="marketing-footer">
        <span>ScopePay.ai · Hackathon MVP</span>
        <div>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
