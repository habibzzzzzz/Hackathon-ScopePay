import Link from "next/link";
import { env } from "@/shared/config/env";
import { Brand } from "@/shared/presentation/components";
import { AuthForm } from "@/modules/workspace/presentation/auth-form";
export default function Register() {
  return (
    <main id="main-content" className="auth-shell">
      <Brand />
      <section className="panel auth-panel">
        <h1>Your work has value.</h1>
        <p>Create your commercial workspace.</p>
        <AuthForm register demo={env().APP_MODE === "demo"} />
        <p>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
        <p className="small">
          By creating an account, you accept the{" "}
          <Link href="/terms">Terms</Link> and acknowledge the{" "}
          <Link href="/privacy">Privacy notice</Link>.
        </p>
      </section>
    </main>
  );
}
