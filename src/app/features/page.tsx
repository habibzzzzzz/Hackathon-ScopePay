import Link from "next/link";
import { Brand } from "@/shared/presentation/components";
export default function Features() {
  return (
    <main id="main-content" className="marketing">
      <article className="prose">
        <Brand />
        <h1>From a new request to an agreed invoice</h1>
        <p>
          ScopePay keeps commercial decisions in the context of your project.
        </p>
        <ol className="terms-list">
          <li>
            Save the agreed scope, deliverables, exclusions and revision policy.
          </li>
          <li>
            Paste a client request. Review the scope assessment and incremental
            effort estimate.
          </li>
          <li>
            Check the pricing formula: effort × your hourly rate × risk buffer ×
            urgency.
          </li>
          <li>
            Set the final charge and create a draft. Share the approval link
            when ready.
          </li>
          <li>
            The client explicitly approves or rejects. Approved work can become
            a PayPal invoice.
          </li>
          <li>
            A verified PayPal event updates the payment status. The dashboard
            separates contracted value, collected payments and protected
            additional revenue.
          </li>
        </ol>
        <p>
          The local demo uses fixtures and a payment simulator. Live
          integrations require configuration.
        </p>
        <Link className="button primary" href="/login">
          Analyze a project
        </Link>
      </article>
    </main>
  );
}
