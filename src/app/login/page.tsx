import Link from "next/link";
import { env } from "@/shared/config/env";
import { Brand } from "@/shared/presentation/components";
import { AuthForm } from "@/modules/workspace/presentation/auth-form";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const query = await searchParams;
  return (
    <main id="main-content" className="auth-shell">
      <Brand />
      <section className="panel auth-panel">
        <h1>Welcome back</h1>
        <p>Review your scope and the work worth billing.</p>
        {query.confirmation === "failed" && (
          <p className="error">
            Confirmation link unavailable. Request a new confirmation through
            registration.
          </p>
        )}
        <AuthForm demo={env().APP_MODE === "demo"} />
        <p>
          New to ScopePay? <Link href="/register">Create an account</Link>
        </p>
        <p className="small">
          <Link href="/terms">Terms</Link> ·{" "}
          <Link href="/privacy">Privacy</Link>
        </p>
      </section>
    </main>
  );
}
