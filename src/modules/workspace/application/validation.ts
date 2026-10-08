import { z } from "zod";
import { CURRENCIES } from "@/shared/domain/money";
import { CLASSIFICATIONS } from "../domain/entities";

const short = z.string().trim().min(1).max(160);
const text = z.string().trim().max(20000);
const minor = z.number().int().min(0).max(1_000_000_000_000);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      Number.isFinite(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Enter a valid date.",
  );
export const profileInput = z.object({
  fullName: short,
  profession: short,
  country: short,
  businessName: z.string().trim().max(160),
  currency: z.enum(CURRENCIES),
  hourlyRateMinor: minor.min(1),
  minimumChargeMinor: minor,
  riskPercent: z.number().int().min(0).max(100),
  urgencyPercent: z.number().int().min(100).max(300),
});
export const clientInput = z.object({
  name: short,
  company: z.string().trim().max(160),
  email: z.email().max(254),
  phone: z.string().trim().max(50),
  notes: text,
});
export const projectInput = z
  .object({
    clientId: z.uuid(),
    name: short,
    description: text,
    originalValueMinor: minor.min(1),
    currency: z.enum(CURRENCIES),
    startDate: date,
    dueDate: date,
    status: z.enum(["ACTIVE", "COMPLETED"]),
    includedScope: text.min(10),
    excludedScope: text,
    deliverables: text.min(3),
    revisionPolicy: text.min(3),
    contractText: text,
  })
  .refine(
    (v) => v.dueDate >= v.startDate,
    "Completion date must follow the start date.",
  );
export const requestInput = z.object({
  projectId: z.uuid(),
  requestText: text.min(10).max(10000),
});
export const orderInput = z.object({
  projectId: z.uuid(),
  analysisId: z.uuid().nullable(),
  description: text.min(10).max(4000),
  amountMinor: minor.min(1),
  timelineDays: z.number().int().min(0).max(365),
});
export const scopeResultSchema = z
  .object({
    classification: z.enum(CLASSIFICATIONS),
    confidence: z.number().min(0).max(1),
    summary: z.string().min(10).max(4000),
    matchedScopeItems: z.array(z.string().min(1).max(1000)).max(50),
    newScopeItems: z.array(z.string().min(1).max(1000)).max(50),
    complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    hoursMin: z.number().min(0).max(10000),
    hoursMax: z.number().min(0).max(10000),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
    recommendedAction: z.enum([
      "NO_ACTION",
      "CLARIFY_CLIENT",
      "CREATE_CHANGE_ORDER",
      "FREELANCER_REVIEW",
    ]),
  })
  .refine((v) => v.hoursMax >= v.hoursMin, "Effort range is inverted.")
  .refine(
    (v) =>
      v.classification !== "WITHIN_SCOPE" ||
      v.recommendedAction !== "CREATE_CHANGE_ORDER",
    "Within-scope work cannot recommend billing.",
  )
  .refine(
    (v) =>
      v.classification !== "UNCERTAIN" ||
      ["CLARIFY_CLIENT", "FREELANCER_REVIEW"].includes(v.recommendedAction),
    "Uncertain work requires human review.",
  );
export const commandInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("project-review"), id: z.uuid() }),
  z.object({ action: z.literal("profile"), input: profileInput }),
  z.object({ action: z.literal("client"), input: clientInput }),
  z.object({ action: z.literal("project"), input: projectInput }),
  z.object({
    action: z.literal("baseline"),
    id: z.uuid(),
    input: projectInput,
  }),
  z.object({ action: z.literal("analyze"), input: requestInput }),
  z.object({ action: z.literal("order"), input: orderInput }),
  z.object({ action: z.literal("send"), id: z.uuid() }),
  z.object({ action: z.literal("cancel"), id: z.uuid() }),
  z.object({ action: z.literal("revoke"), id: z.uuid() }),
  z.object({ action: z.literal("invoice"), id: z.uuid() }),
]);
export type Command = z.infer<typeof commandInput>;
export const projectReviewSchema = z.object({
  summary: z.string().min(10).max(4000),
  risks: z.array(z.string().min(1).max(1000)).max(20),
  clarificationQuestions: z.array(z.string().min(1).max(1000)).max(20),
});
