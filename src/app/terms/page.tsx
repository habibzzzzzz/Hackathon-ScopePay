import { Brand } from "@/shared/presentation/components";
export default function Terms() {
  return (
    <main id="main-content" className="marketing">
      <article className="prose">
        <Brand />
        <h1>MVP terms of use</h1>
        <p>
          This is a hackathon prototype. Confirm all scope assessments, effort
          estimates and proposed charges before relying on them in a client
          agreement.
        </p>
        <h2>Decisions and payments</h2>
        <p>
          The freelancer chooses the final charge. Clients explicitly approve a
          change order and complete payment on PayPal. ScopePay does not hold
          funds. Demo mode uses simulated payments only.
        </p>
        <h2>Your content</h2>
        <p>
          Upload or enter only content you are authorized to share. Live
          analysis sends the project baseline and request text to the configured
          AI provider.
        </p>
        <h2>Prototype limits</h2>
        <p>
          Availability and accuracy are not guaranteed. Use separate records for
          your contracts and financial reporting. This notice must be reviewed
          and adapted by the operator before a public production launch.
        </p>
      </article>
    </main>
  );
}
