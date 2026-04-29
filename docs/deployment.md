# Deployment Notes

## GitHub

Use `main` for production. Open pull requests for changes so GitHub Actions can run:

```bash
npm run lint
npm run typecheck
npm run build
```

Required GitHub repository secrets:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Vercel

Set these environment variables in Vercel for Preview and Production:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SHEPARDROUTE_SIGNUP_CODE
```

Use the production domain for `NEXT_PUBLIC_SITE_URL`, for example:

```text
https://shepardroute.com
```

`SHEPARDROUTE_SIGNUP_CODE` is server-only. Do not prefix it with `NEXT_PUBLIC_`. Rotate it in Vercel if it is shared too widely.

In Supabase Auth URL settings, add the Vercel production domain and preview domain pattern you use.

After Vercel redeploys, sign in and open **Setup** from the ShepardRoute sidebar. The health page checks environment variables, Supabase Auth, church membership rows, the contacts search RPC, and the public event view.

## Logs

- Vercel runtime errors: **Vercel > Deployments > latest deployment > Runtime Logs**
- Supabase Auth errors: **Supabase > Logs > Auth**
- Supabase database/RLS errors: **Supabase > Logs > Postgres**
- More detail: `docs/observability.md`

## Performance Watchlist

- Use Vercel Speed Insights after connecting the project.
- Keep `/contacts` paginated. Avoid adding unbounded table reads.
- Keep dashboard and contact pages out of the service worker cache.
- Run `npm run db:types` after schema changes and commit the generated type file.
- Watch Supabase slow query logs once churches have real traffic.
