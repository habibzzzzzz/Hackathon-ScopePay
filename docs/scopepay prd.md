# ScopePay.ai
## Product Requirements Document — Hackathon MVP
### Version 1.1 — Clean Architecture & Clean Code Revision

**Product:** ScopePay.ai  
**Version:** 1.1  
**Date:** October 2026  
**Product Type:** AI-powered SaaS Web Application  
**Primary Target:** Freelancers & Small Digital Agencies  
**Platform:** Responsive Web Application  
**Architecture:** Next.js Monolith with Clean Architecture principles  
**Database / Auth / Storage:** Supabase  
**Payment Infrastructure:** PayPal  
**AI:** LLM-based Scope Intelligence Engine  
**Deployment:** Vercel + Supabase  

---

# 1. Executive Summary

ScopePay.ai adalah AI Commercial Intelligence Platform untuk freelancer dan small digital agencies yang membantu mereka:

1. memahami scope pekerjaan yang telah disepakati;
2. menilai apakah request baru masih termasuk scope;
3. mendeteksi pekerjaan tambahan yang layak ditagih;
4. mengestimasi effort;
5. merekomendasikan additional charge secara transparan;
6. membuat change order;
7. meminta persetujuan client;
8. mengubah pekerjaan tambahan yang disetujui menjadi PayPal invoice;
9. menyinkronkan status pembayaran melalui PayPal webhook.

Core statement:

> ScopePay helps freelancers understand what is in scope, identify billable changes, determine a reasonable additional charge, and turn approved work into PayPal payments.

Primary tagline:

> **Know your scope. Know your worth. Get paid.**

---

# 2. Product Scope

ScopePay bukan:

- freelancer marketplace;
- Upwork/Fiverr competitor;
- project management platform lengkap;
- accounting software;
- escrow platform;
- payroll system;
- CRM lengkap;
- generic AI chatbot.

ScopePay berfokus pada commercial workflow:

```text
Project Baseline
      ↓
Client Request
      ↓
AI Scope Analysis
      ↓
Billable Change Detection
      ↓
Pricing Recommendation
      ↓
Freelancer Approval
      ↓
Change Order
      ↓
Client Approval
      ↓
PayPal Invoice
      ↓
Payment
      ↓
Webhook
      ↓
Protected Revenue
```

---

# 3. Problem Statement

Freelancer sering memiliki informasi project yang tersebar:

```text
WhatsApp / Email
→ request client

PDF / Google Docs
→ contract / scope

Spreadsheet
→ budget

PayPal
→ payment

Manual notes
→ additional request
```

Akibatnya muncul:

- scope creep;
- unpaid additional work;
- underpricing;
- keterlambatan billing;
- pekerjaan tambahan dianggap revisi gratis;
- commercial context tidak terhubung dengan payment context.

ScopePay menyatukan konteks tersebut dalam satu commercial workflow.

---

# 4. Product Vision

ScopePay menjadi **commercial intelligence layer** antara:

```text
Work
Scope
Client
Pricing
Change
Payment
```

AI menangani:

```text
Understand
Compare
Classify
Estimate
Recommend
Explain
```

PayPal menangani:

```text
Invoice
Payment
Payment Events
```

Human tetap menjadi pengambil keputusan final.

---

# 5. Product Principles

## 5.1 AI Advises, Human Decides

AI tidak boleh otomatis menagih client.

```text
AI Recommendation
      ↓
Freelancer Review
      ↓
Freelancer Approval
      ↓
Commercial Action
```

## 5.2 Explainable Recommendation

Setiap recommendation harus menjelaskan:

- baseline yang dibandingkan;
- request baru;
- bagian yang berubah;
- classification;
- estimated effort;
- formula pricing;
- recommended action.

## 5.3 No Automatic Charging

Semua payment harus melalui tindakan eksplisit manusia.

## 5.4 PayPal as Financial Execution Layer

ScopePay tidak menyimpan uang.

```text
Client
  ↓
PayPal
  ↓
Freelancer
```

## 5.5 Commercial Context First

Jika fitur tidak membantu salah satu dari:

```text
Understand Scope
Detect Billable Work
Create Change Order
Get Paid
```

fitur tersebut bukan prioritas MVP.

---

# 6. Target Users

## Primary

- Web Developer
- Mobile Developer
- Full-Stack Developer
- UI/UX Designer
- Graphic Designer
- Software Consultant
- Digital Marketing Freelancer
- Video Editor
- Photographer
- Product Designer

## Secondary

Small digital agencies dengan:

- 2–20 team members;
- multiple project-based clients;
- frequent change requests;
- milestone-based revenue.

## Client

Client bukan user SaaS utama.

Client hanya menerima secure change-order link untuk:

```text
Review
Approve / Reject
Pay with PayPal
```

Client tidak wajib membuat akun ScopePay.

---

# 7. MVP Golden Path

MVP dianggap valid jika flow berikut berjalan end-to-end:

