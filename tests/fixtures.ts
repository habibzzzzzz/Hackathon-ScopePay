import type {
  ChangeOrder,
  Profile,
  Project,
} from "@/modules/workspace/domain/entities";
export const owner = "12345678-1234-4123-a123-123456789012";
export const projectId = "22345678-1234-4123-a123-123456789012";
export const clientId = "32345678-1234-4123-a123-123456789012";
export function orderFixture(
  overrides: Partial<ChangeOrder> = {},
): ChangeOrder {
  return {
    id: "42345678-1234-4123-a123-123456789012",
    userId: owner,
    createdAt: "2026-10-08T00:00:00Z",
    projectId,
    analysisId: null,
    number: "CHG-TEST",
    description: "Google login and PDF reports",
    amountMinor: 22000,
    currency: "USD",
    timelineDays: 3,
    status: "DRAFT",
    tokenHash: null,
    tokenExpiresAt: null,
    tokenRevokedAt: null,
    approvedAt: null,
    ...overrides,
  };
}
export const projectFixture: Project = {
  id: projectId,
  userId: owner,
  createdAt: "2026-10-08T00:00:00Z",
  clientId,
  name: "HAVN Coffee",
  description: "Coffee website",
  originalValueMinor: 150000,
  currency: "USD",
  startDate: "2026-10-08",
  dueDate: "2026-10-28",
  status: "ACTIVE",
  includedScope: "Landing page and reservation form",
  excludedScope: "Social authentication",
  deliverables: "Responsive website",
  revisionPolicy: "Two revisions",
  contractText: "",
};
export const profileFixture: Profile = {
  id: owner,
  userId: owner,
  createdAt: "2026-10-08T00:00:00Z",
  fullName: "Demo freelancer",
  profession: "Developer",
  country: "Indonesia",
  businessName: "Demo",
  email: "seller@example.com",
  currency: "USD",
  hourlyRateMinor: 2000,
  minimumChargeMinor: 5000,
  riskPercent: 10,
  urgencyPercent: 100,
};
