import type { Currency } from "@/shared/domain/money";
import type { OrderStatus } from "@/modules/change-orders/domain/policy";
import type { PricingInput } from "@/modules/payments/domain/pricing";

export interface OwnedEntity {
  id: string;
  userId: string;
  createdAt: string;
}
export interface Profile extends OwnedEntity {
  fullName: string;
  profession: string;
  country: string;
  businessName: string;
  currency: Currency;
  hourlyRateMinor: number;
  minimumChargeMinor: number;
  riskPercent: number;
  urgencyPercent: number;
  email: string;
}
export interface Client extends OwnedEntity {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}
export interface Project extends OwnedEntity {
  clientId: string;
  name: string;
  description: string;
  originalValueMinor: number;
  currency: Currency;
  startDate: string;
  dueDate: string;
  status: "ACTIVE" | "COMPLETED";
  includedScope: string;
  excludedScope: string;
  deliverables: string;
  revisionPolicy: string;
  contractText: string;
}
export const CLASSIFICATIONS = [
  "WITHIN_SCOPE",
  "PARTIALLY_OUT_OF_SCOPE",
  "OUT_OF_SCOPE",
  "UNCERTAIN",
] as const;
export interface ScopeResult {
  classification: (typeof CLASSIFICATIONS)[number];
  confidence: number;
  summary: string;
  matchedScopeItems: string[];
  newScopeItems: string[];
  complexity: "LOW" | "MEDIUM" | "HIGH";
  hoursMin: number;
  hoursMax: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction:
    | "NO_ACTION"
    | "CLARIFY_CLIENT"
    | "CREATE_CHANGE_ORDER"
    | "FREELANCER_REVIEW";
}
export interface Analysis extends OwnedEntity {
  baseline: Project;
  projectId: string;
  requestText: string;
  result: ScopeResult;
  pricing: PricingInput & {
    minMinor: number;
    maxMinor: number;
    recommendedMinor: number;
  };
  provider: string;
}
export interface ProjectReviewResult {
  summary: string;
  risks: string[];
  clarificationQuestions: string[];
}
export interface ProjectReview extends OwnedEntity {
  projectId: string;
  baseline: Project;
  result: ProjectReviewResult;
  provider: string;
}
export interface ChangeOrder extends OwnedEntity {
  projectId: string;
  analysisId: string | null;
  number: string;
  description: string;
  amountMinor: number;
  currency: Currency;
  timelineDays: number;
  status: OrderStatus;
  tokenHash: string | null;
  tokenExpiresAt: string | null;
  tokenRevokedAt: string | null;
  approvedAt: string | null;
}
export const INVOICE_STATUSES = [
  "DRAFT",
  "SENT",
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "REFUNDED",
  "CANCELLED",
] as const;
export interface Invoice extends OwnedEntity {
  projectId: string;
  changeOrderId: string;
  paypalInvoiceId: string;
  number: string;
  amountMinor: number;
  paidMinor: number;
  currency: Currency;
  status: (typeof INVOICE_STATUSES)[number];
  payerViewUrl: string;
  sentAt: string | null;
  paidAt: string | null;
}
export interface Activity extends OwnedEntity {
  projectId: string | null;
  eventType: string;
  description: string;
}
export interface Entities {
  project_reviews: ProjectReview;
  profiles: Profile;
  clients: Client;
  projects: Project;
  analyses: Analysis;
  change_orders: ChangeOrder;
  invoices: Invoice;
  activity_logs: Activity;
}
export type Table = keyof Entities;
export interface Workspace {
  reviews: ProjectReview[];
  profile: Profile | null;
  clients: Client[];
  projects: Project[];
  analyses: Analysis[];
  orders: ChangeOrder[];
  invoices: Invoice[];
  activity: Activity[];
}

export function financialSummary(workspace: Workspace, currency: Currency) {
  const projects = workspace.projects.filter((p) => p.currency === currency);
  const invoices = workspace.invoices.filter((i) => i.currency === currency);
  const orders = workspace.orders.filter((o) => o.currency === currency);
  return {
    contracted: projects.reduce((sum, p) => sum + p.originalValueMinor, 0),
    collected: invoices
      .filter((i) => i.status !== "REFUNDED")
      .reduce((sum, i) => sum + i.paidMinor, 0),
    outstanding: invoices
      .filter((i) => !["CANCELLED", "REFUNDED", "DRAFT"].includes(i.status))
      .reduce((sum, i) => sum + i.amountMinor - i.paidMinor, 0),
    protected: orders
      .filter(
        (o) =>
          ["APPROVED", "INVOICED", "PAID"].includes(o.status) &&
          !invoices.some(
            (i) =>
              i.changeOrderId === o.id &&
              ["REFUNDED", "CANCELLED"].includes(i.status),
          ),
      )
      .reduce((sum, o) => sum + o.amountMinor, 0),
  };
}