```text
Register
↓
Create Profile
↓
Create Client
↓
Create Project
↓
Define Project Baseline
↓
Paste New Client Request
↓
AI Scope Analysis
↓
Pricing Recommendation
↓
Create Change Order
↓
Client Secure Approval
↓
Create PayPal Invoice
↓
Client Pays
↓
PayPal Webhook
↓
Invoice PAID
↓
Change Order PAID
↓
Protected Revenue Updated
```

---

# 8. MVP Features

## P0 — Mandatory

- Authentication
- Freelancer Profile
- Pricing Profile
- Clients
- Projects
- Scope Baseline
- AI Project Analysis
- AI Scope Creep Detection
- AI Effort Estimation
- Deterministic Pricing Engine
- Change Order
- Secure Client Approval Page
- PayPal Invoice
- PayPal Webhook
- Payment Status
- Dashboard
- Protected Revenue

## P1 — Recommended / Stretch

- Contract PDF/DOCX import
- AI Payment Intelligence
- Payment reminders
- Average payment time
- Analysis history
- Seller onboarding
- Activity timeline improvements

## Out of Scope

- Marketplace
- Job listing
- Bidding
- Escrow
- Accounting
- Payroll
- Full CRM
- Kanban
- Task management
- Native mobile app
- Internal chat
- Cryptocurrency
- Auto-charging

---

# 9. Core Functional Requirements

## 9.1 Authentication

Use Supabase Auth.

P0:

- Email + Password
- Session management
- Protected `/app/*` routes

Optional:

- Magic link

## 9.2 Freelancer Profile

Fields:

```text
Full Name
Profession
Country
Business Name (optional)
Website (optional)
Avatar (optional)
```

## 9.3 Pricing Profile

Required:

```text
Default Currency
Target Hourly Rate
```

Optional:

```text
Minimum Change Charge
Default Risk Buffer
Urgency Multiplier
```

## 9.4 Clients

Fields:

```text
Name
Company
Email
Phone (optional)
Notes (optional)
```

## 9.5 Projects

Fields:

```text
Project Name
Client
Description
Original Project Value
Currency
Start Date
Target Completion Date
Revision Policy
Status
```

## 9.6 Scope Baseline

Baseline must include:

```text
Included Scope
Excluded Scope
Deliverables
Revision Policy
Milestones (optional)
Contract Text (optional)
```

AI must compare client requests against this baseline.

## 9.7 Client Request Analysis

Classification:

```text
WITHIN_SCOPE
PARTIALLY_OUT_OF_SCOPE
OUT_OF_SCOPE
UNCERTAIN
```

Recommended action:

```text
NO_ACTION
CLARIFY_CLIENT
CREATE_CHANGE_ORDER
FREELANCER_REVIEW
```

## 9.8 Pricing Engine

AI estimates:

```text
Estimated Hours
Complexity
Risk
```

Application calculates:

```text
Estimated Hours
× Hourly Rate
× Risk Multiplier
× Urgency Multiplier
=
Recommended Charge
```

LLM must not be the final source of numeric pricing logic.

## 9.9 Change Order

States:

```text
DRAFT
SENT
VIEWED
APPROVED
REJECTED
INVOICED
PAID
CANCELLED
```

## 9.10 Client Approval

Route:

```text
/c/[token]
```

Token must be:

- cryptographically strong;
- unguessable;
- revocable;
- optionally expiring.

Do not expose raw change-order IDs publicly.

## 9.11 PayPal

Primary capability:

- PayPal Invoicing
- PayPal Webhooks

Flow:

```text
Change Order APPROVED
↓
Create PayPal Invoice
↓
Send PayPal Invoice
↓
Store PayPal Invoice ID
↓
Redirect to Payer View
↓
Client Pays
↓
Webhook
↓
Invoice PAID
↓
Change Order PAID
```

---

# 10. Technical Architecture

## 10.1 Architecture Goal

ScopePay menggunakan **Next.js monolith**, tetapi kode tidak boleh menjadi "everything inside app router".

Monolith di sini berarti:

> one deployable application, not one unstructured codebase.

Architecture harus menjaga:

- separation of concerns;
- dependency direction;
- testability;
- replaceable external integrations;
- domain logic independence;
- maintainability.

---

# 11. Clean Architecture Principles

ScopePay mengikuti empat logical layers:

```text
┌──────────────────────────────┐
│ Presentation                 │
│ Next.js Pages / Components   │
│ Route Handlers / Actions     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Application                  │
│ Use Cases / Orchestration    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Domain                       │
│ Rules / Entities / Value Obj │
└──────────────────────────────┘

Infrastructure implements ports required by
Application/Domain:

Supabase
PayPal
AI Provider
Storage
Logging
```

Dependency rule:

```text
Presentation
    ↓
Application
    ↓
Domain
```

Infrastructure:

```text
Infrastructure
implements interfaces / ports
owned by Application or Domain
```

Domain must never depend directly on:

- Next.js
- Supabase SDK
- PayPal SDK/API
- OpenAI/Gemini SDK
- React
- Vercel APIs

