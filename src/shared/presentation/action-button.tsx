"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { post } from "./api-client";
import { Pending } from "./pending";
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
  const [submitting, setBusy] = useState(false);
  const [navigating, startTransition] = useTransition();
  const busy = submitting || navigating;
  const [error, setError] = useState("");
  return (
    <span className="action">
      <button
        className={className}
        disabled={busy}
        aria-busy={busy}
        aria-label={
          busy
            ? navigating
              ? "Updating workspace..."
              : "Please wait..."
            : undefined
        }
        onClick={async () => {
          if (busy) return;
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setError("");
          try {
            await post(endpoint, body);
            startTransition(() => {
              if (redirectTo) router.push(redirectTo);
              else router.refresh();
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Please retry.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <Pending
            label={navigating ? "Updating workspace..." : "Please wait..."}
          />
        ) : (
          children
        )}
      </button>
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
