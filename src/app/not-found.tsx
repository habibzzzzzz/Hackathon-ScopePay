import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="auth-shell">
      <div className="panel">
        <h1>Page unavailable</h1>
        <p>This page does not exist or you do not have access.</p>
        <Link className="button primary" href="/app/dashboard">
          Open your workspace
        </Link>
      </div>
    </main>
  );
}