---

# 12. Layer Responsibilities

## 12.1 Domain Layer

Contains pure business rules.

Examples:

```text
Project
ScopeItem
ClientRequest
ChangeOrder
Invoice
PricingProfile
Money
ScopeClassification
ChangeOrderStatus
```

Domain functions:

```text
calculateRecommendedCharge()
canApproveChangeOrder()
canCreateInvoice()
canMarkChangeOrderPaid()
calculateProtectedRevenue()
```

Domain layer:

- no HTTP;
- no database calls;
- no environment variables;
- no vendor SDK.

---

## 12.2 Application Layer

Contains use cases.

Examples:

```text
CreateProject
AnalyzeClientRequest
CreateChangeOrder
ApproveChangeOrder
RejectChangeOrder
CreatePayPalInvoice
HandlePayPalWebhook
GetDashboardSummary
```

Responsibilities:

- coordinate domain logic;
- call repositories;
- call AI/payment ports;
- define transactions;
- enforce application rules;
- return application DTOs/results.

Application layer must not contain UI logic.

---

## 12.3 Infrastructure Layer

Contains external implementations.

Examples:

```text
SupabaseProjectRepository
SupabaseClientRepository
SupabaseChangeOrderRepository
PayPalInvoiceGateway
PayPalWebhookVerifier
LLMScopeAnalyzer
SupabaseStorageAdapter
```

If AI provider changes:

```text
OpenAI
→ Gemini
```

Application logic should not need major modification.

If database adapter changes, domain/use cases should remain stable.

---

## 12.4 Presentation Layer

Contains:

- Server Components
- Client Components
- forms
- Route Handlers
- Server Actions
- page composition

Responsibilities:

```text
Receive Input
Validate Transport-Level Input
Call Use Case
Map Result
Render / Respond
```

Route Handler must remain thin.

Bad:

```text
POST /api/change-orders
→ query DB
→ calculate price
→ call AI
→ decide status
→ call PayPal
→ mutate several tables
```

Good:

```text
POST /api/change-orders
→ validate request
→ createChangeOrder.execute()
→ return response
```

---

# 13. Recommended Project Structure

```text
src/
│
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── clients/
│   │   ├── change-orders/
│   │   ├── payments/
│   │   └── settings/
│   ├── c/
│   │   └── [token]/
│   └── api/
│       ├── webhooks/
│       └── internal/
│
├── modules/
│   ├── projects/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── clients/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── scope-analysis/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── change-orders/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   └── payments/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
│
├── shared/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── presentation/
│   ├── errors/
│   ├── validation/
│   ├── utils/
│   └── config/
│
└── tests/
```

Architecture uses a **modular-monolith + clean architecture hybrid**.

This is preferred over a global folder structure such as:

```text
controllers/
services/
repositories/
models/
```

because feature ownership becomes clearer.

---

# 14. Module Example

Example `change-orders`:

```text
modules/change-orders/
│
├── domain/
│   ├── entities/
│   │   └── change-order.ts
│   ├── value-objects/
│   │   └── change-order-status.ts
│   ├── services/
│   │   └── change-order-policy.ts
│   └── repositories/
│       └── change-order.repository.ts
│
├── application/
│   ├── use-cases/
│   │   ├── create-change-order.ts
│   │   ├── approve-change-order.ts
│   │   └── mark-change-order-paid.ts
│   └── dto/
│
├── infrastructure/
│   └── repositories/
│       └── supabase-change-order.repository.ts
│
└── presentation/
    ├── components/
    └── schemas/
```

---

# 15. Ports & Adapters

External systems must be abstracted behind interfaces.

## AI Port

```ts
interface ScopeAnalyzer {
  analyze(input: ScopeAnalysisInput): Promise<ScopeAnalysisResult>;
}
```

Implementations:

```text
OpenAIScopeAnalyzer
GeminiScopeAnalyzer
```

## Payment Port

```ts
interface InvoiceGateway {
  createInvoice(input: CreateInvoiceInput): Promise<ExternalInvoice>;
  sendInvoice(invoiceId: string): Promise<void>;
  getInvoice(invoiceId: string): Promise<ExternalInvoice>;
}
```

Implementation:

```text
PayPalInvoiceGateway
```

## Repository Port

```ts
interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
}
```

Implementation:

```text
SupabaseProjectRepository
```

---

# 16. Domain Model Rules

## Project

Must own:

- commercial baseline;
- original value;
- currency;
- status.

## Client Request

Must be immutable after analysis unless explicitly edited/versioned.

## AI Analysis

Must store:

- structured result;
- confidence;
- model metadata;
- timestamp.

## Change Order

Business invariants:

```text
Cannot invoice DRAFT
Cannot invoice REJECTED
Cannot mark PAID without valid payment event
Cannot approve CANCELLED
```

## Invoice

External PayPal state must be mapped to internal normalized state.

---

# 17. Clean Code Standards

## 17.1 Naming

Use explicit names.

Good:

