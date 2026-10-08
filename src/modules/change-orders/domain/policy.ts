import { ApplicationError } from "@/shared/errors/application-error";

export const ORDER_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "APPROVED",
  "REJECTED",
  "INVOICED",
  "PAID",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["VIEWED", "APPROVED", "REJECTED", "CANCELLED"],
  VIEWED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["INVOICED"],
  INVOICED: ["PAID"],
  PAID: [],
  REJECTED: [],
  CANCELLED: [],
};
export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!transitions[from].includes(to))
    throw new ApplicationError(
      "INVALID_TRANSITION",
      `Cannot change ${from.toLowerCase()} to ${to.toLowerCase()}.`,
      409,
    );
}
export function assertTokenActive(
  expiresAt: string | null,
  revokedAt: string | null,
  now = Date.now(),
) {
  if (
    revokedAt ||
    !expiresAt ||
    !Number.isFinite(Date.parse(expiresAt)) ||
    Date.parse(expiresAt) <= now
  )
    throw new ApplicationError(
      "LINK_UNAVAILABLE",
      "This approval link has expired or been revoked.",
      410,
    );
}
