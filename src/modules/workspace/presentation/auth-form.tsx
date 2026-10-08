"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/shared/presentation/api-client";
import { Field } from "@/shared/presentation/components";
export function AuthForm({
  register = false,
  demo,
}: {
  register?: boolean;
  demo: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(body: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await post<{ redirect: string | null; message?: string }>(
        "/api/auth",
        body,
      );
      if (result.redirect) {
        router.push(result.redirect);
        router.refresh();
      } else setMessage(result.message ?? "Check your email.");
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
          onClick={() => submit({ action: "demo" })}
        >
          {busy ? "Opening workspace..." : "Open demo workspace"}
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
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void submit({
          action: register ? "register" : "login",
          email: form.get("email"),
          password: form.get("password"),
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
        />
      </Field>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <button className="button primary" disabled={busy}>
        {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