```text
calculateRecommendedCharge
findProjectById
approveChangeOrder
verifyPayPalWebhook
```

Avoid:

```text
handleData
processThing
doStuff
manage
helper
utils2
```

---

## 17.2 Function Size

Functions should do one conceptual job.

Prefer:

```text
validateInput()
loadProject()
analyzeScope()
calculateCharge()
saveAnalysis()
```

over a 200-line orchestration function.

---

## 17.3 Avoid Boolean Traps

Bad:

```ts
createInvoice(true, false, true)
```

Good:

```ts
createInvoice({
  sendImmediately: true,
  includeChangeOrderReference: true
})
```

---

## 17.4 Avoid Deep Nesting

Use:

- guard clauses;
- early returns;
- domain errors.

Bad:

```ts
if (project) {
  if (changeOrder) {
    if (approved) {
      ...
    }
  }
}
```

Good:

```ts
if (!project) throw new ProjectNotFoundError();
if (!changeOrder) throw new ChangeOrderNotFoundError();
if (!changeOrder.isApproved()) throw new ChangeOrderNotApprovedError();
```

---

## 17.5 No Magic Numbers

Bad:

```ts
price * 1.1
```

Good:

```ts
price * riskMultiplier
```

---

## 17.6 Pure Functions for Business Calculation

Pricing calculations should be pure where possible.

```ts
calculateRecommendedCharge(input)
```

No DB/API calls inside pricing calculation.

---

# 18. SOLID Guidelines

## Single Responsibility

A class/module should have one reason to change.

## Open/Closed

AI provider and payment provider should be replaceable via interfaces.

## Liskov Substitution

Alternative adapters must obey the same interface contract.

## Interface Segregation

Prefer small interfaces:

```text
InvoiceCreator
InvoiceReader
WebhookVerifier
```

instead of one giant `PayPalService`.

## Dependency Inversion

Use cases depend on ports/interfaces, not concrete Supabase/PayPal implementations.

---

# 19. Data Access Rules

UI components must not directly query business tables for complex operations.

Allowed:

```text
Server Component
→ Query Service / Use Case
→ Repository
```

Avoid:

```text
React Component
→ Supabase.from('change_orders')
→ business decision
```

Simple read-only presentation queries can use dedicated query services.

---

# 20. CQRS-Lite Approach

Do not implement full CQRS framework.

Use conceptual separation:

## Commands

Mutate state:

```text
CreateProject
AnalyzeRequest
CreateChangeOrder
ApproveChangeOrder
CreateInvoice
```

## Queries

Read state:

```text
GetDashboard
GetProjectDetail
ListPayments
ListClients
```

Query models may be optimized for UI without polluting domain entities.

---

# 21. DTO Rules

Do not expose database rows directly to UI or API consumers.

Use:

```text
Domain Entity
↓
Mapper
↓
DTO / View Model
```

Example:

```ts
type ProjectSummaryDTO = {
  id: string;
  name: string;
  clientName: string;
  originalValue: MoneyDTO;
  additionalRevenue: MoneyDTO;
  outstanding: MoneyDTO;
  commercialStatus: string;
};
```

---

# 22. Validation Strategy

Use Zod.

Validation boundaries:

```text
Form Input
API Request
Environment Variables
AI Structured Output
Webhook Payload Metadata
```

Do not trust:

- browser input;
- AI response;
- webhook payload before verification.

Validation flow:

```text
Raw Input
↓
Schema Validation
↓
Application DTO
↓
Use Case
```

---

# 23. Error Handling

Define typed application/domain errors.

Examples:

```text
ProjectNotFoundError
InvalidProjectStateError
ChangeOrderNotApprovedError
InvoiceAlreadyExistsError
PayPalInvoiceCreationError
InvalidWebhookSignatureError
AIAnalysisUnavailableError
```

Route handlers map errors to HTTP responses.

Example:

```text
ProjectNotFoundError
→ 404

ValidationError
→ 400

UnauthorizedError
→ 401

ForbiddenError
→ 403

ConflictError
→ 409

ExternalServiceError
→ 502 / safe UI state
```

Never expose:

- PayPal secrets;
- AI provider raw errors;
- SQL details;
- stack traces in production UI.

---

# 24. Result Handling

For expected business failures, use explicit result/error patterns rather than generic exceptions everywhere.

Example:

```ts
type AnalyzeRequestResult =
  | { ok: true; analysis: AnalysisDTO }
  | { ok: false; reason: 'INSUFFICIENT_BASELINE' | 'AI_UNAVAILABLE' };
```

Use exceptions for exceptional/unexpected failures.

---

# 25. Logging

Use structured logging.

Every log should include relevant context:

```text
requestId
userId
projectId
changeOrderId
paypalInvoiceId
eventId
```

Never log:

- passwords;
- access tokens;
- full PayPal secrets;
- sensitive contract content unless explicitly sanitized.

Log levels:

```text
debug
info
warn
error
```

---

# 26. Observability

Critical workflows should be traceable:

