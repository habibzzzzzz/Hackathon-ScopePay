"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>Workspace unavailable</h1>
      <p>Your data could not be loaded. Please retry.</p>
      <button className="button primary" onClick={reset}>
        Reload workspace
      </button>
    </div>
  );
}
