# Authentication and approval-link validation — 2026-10-09

The approval-link failure was traced to the repository decoder replacing the JSON snapshot's `createdAt` with PostgREST's differently formatted `created_at`. A read-only hosted check confirmed equal timestamp instants but different strings on a draft. The decoder now preserves the immutable snapshot timestamp. No hosted order status or financial values were changed during diagnosis.

Local validation:

- 48 Vitest tests pass, including callback success/failure, canonical origin validation, registration/resend provider contracts and the PostgreSQL approval-link timestamp regression. The regression also checks that changing the amount is still rejected.
- Six demo browser scenarios pass, including pending submission recovery, root callback forwarding and the existing financial golden path.
- Two authentication browser scenarios pass using fake live-mode credentials and intercepted HTTP responses, covering login, registration, resend and mobile layout.
- Strict TypeScript and lint pass. Production build uses explicit demo configuration, as in CI; it does not certify live provider behavior.

CI now runs the separate `npm run test:auth-ui` suite after the demo browser suite. `.gitattributes` keeps source line endings consistent across Windows and Linux formatting checks.

Supabase hosted email verification still requires Site URL and the callback allowlist to match the deployment. The cross-browser confirmation template is in `supabase/templates/confirmation.html`; copy it into the hosted Confirm signup email template. See [environment setup](environment-setup.md). Management access was not available in this session, so those dashboard settings have not been changed or verified.

The scoped [Anti Slop follow-up](../anti-slop/audit-002-2026-10-09.md) retains the two existing open findings. Live authentication/email and PayPal sandbox flows remain integration checks to perform after deployment.