```text
AI Analysis
Change Order Creation
Client Approval
PayPal Invoice Creation
Webhook Processing
Payment Synchronization
```

Each external call should log:

```text
provider
operation
duration
success/failure
correlation id
```

---

# 27. Idempotency

Mandatory for:

- PayPal webhook processing;
- invoice creation;
- client approval;
- payment synchronization.

Example:

```text
paypal_event_id UNIQUE
```

Webhook:

```text
if event already processed
→ return 200
→ no duplicate mutation
```

Invoice creation:

```text
if change order already has invoice
→ return existing invoice
```

---

# 28. Transaction Boundaries

Operations that update multiple related rows must use database transaction/RPC where consistency matters.

Example:

```text
Mark Invoice PAID
+
Mark Change Order PAID
+
Create Activity Log
```

must not leave partial state.

If direct Supabase client transaction is insufficient for a workflow, use a PostgreSQL function/RPC for atomic mutation.

---

# 29. Database Schema

## profiles

```text
id UUID PK
full_name
business_name
profession
country
avatar_url
default_currency
hourly_rate
minimum_change_charge
default_risk_buffer
created_at
updated_at
```

## paypal_connections

```text
id
user_id
merchant_id
merchant_email
connection_status
permissions
sandbox
connected_at
updated_at
```

## clients

```text
id
user_id
name
company
email
phone
notes
created_at
updated_at
```

## projects

```text
id
user_id
client_id
name
description
currency
original_value
start_date
due_date
status
revision_policy
created_at
updated_at
```

## project_scope_items

```text
id
project_id
title
description
scope_type
source
created_at
updated_at
```

## project_milestones

```text
id
project_id
name
description
amount
due_date
status
created_at
updated_at
```

## project_documents

```text
id
project_id
filename
storage_path
mime_type
extracted_text
created_at
```

## client_requests

```text
id
project_id
request_text
source
status
created_at
updated_at
```

## ai_analyses

```text
id
project_id
client_request_id
classification
confidence
summary
complexity
estimated_hours_min
estimated_hours_max
risk_level
recommended_action
structured_result JSONB
model_metadata JSONB
created_at
```

## change_orders

```text
id
project_id
client_request_id
number
description
amount
currency
timeline_impact_days
status
public_token
token_expires_at
approved_at
rejected_at
created_at
updated_at
```

## change_order_items

```text
id
change_order_id
name
description
amount
quantity
created_at
```

## invoices

```text
id
user_id
project_id
change_order_id
paypal_invoice_id
invoice_number
amount
currency
status
payer_view_url
sent_at
paid_at
refunded_at
created_at
updated_at
```

## paypal_events

```text
id
paypal_event_id UNIQUE
event_type
resource_id
payload JSONB
processed
processed_at
created_at
```

## activity_logs

```text
id
user_id
project_id
actor_type
event_type
metadata JSONB
created_at
```

---

# 30. Database Naming Conventions

Use:

```text
snake_case
```

Tables:

```text
plural nouns
```

Examples:

```text
projects
change_orders
paypal_events
```

Primary keys:

```text
id
```

Foreign keys:

```text
project_id
client_id
user_id
```

Timestamps:

```text
created_at
updated_at
paid_at
approved_at
```

---

# 31. Supabase Rules

## Row Level Security

RLS mandatory.

Typical ownership rule:

```text
auth.uid() = user_id
```

Public client route must not bypass security by exposing anon-table reads.

Use server-side application logic to resolve:

```text
public_token
→ change order
```

## Service Role

`SUPABASE_SERVICE_ROLE_KEY`:

- server only;
- never exposed to browser;
- only used where necessary.

## Storage

Bucket:

```text
project-documents
```

Private by default.

Use signed URLs.

---

# 32. AI Architecture

AI must be adapter-based.

Application interface:

```ts
interface ScopeAnalyzer {
  analyze(input: ScopeAnalysisInput): Promise<ScopeAnalysisResult>;
}
```

AI input:

```text
Project Description
Included Scope
Excluded Scope
Revision Policy
Original Value
Pricing Profile
Client Request
```

AI output:

```json
{
  "classification": "OUT_OF_SCOPE",
  "confidence": 0.92,
  "summary": "The requested features were not included in the baseline.",
  "matched_scope_items": [],
  "new_scope_items": [
    "Google OAuth",
    "PDF Export"
  ],
  "complexity": "MEDIUM",
  "estimated_hours_min": 8,
  "estimated_hours_max": 12,
  "risk_level": "LOW",
  "commercial_recommendation": "CREATE_CHANGE_ORDER"
}
```

All AI output must pass Zod validation before use.

---

# 33. AI Guardrails

AI must:

- never invent contract clauses;
- return UNCERTAIN if context is insufficient;
- never directly create invoice/payment;
- never claim external market pricing as fact unless supported;
- provide concise reasoning;
- output structured data;
- avoid legal advice;
- avoid automatically deciding final charge.

---

# 34. Pricing Architecture

Pricing logic belongs in domain/application logic, not prompt.

Example:

