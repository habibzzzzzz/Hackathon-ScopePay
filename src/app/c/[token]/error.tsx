"use client";
export default function ApprovalError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="approval-shell">
      <section className="panel">
        <h1>Proposal temporarily unavailable</h1>
        <p>Your decision has not been changed. Please retry.</p>
        <button className="button primary" onClick={reset}>
          Reload proposal
        </button>
      </section>
    </main>
  );
}
