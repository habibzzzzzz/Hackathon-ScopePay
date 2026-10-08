# Environment and integration setup

Use `.env.local` for real values. `.env.example` is a committed template and must contain placeholders only. Vercel and GitHub secrets hold deployed credentials. Do not paste secrets into PR descriptions or workflow logs.

## Application

| Variable              | Value                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `APP_MODE`            | `demo` for local fixtures; `live` for real integrations, including PayPal sandbox                 |
| `NEXT_PUBLIC_APP_URL` | Exact browser origin, e.g. `http://localhost:3000`; deployed environments need their HTTPS origin |
| `DEMO_DATA_DIR`       | Local demo directory; not used for live persistence                                               |

Demo mode is intended for one local server process. Do not deploy the file-backed demo on Vercel's ephemeral filesystem. Deploy the live adapter with PayPal sandbox for a hosted test environment.

## Supabase

- `NEXT_PUBLIC_SUPABASE_URL`: project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable key or legacy anon key. The existing variable name accepts both formats.
- `SUPABASE_SERVICE_ROLE_KEY`: server secret key or legacy service-role key, never a browser variable.
- Apply all files in `supabase/migrations/` in filename order to the intended project.
- Enable Email authentication. Use email confirmation for live environments.
- Set Auth Site URL to `NEXT_PUBLIC_APP_URL`; allow `${NEXT_PUBLIC_APP_URL}/auth/callback` in redirect URLs.
- Register the freelancer, confirm email, then complete profile and pricing settings.

The migration embeds baseline and request snapshots in JSONB aggregates. Generated columns, composite foreign keys, RLS and transaction functions enforce ownership and financial relationships. Optional document storage and normalized scope-item/milestone tables are deferred until import and milestone workflows exist.

## Gemini

- `AI_API_KEY`: Gemini API key, server only.
- `AI_MODEL`: a Generate Content model supporting structured JSON output; default `gemini-2.5-flash`.
- Enable the provider project/API and applicable quota/billing. The adapter never supplies a fallback fabricated assessment when the live API fails.

## PayPal

- `PAYPAL_ENV=sandbox` uses test accounts. `live` uses the real PayPal environment.
- `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` must belong to the same REST app and environment as the invoice merchant and webhook.
- `PAYPAL_MERCHANT_EMAIL`: email of the issuing Business merchant in that environment, not the client's payer email.
- `PAYPAL_SELLER_USER_ID`: UUID from Supabase Authentication > Users for that freelancer. Set this after registering the seller; invoicing is blocked until it matches that user. The MVP restricts invoices to this one seller; multi-merchant partner onboarding is P1.
- Create the webhook in that REST app with URL `https://YOUR_DOMAIN/api/webhooks/paypal` and copy its ID into `PAYPAL_WEBHOOK_ID`.
- Subscribe to `INVOICING.INVOICE.PAID`, `INVOICING.INVOICE.REFUNDED`, `INVOICING.INVOICE.CANCELLED`, and `INVOICING.INVOICE.UPDATED`.
- For local webhook testing, use an HTTPS tunnel to the local server. Open the UI through the same configured origin or use a deployed sandbox environment.
- Use a separate sandbox Personal payer account for client payment. USD/EUR/GBP are supported by this adapter; IDR can be used for local pricing but is blocked for PayPal invoice creation.

The webhook verifies the signature and re-reads the invoice from PayPal before reconciling. Partial payments stay partial; a PAID event must match currency and the full invoice amount. Full refunds are reconciled. Partial refunds need review and are not silently reclassified as unpaid invoices.

## CI/CD

GitHub repository variable: `ENABLE_DEPLOYMENTS=true` to enable the deployment jobs.

Create `preview` and `production` GitHub environments. Add these secrets to each:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Production additionally requires `SUPABASE_DB_URL`, a PostgreSQL connection URL for the target database. This is separate from the Supabase project HTTP URL and service key. Keep preview and production Supabase/PayPal/AI environments separate. Apply the migration to preview before its first deployment.

Configure the application variables above in the corresponding Vercel environments. Preview needs a stable origin matching `NEXT_PUBLIC_APP_URL`. Disable duplicate Vercel Git auto-deployments if GitHub Actions is the release authority.

CI verifies changes. A successful main push can deploy preview. Production uses the manual **Release production** workflow on main, re-runs CI, builds, applies versioned database migrations, then deploys the same commit. Configure required reviewers on the production environment and require CI on main. Migration changes must remain backward compatible because the previous application runs until deployment completes.

## Provider references

- [Supabase SSR clients and identity verification](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
- [PayPal invoicing reference](https://developer.paypal.com/invoicing/reference/)
- [PayPal webhook verification](https://developer.paypal.com/api/webhooks/v1/)
- [PayPal currencies](https://developer.paypal.com/api/codes/currency/)