```text
AI
→ estimated effort
→ complexity
→ risk

Pricing Domain Service
→ hourly rate
→ minimum charge
→ risk multiplier
→ urgency multiplier
→ recommended range
```

Pure function example:

```ts
calculateRecommendedCharge({
  estimatedHoursMin,
  estimatedHoursMax,
  hourlyRate,
  riskMultiplier,
  urgencyMultiplier,
  minimumCharge
})
```

---

# 35. PayPal Architecture

Define a payment port:

```ts
interface InvoiceGateway {
  createInvoice(input: CreateInvoiceInput): Promise<InvoiceResult>;
  sendInvoice(id: string): Promise<void>;
  getInvoice(id: string): Promise<InvoiceResult>;
}
```

Infrastructure:

```text
PayPalInvoiceGateway
```

Webhook verifier:

```ts
interface PaymentWebhookVerifier {
  verify(input: WebhookVerificationInput): Promise<boolean>;
}
```

PayPal-specific mapping stays inside infrastructure.

Domain/application should not parse raw PayPal response objects.

---

# 36. Webhook Architecture

Endpoint:

```text
POST /api/webhooks/paypal
```

Handler responsibilities:

```text
1. Read raw request
2. Verify signature
3. Validate required metadata
4. Call HandlePayPalWebhook use case
5. Return 2xx safely
```

Use case responsibilities:

```text
1. Check idempotency
2. Map event
3. Find invoice
4. Apply legal state transition
5. Persist atomically
6. Add activity log
```

---

# 37. State Machines

Status transitions must be explicit.

## Change Order

```text
DRAFT
  ↓
SENT
  ↓
VIEWED
  ↓
APPROVED
  ↓
INVOICED
  ↓
PAID
```

Possible side transitions:

```text
SENT → REJECTED
VIEWED → REJECTED
DRAFT → CANCELLED
SENT → CANCELLED
```

Invalid transitions should fail.

## Invoice

```text
DRAFT
→ SENT
→ UNPAID
→ PARTIALLY_PAID
→ PAID
```

Side states:

```text
REFUNDED
CANCELLED
```

System/API failures are not financial states.

---

# 38. Server Components vs Client Components

Default to Server Components.

Use Client Components only when needed for:

- interactive forms;
- modals;
- local UI state;
- optimistic UI;
- browser-only APIs.

Do not add `"use client"` to large layout trees unnecessarily.

---

# 39. Server Actions vs Route Handlers

## Server Actions

Use for authenticated first-party UI mutations where appropriate:

```text
Create Project
Update Pricing Profile
Create Client
```

## Route Handlers

Use for:

- external webhooks;
- public endpoints;
- integration callbacks;
- endpoints requiring explicit HTTP semantics.

Example:

```text
/api/webhooks/paypal
```

Business logic must remain in application use cases regardless of entry point.

---

# 40. API Design Standards

If internal HTTP endpoints are used:

```text
/api/v1/...
```

Response shape:

```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```

Error:

```json
{
  "data": null,
  "error": {
    "code": "CHANGE_ORDER_NOT_APPROVED",
    "message": "This change order must be approved before invoicing."
  }
}
```

Do not expose vendor-specific errors directly.

---

# 41. Security

Mandatory:

- HTTPS
- Supabase RLS
- secure cookies/session
- server-only secrets
- webhook verification
- idempotency
- signed/private storage
- rate limiting AI endpoints
- rate limiting public token endpoints
- input validation
- token expiry/revocation
- no secret in client bundle
- no sequential public authorization IDs

---

# 42. Environment Configuration

Use a validated config module.

Example variables:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

AI_PROVIDER
AI_API_KEY

PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
PAYPAL_ENV

PAYPAL_PARTNER_ID
PAYPAL_BN_CODE
PAYPAL_DEMO_MERCHANT_ID
```

Validate at application startup.

Do not access `process.env` randomly throughout business logic.

Use:

```text
shared/config/env.ts
```

---

# 43. Coding Conventions

## TypeScript

Enable strict mode.

Avoid:

```ts
any
```

Prefer:

```text
unknown
→ validate
→ typed value
```

## Imports

Use aliases:

```text
@/modules/...
@/shared/...
```

Avoid deep relative paths:

```text
../../../../../
```

## File Naming

Recommended:

```text
kebab-case.ts
```

React component file naming may use:

```text
project-card.tsx
```

Exports/classes/functions use conventional TypeScript casing.

---

# 44. Shared Code Rules

Do not turn `shared/` into a dumping ground.

Shared code must be genuinely cross-module.

Bad:

```text
shared/utils/helpers.ts
```

with dozens of unrelated functions.

Good:

```text
shared/domain/money.ts
shared/errors/application-error.ts
shared/validation/pagination.schema.ts
```

---

# 45. Dependency Rules

Forbidden examples:

```text
domain → infrastructure
domain → presentation
application → React component
application → Supabase SDK
application → PayPal SDK
```

Allowed:

```text
presentation → application
application → domain
infrastructure → application ports
infrastructure → domain types where necessary
```

Automated lint rules should be added if practical.

---

# 46. Linting & Formatting

Required:

- ESLint
- Prettier
- TypeScript strict

Recommended CI checks:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Pull request / submission branch must pass all checks.

---

# 47. Testing Strategy

Testing pyramid:

```text
        E2E
      Integration
    Unit / Domain
