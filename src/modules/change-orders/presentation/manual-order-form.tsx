"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/shared/presentation/api-client";
import { Field } from "@/shared/presentation/components";
import { toMinor } from "@/shared/domain/money";
import type { Project } from "@/modules/workspace/domain/entities";
export function ManualOrderForm({
  projects,
  projectId,
}: {
  projects: Project[];
  projectId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(projectId ?? projects[0]?.id ?? "");
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          const result = await post<{ id: string }>("/api/v1/workspace", {
            action: "order",
            input: {
              projectId: selected,
              analysisId: null,
              description: String(f.get("description")),
              amountMinor: toMinor(String(f.get("amount"))),
              timelineDays: Number(f.get("timelineDays")),
            },
          });
          router.push(`/app/change-orders/${result.id}`);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Please retry.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Project">
        <select
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Requested changes">
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
        />
      </Field>
      <Field
        label={`Additional charge (${projects.find((p) => p.id === selected)?.currency ?? "USD"})`}
      >
        <input name="amount" type="number" min="0.01" step="0.01" required />
      </Field>
      <Field label="Timeline impact (working days)">
        <input
          name="timelineDays"
          type="number"
          defaultValue={0}
          min="0"
          max="365"
          required
        />
      </Field>
      <p className="small">
        This creates a draft for your review. The client must approve before
        invoicing.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Saving draft..." : "Create draft"}
      </button>
    </form>
  );
}
