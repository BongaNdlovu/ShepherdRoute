# Supabase Schema Base Setup

This app expects Supabase Auth plus the full database schema in `supabase/schema.sql`.

If you just want the copy-paste SQL, open `docs/supabase-schema-copy-paste.sql`, select all, and paste it into the Supabase SQL Editor.

## Fresh Project Setup

1. Create a Supabase project and enable email/password auth.
2. Open **SQL Editor** in Supabase.
3. Paste the full contents of `docs/supabase-schema-copy-paste.sql`.
4. Run the script once from top to bottom.
5. Copy the project URL and anon key into `.env.local`:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

6. Add auth redirect URLs for local and deployed dashboard routes:

```text
http://localhost:3000/dashboard
http://127.0.0.1:3000/dashboard
https://your-vercel-domain.vercel.app/dashboard
```

## What The Schema Creates

- Extensions: `pgcrypto`, `pg_trgm`
- Core tables: `churches`, `profiles`, `church_memberships`, `app_admins`, `team_members`, `events`, `contacts`
- Ministry tables: `contact_interests`, `follow_ups`, `prayer_requests`, `generated_messages`
- Enum types for roles, event types, interests, follow-up statuses, channels, urgency, and prayer visibility
- RLS policies for authenticated church members, leaders, app admins, and public event access
- Public view: `public_events`
- Auth trigger: `private.handle_new_user`
- Public RPCs:
  - `owner_church_summaries`
  - `search_contacts`
  - `export_contacts`
  - `outreach_report_summary`
  - `event_report_summary`
  - `submit_event_registration`

## Updating An Existing Project

Run the full `supabase/schema.sql` again. The script is written to be idempotent for extensions, types, tables, indexes, triggers, policies, views, and functions.

After applying schema changes:

```bash
npm run db:types
npm run typecheck
npm run build
```

Commit the regenerated `lib/supabase/database.types.ts` if `npm run db:types` changes it.

## Required Post-Setup Check

After deployment, sign in and open **Setup** in the app sidebar. The health page verifies environment variables, Supabase Auth, church membership rows, the contacts search RPC, and the public event view.
