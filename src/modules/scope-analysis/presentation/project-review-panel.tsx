"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/shared/presentation/api-client";
import type { ProjectReview } from "@/modules/workspace/domain/entities";
export function ProjectReviewPanel({
  projectId,
  latest,
}: {
  projectId: string;
  latest?: ProjectReview;
}) {
  const router = useRouter();
  const [review, setReview] = useState(latest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="scope-section">
      <h3>Baseline review</h3>
      <p>
        Check the recorded scope for ambiguities before reviewing new requests.
      </p>
      <button
        className="button secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            setReview(
              await post<ProjectReview>("/api/v1/workspace", {
                action: "project-review",
                id: projectId,
              }),
            );
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Please retry.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Reviewing baseline..." : "Review project baseline"}
      </button>
      {busy && (
        <p role="status" className="small">
          Reading the recorded project agreement...
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {review && (
        <div className="spaced" aria-live="polite">
          <p>{review.result.summary}</p>
          {review.result.risks.length > 0 && (
            <>
              <h3>Scope ambiguities</h3>
              <ul className="terms-list">
                {review.result.risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </>
          )}
          <h3>Questions to clarify</h3>
          {review.result.clarificationQuestions.length ? (
            <ul className="terms-list">
              {review.result.clarificationQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          ) : (
            <p>
              No clarification questions returned. Confirm the agreement
              yourself.
            </p>
          )}
          <p className="small">
            {review.provider} · Based on the baseline recorded at{" "}
            {new Date(review.createdAt).toLocaleString("en-GB", {
              timeZone: "Asia/Jakarta",
            })}{" "}
            (Jakarta).
          </p>
        </div>
      )}
    </section>
  );
}
