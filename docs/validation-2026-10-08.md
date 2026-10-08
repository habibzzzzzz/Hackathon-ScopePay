# Local validation — 2026-10-08

The local MVP passes the following checks:

- `npm run check`: lint, formatting, strict TypeScript and 28 tests across four test files.
- `npm run test:e2e`: four Chromium scenarios covering the $220 demo flow, manual setup, tenant isolation, mobile routes, public decisions, revocation and keyboard navigation.
- `npm run build`: production build and route generation.
- `npm audit --omit=dev --audit-level=high`: zero production dependency vulnerabilities.
- `git diff --check`: no whitespace errors.

Database tests execute the migrations in PGlite with stubbed Supabase authentication roles. Provider tests use controlled responses. Browser payments are explicitly simulated; these results do not verify hosted Supabase, Gemini or PayPal sandbox integration.

The UI audit measured ten desktop/mobile views without horizontal overflow, text contrast failures or browser page errors. Two findings remain open: small link targets and insufficient input/button border contrast. See [the numbered audit](../anti-slop/audit-001-2026-10-08.md). This is not a complete accessibility certification.

The full dependency audit also reports five high-severity development dependency findings through the ESLint dependency tree. Production dependencies pass; no forced downgrade was applied.

Hosted CI/CD has been configured but has not been executed or deployed from this session. Remaining integration and release work is recorded in [phase status](phase-status.md), with configuration instructions in [environment setup](environment-setup.md) and [CI/CD](cicd.md).
