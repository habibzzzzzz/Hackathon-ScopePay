# CI/CD operation

The repository contains the pipeline configuration. A local passing run does not prove a hosted workflow or deployment has run.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to main. Node 24 and the committed npm lockfile make dependencies reproducible. Checks run in this order:

1. ESLint, including inward dependency restrictions for domain/application code.
2. Prettier check.
3. Strict TypeScript.
4. Domain, use-case, provider-contract and PostgreSQL migration/RLS tests.
5. Production dependency audit.
6. Next.js production build.
7. Playwright demo golden path, project setup, tenant isolation, client decisions and responsive routes.

Failed browser runs upload traces and screenshots as GitHub artifacts. No live credentials are needed for CI. Provider tests use fake HTTP responses; the database tests run real PostgreSQL semantics through PGlite with an Auth stub. Run a real Supabase and PayPal sandbox smoke test before releasing a hosted environment.

## Continuous delivery

Preview deploys only after successful CI for a main push from this repository. Production is an explicit workflow dispatch on main and re-runs the same CI workflow before release. Both deploy the tested commit and use GitHub environments. Deploy jobs remain disabled until `ENABLE_DEPLOYMENTS=true` and the required secrets are configured.

The production workflow builds before applying migrations and deploys only if migration application succeeds. GitHub required reviewers, branch protection and separate staging credentials must be configured in repository settings; files cannot enable these settings themselves.

## Rollback

If the application deployment fails, the previously deployed application remains active. In Vercel, promote the previous deployment to restore an application release. Database changes are not automatically reversed: use additive/backward-compatible migrations and a reviewed forward fix. Never roll back financial rows by deleting payment events.

## Integration smoke test

1. Deploy with `APP_MODE=live` and `PAYPAL_ENV=sandbox`.
2. Use the configured seller, set profile/pricing, create a client with a sandbox buyer email and a project baseline.
3. Analyze a request through Gemini and review its evidence and pricing.
4. Create and send a change order; open its token link in a separate browser.
5. Approve, confirm a real sandbox invoice is created, and complete payment with the sandbox buyer.
6. Confirm signature verification, invoice PAID, order PAID and the dashboard amount.
7. Resend the PayPal webhook from its event dashboard; confirm no duplicate payment or activity.

See [environment setup](environment-setup.md) for variables, merchant restriction, webhook subscriptions and supported currencies.
