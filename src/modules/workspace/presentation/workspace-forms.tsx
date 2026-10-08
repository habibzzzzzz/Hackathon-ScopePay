"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/shared/presentation/api-client";
import { Field } from "@/shared/presentation/components";
import { CURRENCIES, decimal, toMinor } from "@/shared/domain/money";
import type { Client, Profile, Project } from "../domain/entities";

function useSave() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function save(
    body: unknown,
    destination?: (result: { id: string }) => string,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await post<{ id: string }>("/api/v1/workspace", body);
      if (destination) router.push(destination(result));
      else setMessage("Saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  function report(e: unknown) {
    setError(e instanceof Error ? e.message : "Check your input.");
  }
  return { busy, error, message, save, report };
}
function Feedback({ error, message }: { error: string; message: string }) {
  return (
    <>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success-text">
          {message}
        </p>
      )}
    </>
  );
}
const value = (form: FormData, name: string) =>
  String(form.get(name) ?? "").trim();
export function ProfileForm({ profile }: { profile: Profile | null }) {
  const state = useSave();
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          void state.save({
            action: "profile",
            input: {
              fullName: value(f, "fullName"),
              profession: value(f, "profession"),
              country: value(f, "country"),
              businessName: value(f, "businessName"),
              currency: value(f, "currency"),
              hourlyRateMinor: toMinor(value(f, "hourlyRate")),
              minimumChargeMinor: toMinor(value(f, "minimumCharge")),
              riskPercent: Number(value(f, "riskPercent")),
              urgencyPercent: Number(value(f, "urgencyPercent")),
            },
          });
        } catch (error) {
          state.report(error);
        }
      }}
    >
      <h2>Freelancer profile</h2>
      <div className="form-grid">
        <Field label="Full name">
          <input
            name="fullName"
            defaultValue={profile?.fullName}
            required
            maxLength={160}
          />
        </Field>
        <Field label="Business name (optional)">
          <input
            name="businessName"
            defaultValue={profile?.businessName}
            maxLength={160}
          />
        </Field>
        <Field label="Profession">
          <input
            name="profession"
            defaultValue={profile?.profession}
            required
            maxLength={160}
          />
        </Field>
        <Field label="Country">
          <input
            name="country"
            defaultValue={profile?.country}
            required
            maxLength={160}
          />
        </Field>
      </div>
      <h2>Pricing profile</h2>
      <p>
        These values drive the pricing formula. Review each charge before
        sending it.
      </p>
      <div className="form-grid">
        <Field label="Default currency">
          <select name="currency" defaultValue={profile?.currency ?? "USD"}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Hourly rate">
          <input
            name="hourlyRate"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={decimal(profile?.hourlyRateMinor ?? 2000)}
            required
          />
        </Field>
        <Field label="Minimum change charge">
          <input
            name="minimumCharge"
            type="number"
            step="0.01"
            min="0"
            defaultValue={decimal(profile?.minimumChargeMinor ?? 5000)}
            required
          />
        </Field>
        <Field label="Risk buffer (%)">
          <input
            name="riskPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={profile?.riskPercent ?? 10}
            required
          />
        </Field>
        <Field
          label="Urgency multiplier (%)"
          hint="100% means standard urgency."
        >
          <input
            name="urgencyPercent"
            type="number"
            min="100"
            max="300"
            defaultValue={profile?.urgencyPercent ?? 100}
            required
          />
        </Field>
      </div>
      <Feedback {...state} />
      <button className="button primary" disabled={state.busy}>
        {state.busy ? "Saving..." : "Save profile and pricing"}
      </button>
    </form>
  );
}
export function ClientForm() {
  const state = useSave();
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void state.save(
          {
            action: "client",
            input: {
              name: value(f, "name"),
              company: value(f, "company"),
              email: value(f, "email"),
              phone: value(f, "phone"),
              notes: value(f, "notes"),
            },
          },
          () => "/app/clients",
        );
      }}
    >
      <div className="form-grid">
        <Field label="Client name">
          <input name="name" required maxLength={160} />
        </Field>
        <Field label="Company (optional)">
          <input name="company" maxLength={160} />
        </Field>
        <Field
          label="Client email"
          hint="PayPal sends invoices to this address."
        >
          <input name="email" type="email" required maxLength={254} />
        </Field>
        <Field label="Phone (optional)">
          <input name="phone" type="tel" maxLength={50} />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea name="notes" rows={3} maxLength={20000} />
      </Field>
      <Feedback {...state} />
      <button className="button primary" disabled={state.busy}>
        {state.busy ? "Saving..." : "Save client"}
      </button>
    </form>
  );
}
export function ProjectForm({
  clients,
  project,
  currency = "USD",
}: {
  clients: Client[];
  project?: Project;
  currency?: string;
}) {
  const state = useSave();
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          void state.save(
            {
              action: project ? "baseline" : "project",
              ...(project ? { id: project.id } : {}),
              input: {
                name: value(f, "name"),
                clientId: value(f, "clientId"),
                description: value(f, "description"),
                originalValueMinor: toMinor(value(f, "originalValue")),
                currency: value(f, "currency"),
                startDate: value(f, "startDate"),
                dueDate: value(f, "dueDate"),
                status: value(f, "status"),
                includedScope: value(f, "includedScope"),
                excludedScope: value(f, "excludedScope"),
                deliverables: value(f, "deliverables"),
                revisionPolicy: value(f, "revisionPolicy"),
                contractText: value(f, "contractText"),
              },
            },
            (result) => `/app/projects/${result.id}`,
          );
        } catch (error) {
          state.report(error);
        }
      }}
    >
      <h2>Project details</h2>
      <div className="form-grid">
        <Field label="Project name">
          <input
            name="name"
            defaultValue={project?.name}
            required
            maxLength={160}
          />
        </Field>
        <Field label="Client">
          <select
            name="clientId"
            defaultValue={project?.clientId ?? ""}
            required
          >
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Original contract value">
          <input
            name="originalValue"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={
              project ? decimal(project.originalValueMinor) : undefined
            }
            required
          />
        </Field>
        <Field label="Currency">
          <select name="currency" defaultValue={project?.currency ?? currency}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Start date">
          <input
            name="startDate"
            type="date"
            defaultValue={project?.startDate}
            required
          />
        </Field>
        <Field label="Target completion date">
          <input
            name="dueDate"
            type="date"
            defaultValue={project?.dueDate}
            required
          />
        </Field>
        <Field label="Project status">
          <select name="status" defaultValue={project?.status ?? "ACTIVE"}>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </Field>
      </div>
      <Field label="Project description">
        <textarea
          name="description"
          rows={3}
          defaultValue={project?.description}
          maxLength={20000}
        />
      </Field>
      <h2>Agreed baseline</h2>
      <p>
        Use the actual contract. The analyzer compares new requests with this
        baseline.
      </p>
      <Field label="Included scope">
        <textarea
          name="includedScope"
          rows={5}
          defaultValue={project?.includedScope}
          required
          minLength={10}
          maxLength={20000}
          placeholder="List the agreed features and services."
        />
      </Field>
      <Field label="Excluded scope">
        <textarea
          name="excludedScope"
          rows={3}
          defaultValue={project?.excludedScope}
          maxLength={20000}
        />
      </Field>
      <Field label="Deliverables">
        <textarea
          name="deliverables"
          rows={3}
          defaultValue={project?.deliverables}
          required
          minLength={3}
          maxLength={20000}
        />
      </Field>
      <Field label="Revision policy">
        <textarea
          name="revisionPolicy"
          rows={2}
          defaultValue={project?.revisionPolicy}
          required
          minLength={3}
          maxLength={20000}
        />
      </Field>
      <Field label="Contract text (optional)">
        <textarea
          name="contractText"
          rows={5}
          defaultValue={project?.contractText}
          maxLength={20000}
        />
      </Field>
      <Feedback {...state} />
      <button className="button primary" disabled={state.busy}>
        {state.busy
          ? "Saving..."
          : project
            ? "Save baseline"
            : "Create project"}
      </button>
    </form>
  );
}