```

## Unit

Test pure business rules:

- pricing;
- state transition;
- protected revenue;
- token policy;
- domain validation.

## Application

Test use cases with fake repositories/adapters.

Example:

```text
AnalyzeClientRequest
CreateChangeOrder
ApproveChangeOrder
HandlePayPalWebhook
```

## Integration

Test:

- Supabase repository;
- PayPal payload mapper;
- AI structured-output parser;
- webhook persistence.

## E2E

Golden path:

```text
Signup
↓
Project
↓
Analysis
↓
Change Order
↓
Client Approval
↓
PayPal Sandbox
↓
Webhook
↓
PAID
```

---

# 48. Testability Requirement

Every core use case should be testable without:

- starting Next.js;
- calling real PayPal;
- calling real AI provider;
- requiring a browser.

Use fake adapters.

Example:

```text
FakeProjectRepository
FakeScopeAnalyzer
FakeInvoiceGateway
```

---

# 49. UI Architecture

UI should follow the revised design system.

Primary product experience:

- professional dark glassmorphism;
- data-focused;
- clear financial states;
- AI as structured intelligence, not generic chatbot.

AI analysis should live in project context.

Avoid standalone "AI chat" as the primary interaction.

---

# 50. Primary Routes

```text
/

/features
/pricing
/login
/register

/app/dashboard
/app/projects
/app/projects/new
/app/projects/[id]
/app/projects/[id]/analyze
/app/clients
/app/change-orders
/app/payments
/app/settings

/c/[token]
```

---

# 51. Suggested Use Cases

```text
RegisterUser
CompleteFreelancerProfile
CreateClient
CreateProject
UpdateProjectBaseline
AnalyzeProject
AnalyzeClientRequest
CreateChangeOrder
SendChangeOrder
ViewPublicChangeOrder
ApproveChangeOrder
RejectChangeOrder
CreateInvoice
SyncInvoiceStatus
HandlePayPalWebhook
GetDashboardSummary
GetProjectDetail
ListPayments
```

---

# 52. Use Case Example

`AnalyzeClientRequest`

```text
Input
↓
Validate Request
↓
Load Project
↓
Load Baseline
↓
Load Pricing Profile
↓
Call ScopeAnalyzer Port
↓
Validate AI Output
↓
Run Pricing Domain Service
↓
Persist Analysis
↓
Return Analysis DTO
```

The use case owns orchestration.

Neither the route nor the UI should own this workflow.

---

# 53. Repository Rules

Repositories abstract persistence.

Examples:

```text
ProjectRepository
ClientRepository
AnalysisRepository
ChangeOrderRepository
InvoiceRepository
EventRepository
```

Repository should not contain unrelated business decisions.

Bad:

```text
repository.createInvoiceAndCalculatePriceAndSendPayPal()
```

Good:

```text
invoiceRepository.save()
```

---

# 54. Mapping Strategy

Use explicit mappers:

```text
Supabase Row
↓
Domain Entity

Domain Entity
↓
Persistence Row

Domain/Application Result
↓
Presentation DTO
```

Avoid spreading raw DB row types across the application.

---

# 55. Money Handling

Never use floating-point arithmetic casually for money.

Preferred approaches:

- store decimal/numeric in PostgreSQL;
- normalize through a Money value object;
- consistently track currency.

Example:

```ts
Money {
  amount: DecimalLike
  currency: 'USD'
}
```

All arithmetic must preserve currency consistency.

---

# 56. Date/Time Handling

Database timestamps:

```text
UTC
```

Presentation:

```text
User locale/timezone
```

Avoid business rules based on browser-local time without normalization.

---

# 57. Public Token Security

Generate using cryptographically secure random bytes.

Do not use:

```text
change_order_id
incremental number
timestamp only
```

Store token securely and support:

```text
expires_at
revoked_at (future optional)
```

---

# 58. Activity Audit Trail

Track commercial events:

```text
PROJECT_CREATED
ANALYSIS_GENERATED
PRICE_OVERRIDDEN
CHANGE_ORDER_CREATED
CHANGE_ORDER_SENT
CHANGE_ORDER_VIEWED
CHANGE_ORDER_APPROVED
CHANGE_ORDER_REJECTED
PAYPAL_INVOICE_CREATED
PAYMENT_RECEIVED
REFUND_RECEIVED
```

Audit logs should be append-oriented.

---

# 59. Performance

Target:

```text
Dashboard typical load < 2.5s

Standard server operation
< 2s excluding external APIs

