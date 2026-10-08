"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./api-client";
export function ActionButton({
  children,
  endpoint = "/api/v1/workspace",
  body,
  redirectTo,
  className = "button secondary",
  confirm,
}: {
  children: React.ReactNode;
  endpoint?: string;
  body?: unknown;
  redirectTo?: string;
  className?: string;
  confirm?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="action">
      <button
        className={className}
        disabled={busy}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setError("");
          try {
            await post(endpoint, body);
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Please retry.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Please wait..." : children}
      </button>
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
