# Implementation phases

Source of truth: `scopepay prd.md` v1.1 and `design (1).md`. P0 is the target; PDF import, reminders and payment intelligence remain P1.

| Phase | Deliverable                                                                   | Acceptance                                                     |
| ----- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1     | Modular architecture, validated configuration, money and state policies       | Domain tests and strict TypeScript                             |
| 2     | Auth, profile, clients, projects and baseline; Supabase migration with RLS    | Tenant isolation and authenticated routes                      |
| 3     | Structured scope analysis and deterministic pricing                           | Provider output validation; formula shown to freelancer        |
| 4     | Drafts, explicit sending, expiring/revocable client links, approval/rejection | Legal transitions; no automatic charging                       |
| 5     | PayPal invoice adapter, verified webhook and atomic reconciliation            | Retry safety, duplicate event handling, currency/amount checks |
| 6     | Responsive UI, regression tests, CI and gated CD                              | Lint, format, typecheck, unit, browser and build checks        |

Local demo data is isolated per session and persisted under `.data/`. Its analyzer is a fixture, not a real AI service; payment simulation is explicitly labeled and unavailable in live mode. Live mode uses Supabase, Gemini and PayPal. The hackathon payment adapter supports one configured seller account, not multi-merchant onboarding.

Design read: financial workspace for freelancers and small agencies, calm dark fintech surfaces; ENERGY 1 / RHYTHM 2 / MOTION 1. Dark theme, indigo accent and Poppins follow the supplied design. Scope/result split supports comparison; tabular numerals support financial scanning; spacing separates baseline, assessment and billing. Translucency is reserved for the assessment and public review surfaces. The product identity repeats the baseline/request/charge relationship rather than decorative imagery.

Anti Slop mode: After, explicitly selected in this session. Audit follows implementation. Findings are reported without silently applying audit fixes.