AI analysis target
< 15s
```

Performance rules:

- avoid N+1 queries;
- index foreign keys and status/filter columns;
- use server rendering strategically;
- cache only safe/read-oriented data;
- do not cache payment state incorrectly.

---

# 60. Database Indexing

Recommended indexes:

```text
projects(user_id)
projects(client_id)
projects(status)

client_requests(project_id)

ai_analyses(project_id)
ai_analyses(client_request_id)

change_orders(project_id)
change_orders(status)
change_orders(public_token)

invoices(user_id)
invoices(project_id)
invoices(change_order_id)
invoices(paypal_invoice_id)
invoices(status)

paypal_events(paypal_event_id)
```

---

# 61. Failure Handling

External AI failure:

```text
Analysis unavailable
Project data remains unchanged
User can retry
```

PayPal invoice creation failure:

```text
Change Order remains APPROVED
No invoice marked as created
User can retry safely
```

Webhook failure:

```text
Return appropriate failure
Log event
Do not produce partial financial state
```

---

# 62. Retry Policy

Retries may be used for transient external failures.

Never blindly retry:

- non-idempotent writes;
- client approval mutations;
- invoice creation without idempotency guard.

Retry policies must be bounded.

---

# 63. Design Consistency

Use revised `design.md` as visual source of truth.

Important alignment:

- Dark mode primary
- Professional restrained glassmorphism
- AI contextual to project
- `/c/[token]`
- commercial status instead of generic project progress
- Payment Intelligence as P1
- invoice state separate from system errors

---

# 64. Hackathon Demo Scenario

Seed:

```text
Project:
HAVN Coffee Website

Original Value:
$1,500

Included:
Landing Page
Digital Menu
Reservation
Admin Dashboard

Client Request:
"Can we add Google login and PDF sales reports?"
```

Expected:

```text
OUT_OF_SCOPE

Estimated:
8–12 hours

Recommended:
$175–$265

Final Charge:
$220
```

Flow:

```text
Analyze
↓
Create $220 Change Order
↓
Client Approves
↓
PayPal Invoice
↓
Sandbox Payment
↓
Webhook
↓
PAID
↓
Protected Revenue +$220
```

---

# 65. Protected Revenue

Primary product metric:

> Total approved additional revenue identified and converted into billable work with ScopePay.

Example:

```text
Protected Revenue
$1,240
```

This metric differentiates ScopePay from project management tools.

---

# 66. Definition of Done — Architecture

Architecture is acceptable when:

- route handlers contain no significant business rules;
- UI does not directly orchestrate PayPal/AI workflows;
- domain has no Next.js/Supabase/PayPal dependency;
- AI provider is behind an interface;
- PayPal is behind an interface;
- core repositories are abstracted;
- pricing is pure/testable;
- state transitions are explicit;
- validation exists at boundaries;
- business errors are typed;
- PayPal webhook is idempotent;
- core use cases can be unit tested with fake adapters;
- TypeScript strict passes;
- lint passes;
- build passes.

---

# 67. Definition of Done — Hackathon

ScopePay Hackathon MVP is complete when one user can perform without manual database manipulation:

```text
Register
↓
Create Profile
↓
Create Client
↓
Create Project
↓
Define Scope
↓
Analyze Request
↓
Get Structured Scope Result
↓
Get Transparent Pricing Recommendation
↓
Create Change Order
↓
Client Opens Secure Token Link
↓
Client Approves
↓
Create Real PayPal Sandbox Invoice
↓
Complete Sandbox Payment
↓
Receive Verified PayPal Webhook
↓
Mark Invoice PAID
↓
Mark Change Order PAID
↓
Update Protected Revenue
```

---

# 68. Engineering Golden Rules

1. **Keep controllers/routes thin.**
2. **Business logic belongs in domain/application layers.**
3. **External providers are adapters, never the center of the codebase.**
4. **Do not put pricing logic in prompts.**
5. **Do not trust AI output without validation.**
6. **Do not trust public/webhook input without validation.**
7. **Do not use raw database rows everywhere.**
8. **Do not over-engineer the hackathon.**
9. **Prefer clear code over clever abstractions.**
10. **Every abstraction must solve a real boundary or testability problem.**
11. **One monolith is fine; tangled dependencies are not.**
12. **Golden path stability is more important than feature count.**

---

# 69. Final Technical Positioning

ScopePay uses:

```text
Next.js Monolith
+
Modular Clean Architecture
+
Supabase
+
AI Adapter
+
PayPal Adapter
```

The intended architecture is:

> **simple enough for a hackathon, structured enough to become a maintainable SaaS.**

Do not create microservices for the MVP.

Do not create unnecessary enterprise abstractions.

Use Clean Architecture pragmatically to protect the core commercial rules from UI, database, AI provider, and PayPal-specific implementation details.

---

# 70. Final Product Statement

> **ScopePay.ai is an AI-powered commercial intelligence platform that helps freelancers understand project scope, detect billable changes, calculate transparent additional charges, and convert approved work into PayPal payments.**

Technical principle:

> **One deployable Next.js application, clear module boundaries, clean dependency direction, and replaceable external integrations.**
