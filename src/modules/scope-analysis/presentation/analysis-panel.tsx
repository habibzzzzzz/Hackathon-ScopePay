"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Analysis, Project } from "@/modules/workspace/domain/entities";
import { Field, Money, Status } from "@/shared/presentation/components";
import { decimal, toMinor } from "@/shared/domain/money";
import { post } from "@/shared/presentation/api-client";

export function AnalysisPanel({
  project,
  latest,
  demo,
}: {
  project: Project;
  latest?: Analysis;
  demo: boolean;
}) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(latest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [price, setPrice] = useState(
    latest ? decimal(latest.pricing.recommendedMinor) : "",
  );
  const [requestText, setRequestText] = useState("");
  async function analyze() {
    setBusy(true);
    setError("");
    try {
      const result = await post<Analysis>("/api/v1/workspace", {
        action: "analyze",
        input: { projectId: project.id, requestText },
      });
      setAnalysis(result);
      setPrice(decimal(result.pricing.recommendedMinor));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function createOrder(form: FormData) {
    if (!analysis) return;
    setBusy(true);
    setError("");
    try {
      const result = await post<{ id: string }>("/api/v1/workspace", {
        action: "order",
        input: {
          projectId: project.id,
          analysisId: analysis.id,
          description: String(form.get("description")),
          amountMinor: toMinor(price),
          timelineDays: Number(form.get("timelineDays")),
        },
      });
      router.push(`/app/change-orders/${result.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  const billable =
    analysis &&
    ["OUT_OF_SCOPE", "PARTIALLY_OUT_OF_SCOPE"].includes(
      analysis.result.classification,
    );
  return (
    <section className="panel glass" id="analysis">
      <h2>Analyze a client request</h2>
      <p>Compare the latest request with the agreed baseline.</p>
      {demo && (
        <p className="small">
          Demo fixture recognizes Google login and PDF export. Other requests
          return uncertain.
        </p>
      )}
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void analyze();
        }}
      >
        <Field label="Client request">
          <textarea
            rows={4}
            required
            minLength={10}
            maxLength={10000}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="Paste the client's actual request."
          />
        </Field>
        <div className="button-row">
          <button className="button primary" disabled={busy}>
            {busy
              ? "Comparing scope and estimating effort..."
              : "Analyze scope"}
          </button>
          {demo && (
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setRequestText("Can we add Google login and PDF sales reports?")
              }
            >
              Use sample request
            </button>
          )}
        </div>
        {busy && (
          <p role="status" className="small">
            Processing the request. External analysis may take up to 20 seconds.
          </p>
        )}
      </form>
      {error && (
        <p className="error spaced" role="alert">
          {error}
        </p>
      )}
      {analysis && (
        <div className="assessment" aria-live="polite">
          <h3>Scope assessment</h3>
          {analysis.baseline && (
            <details className="spaced">
              <summary>Baseline used for this assessment</summary>
              <div className="scope-text spaced">
                {analysis.baseline.includedScope}
              </div>
              <p className="small spaced">
                Revision policy: {analysis.baseline.revisionPolicy}
              </p>
            </details>
          )}
          <Status value={analysis.result.classification} />
          <p className="spaced">{analysis.result.summary}</p>
          {analysis.result.matchedScopeItems.length > 0 && (
            <>
              <h3>Matched scope</h3>
              <ul>
                {analysis.result.matchedScopeItems.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          {analysis.result.newScopeItems.length > 0 && (
            <>
              <h3>Additional work</h3>
              <ul>
                {analysis.result.newScopeItems.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          <p>
            Incremental effort: {analysis.result.hoursMin}–
            {analysis.result.hoursMax} hours ·{" "}
            {analysis.result.complexity.toLowerCase()} complexity
          </p>
          {billable ? (
            <>
              <div className="price-recommendation">
                <p>Recommended additional charge</p>
                <strong>
                  <Money
                    minor={analysis.pricing.recommendedMinor}
                    currency={project.currency}
                  />
                </strong>
                <p>
                  Range:{" "}
                  <Money
                    minor={analysis.pricing.minMinor}
                    currency={project.currency}
                  />{" "}
                  to{" "}
                  <Money
                    minor={analysis.pricing.maxMinor}
                    currency={project.currency}
                  />
                </p>
              </div>
              <p className="formula">
                {(analysis.pricing.hoursMin + analysis.pricing.hoursMax) / 2}{" "}
                hours ×{" "}
                <Money
                  minor={analysis.pricing.hourlyRateMinor}
                  currency={project.currency}
                />{" "}
                × {(100 + analysis.pricing.riskPercent) / 100} risk ×{" "}
                {analysis.pricing.urgencyPercent / 100} urgency
                <br />
                Minimum change charge:{" "}
                <Money
                  minor={analysis.pricing.minimumChargeMinor}
                  currency={project.currency}
                />
                . Rounded to the nearest cent.
              </p>
              <form
                key={analysis.id}
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void createOrder(new FormData(e.currentTarget));
                }}
              >
                <Field
                  label={`Final charge (${project.currency})`}
                  hint="You choose the final amount before sending it."
                >
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </Field>
                <Field label="Change-order description">
                  <textarea
                    name="description"
                    rows={4}
                    required
                    minLength={10}
                    maxLength={4000}
                    defaultValue={
                      analysis.result.newScopeItems.join("\n") ||
                      analysis.requestText
                    }
                  />
                </Field>
                <Field label="Timeline impact (working days)">
                  <input
                    name="timelineDays"
                    type="number"
                    min="0"
                    max="365"
                    defaultValue={0}
                    required
                  />
                </Field>
                <button className="button primary" disabled={busy}>
                  Create change-order draft
                </button>
              </form>
            </>
          ) : (
            <p>
              {analysis.result.classification === "UNCERTAIN"
                ? "Clarify the client's request and update the baseline before proposing a charge."
                : "This assessment does not recommend additional billing."}
            </p>
          )}
          <p className="small spaced">
            Source: {analysis.provider}. Recommendation requires human review.
          </p>
          <button
            className="button secondary"
            onClick={() => setAnalysis(undefined)}
          >
            Dismiss result
          </button>
        </div>
      )}
      {!analysis && !busy && (
        <p className="small spaced">
          Your assessment will appear here.{" "}
          <Link href="/app/settings">Review pricing settings</Link> before
          analyzing.
        </p>
      )}
    </section>
  );
}
