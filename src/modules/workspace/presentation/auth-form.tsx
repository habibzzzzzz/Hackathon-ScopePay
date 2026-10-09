"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/shared/presentation/api-client";
import { Field } from "@/shared/presentation/components";
import { Pending } from "@/shared/presentation/pending";
export function AuthForm({
  register = false,
  demo,
}: {
  register?: boolean;
  demo: boolean;
}) {
  const router = useRouter();
  const [submitting, setBusy] = useState(false);
  const [navigating, startTransition] = useTransition();
  const busy = submitting || navigating;
  const [pendingLabel, setPendingLabel] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(body: {
    action: string;
    email?: string;
    password?: string;
  }) {
    if (busy) return;
    setBusy(true);
    setPendingLabel(
      body.action === "register"
        ? "Creating account..."
        : body.action === "resend"
          ? "Sending confirmation email..."
          : body.action === "demo"
            ? "Opening workspace..."
            : "Signing in...",
    );
    setError("");
    setMessage("");
    try {
      const result = await post<{ redirect: string | null; message?: string }>(
        "/api/auth",
        body,
      );
      if (result.redirect) {
        setPendingLabel("Opening your workspace...");
        startTransition(() => {
          router.replace(result.redirect!);
          router.refresh();
        });
      } else {
        setMessage(result.message ?? "Check your email.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  if (demo)
    return (
      <div>
        <p>
          Open an isolated workspace to try the PRD example. Analysis uses a
          demo fixture and payments are simulated.
        </p>
        <button
          className="button primary full"
          disabled={busy}
          aria-busy={busy}
          aria-label={busy ? pendingLabel : undefined}
          onClick={() => submit({ action: "demo" })}
        >
          {busy ? <Pending label={pendingLabel} /> : "Open demo workspace"}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  return (
    <form
      className="form-stack"
      aria-busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void submit({
          action: register ? "register" : "login",
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        });
      }}
    >
      <Field label="Email">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          disabled={busy}
        />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={8}
          maxLength={128}
          required
          disabled={busy}
        />
      </Field>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <button
        className="button primary"
        disabled={busy}
        aria-busy={busy}
        aria-label={busy ? pendingLabel : undefined}
      >
        {busy ? (
          <Pending label={pendingLabel} />
        ) : register ? (
          "Create account"
        ) : (
          "Sign in"
        )}
      </button>
      {register && (
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={(event) => {
            const form = event.currentTarget.form!;
            const email = form.elements.namedItem("email") as HTMLInputElement;
            if (!email.reportValidity()) return;
            void submit({ action: "resend", email: email.value.trim() });
          }}
        >
          Resend confirmation email
        </button>
      )}
    </form>
  );
}
