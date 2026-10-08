# ScopePay.ai

ScopePay compares a client request with the agreed project baseline, calculates an additional charge from the freelancer's rates, and turns approved work into an invoice. The implementation follows [the PRD](docs/scopepay%20prd.md) and [the design specification](docs/design%20%281%29.md).

## Run locally

Requirements: Node.js 24 and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

If `.env.local` already exists, preserve it instead of copying over it. Open `http://localhost:3000`, choose **Open demo workspace**, and load the fictional HAVN Coffee sample. Demo mode uses a labeled scope fixture and payment simulator. It never sends an invoice or moves money.

The demo session has a random HttpOnly cookie, expires after a day, and owns an isolated workspace. Data lives under `.data/`; the local file adapter supports one server process. Tests and browser downloads use workspace-local temporary directories so they do not depend on available space on the system drive.

## Implemented phases

1. Pure pricing, currency handling, transition/token policies, validated configuration and ports.
2. Supabase email/password authentication, profile and pricing, client creation, project/baseline creation and editing, tenant policies.
3. Project baseline review, structured request assessment, effort estimate and transparent deterministic pricing. Gemini live adapter and labeled demo fixture.
4. Human-reviewed drafts, price override logging, client approval/rejection, seven-day hashed tokens, cancellation and revocation.
5. PayPal create/send/read adapter, verified webhook, idempotent atomic financial reconciliation, financial dashboards and invoice pages.
6. Responsive dark UI, local regression checks, browser golden path and GitHub Actions CI/CD configuration.

The recommended database schema is adapted to JSONB aggregates with generated relational columns. Baseline and request snapshots remain with their analyses. RLS, composite foreign keys and transaction RPCs enforce the financial boundaries. See [implementation plan](docs/implementation-plan.md) and [environment setup](docs/environment-setup.md).

## Live integrations

Set `APP_MODE=live` in `.env.local` and fill the values documented in [environment setup](docs/environment-setup.md). Keep `PAYPAL_ENV=sandbox` for integration testing. Apply every migration in `supabase/migrations/` in order, configure Supabase email redirects, register the seller and set `PAYPAL_SELLER_USER_ID`.

The MVP has one configured issuing PayPal merchant. It does not implement partner seller onboarding. USD, EUR and GBP are supported for PayPal invoicing. IDR is supported for local pricing only. No money is automatically charged; the client approves and completes payment on PayPal. Full refunds are synchronized; partial refunds require review.

External integration success is not implied by local demo or fake-provider tests. Complete the real sandbox smoke test in [CI/CD operation](docs/cicd.md) before production release.

## Validation

```powershell
npm run check
npm run build
npm run test:e2e:install
npm run test:e2e
```

The build needs an explicit `APP_MODE` in production; copying the template provides `demo` locally. CI sets its own demo environment. Tests cover money, state policies, provider parsing, duplicate payments, retry failures, tenant isolation, RLS and SQL transactions. Playwright covers the local golden path and mobile pages.

## Delivery pipeline

[CI](.github/workflows/ci.yml) runs checks and the demo browser workflow on pull requests and main pushes. [Preview](.github/workflows/preview.yml) deploys a successful main commit only after deployment is enabled. [Production release](.github/workflows/release.yml) runs manually on main, rechecks the commit, builds, applies database migrations and deploys through the protected production environment.

Configure repository environments, secrets, branch protection and `ENABLE_DEPLOYMENTS=true` as described in [environment setup](docs/environment-setup.md). Pipeline files alone do not activate hosted deployments.

## Scope and remaining work

P1 features such as PDF/DOCX import, payment reminders, payment intelligence, merchant onboarding and average payment time are deferred. Production operation also needs reviewed legal notices, retention/deletion procedures and operator contact details.

Anti Slop is used in **After** mode as selected by the user. The audit is written after implementation; numbered findings are not silently fixed without the user's selection.
