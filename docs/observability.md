# ShepherdRoute Observability

Version 1 uses Vercel and Supabase logs as the source of truth.

## Vercel

- Open **Vercel > ShepherdRoute > Deployments > latest deployment > Runtime Logs**.
- Match user-facing error digests from ShepherdRoute error screens to server logs.
- Confirm environment variables after every production deployment:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase

- Use **Supabase > Logs > Auth** for login/signup issues.
- Use **Supabase > Logs > Postgres** for RLS, RPC, and schema issues.
- Use **Database > Linter** after schema changes.

## Optional Sentry

Sentry is not installed in v1 to keep the runtime light. When production usage grows, add `@sentry/nextjs` and set a DSN in Vercel to receive client and server error alerts.
