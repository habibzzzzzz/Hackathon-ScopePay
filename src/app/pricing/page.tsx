import Link from "next/link";
import { Brand } from "@/shared/presentation/components";
export default function Pricing() {
  return (
    <main id="main-content" className="marketing">
      <article className="prose">
        <Brand />
        <h1>Hackathon access</h1>
        <p>
          ScopePay is an MVP. Subscription plans have not been launched; this
          application does not collect a subscription fee.
        </p>
        <h2>Your project pricing stays yours</h2>
        <p>
          Configure your hourly rate, minimum change charge, risk buffer and
          urgency multiplier. Review the recommendation and choose the final
          amount for every change order.
        </p>
        <p>
          AI provider, hosting and PayPal charges depend on your configured
          services. ScopePay does not calculate or promise those fees.
        </p>
        <Link className="button primary" href="/login">
          Open workspace
        </Link>
      </article>
    </main>
  );
}
