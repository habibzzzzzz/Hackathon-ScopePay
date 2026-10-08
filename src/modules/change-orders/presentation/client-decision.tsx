"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/shared/presentation/api-client";
export function ClientDecision({
  token,
  status,
  demo,
  payerViewUrl,
}: {
  token: string;
  status: string;
  demo: boolean;
  payerViewUrl?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(decision: "approve" | "reject") {
    if (
      decision === "reject" &&
      !window.confirm("Reject this proposed change?")
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await post<{ payerViewUrl: string | null }>(
        `/api/public/${token}`,
        { decision },
      );
      if (decision === "approve" && result.payerViewUrl) {
        if (demo) router.refresh();
        else window.location.assign(result.payerViewUrl);
      } else router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  async function simulate() {
    setBusy(true);
    setError("");
    try {
      await post(`/api/demo/pay/${token}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {["SENT", "VIEWED", "APPROVED"].includes(status) && (
        <>
          <button
            className="button primary full"
            disabled={busy}
            onClick={() => decide("approve")}
          >
            {busy
              ? "Preparing invoice..."
              : status === "APPROVED"
                ? "Retry invoice creation"
                : demo
                  ? "Approve & create demo invoice"
                  : "Accept & pay with PayPal"}
          </button>
          {["SENT", "VIEWED"].includes(status) && (
            <button
              className="button secondary full spaced"
              disabled={busy}
              onClick={() => decide("reject")}
            >
              Reject proposed changes
            </button>
          )}
          <p className="approval-note">
            Approval confirms this change order.{" "}
            {demo
              ? "Payments are simulated in this demo."
              : "You will complete payment on PayPal. Clicking approve does not charge you automatically."}
          </p>
        </>
      )}
      {status === "INVOICED" &&
        (demo ? (
          <>
            <p>
              Your demo invoice is ready. The action below records a simulated
              payment.
            </p>
            <button
              className="button primary full"
              disabled={busy}
              onClick={simulate}
            >
              {busy
                ? "Recording simulation..."
                : "Simulate payment (no money moves)"}
            </button>
          </>
        ) : payerViewUrl ? (
          <a className="button primary full" href={payerViewUrl}>
            Pay invoice on PayPal
          </a>
        ) : (
          <p>The invoice is being prepared. Please reload shortly.</p>
        ))}
      {status === "PAID" && (
        <p className="success-text" role="status">
          {demo ? "Simulated payment recorded." : "Payment received."} Thank
          you.
        </p>
      )}
      {status === "REJECTED" && (
        <p>
          You rejected this change order. Contact the freelancer to discuss a
          revised proposal.
        </p>
      )}
      {status === "CANCELLED" && <p>This change order was cancelled.</p>}
      {error && (
        <p className="error spaced" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
