"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/shared/presentation/api-client";
import { ActionButton } from "@/shared/presentation/action-button";
import type { ChangeOrder } from "@/modules/workspace/domain/entities";

export function OrderActions({ order }: { order: ChangeOrder }) {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="button-row">
        {order.status === "DRAFT" && (
          <button
            className="button primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const result = await post<{ token: string }>(
                  "/api/v1/workspace",
                  { action: "send", id: order.id },
                );
                setLink(`${window.location.origin}/c/${result.token}`);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Please retry.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Creating link..." : "Create client approval link"}
          </button>
        )}
        {order.status === "APPROVED" && (
          <ActionButton
            className="button primary"
            body={{ action: "invoice", id: order.id }}
          >
            Create or retry invoice
          </ActionButton>
        )}
        {["DRAFT", "SENT", "VIEWED"].includes(order.status) && (
          <ActionButton
            className="button danger"
            body={{ action: "cancel", id: order.id }}
            confirm="Cancel this change order? Its approval link will stop working."
          >
            Cancel order
          </ActionButton>
        )}
        {order.tokenHash && !order.tokenRevokedAt && (
          <ActionButton
            body={{ action: "revoke", id: order.id }}
            confirm="Revoke the client link? It cannot be reopened afterward."
          >
            Revoke approval link
          </ActionButton>
        )}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {link && !order.tokenRevokedAt && order.status !== "CANCELLED" && (
        <div className="share-link">
          <label className="field">
            <span>Client approval link</span>
            <input readOnly value={link} onFocus={(e) => e.target.select()} />
          </label>
          <div className="button-row">
            <button
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  setError("Copy the link from the field above.");
                }
              }}
            >
              {copied ? "Link copied" : "Copy link"}
            </button>
            <a
              className="button secondary"
              href={link}
              target="_blank"
              rel="noreferrer"
            >
              Preview client page
            </a>
          </div>
          <p className="small">
            Share this link with your client. It expires after seven days. Copy
            it now; the raw token is not stored.
          </p>
        </div>
      )}
      {order.status === "SENT" && !link && (
        <p className="small spaced">
          The link was shown when sent. If it was lost, cancel this order and
          create a new draft.
        </p>
      )}
    </div>
  );
}
