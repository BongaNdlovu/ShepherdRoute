# ShepardRoute

The follow-up pathway for churches that care.

ShepardRoute is a production-ready MVP for church visitor capture and follow-up. Churches create QR-code events for services, health expos, prophecy seminars, Bible studies, cooking classes, and youth programs. Visitors submit a public form with consent, and the church team tracks assignments, statuses, reports, and WhatsApp follow-up.

## What The App Includes

- Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui-style components
- Supabase Auth for church signup/login
- Supabase Postgres schema with Row Level Security
- Public event registration pages at `/e/[slug]`
- Consent-first visitor intake
- Prayer requests stored in `prayer_requests`, separate from general `contacts`
- Contact dashboard with search, status, and interest filters
- Contact detail page with assignment, status tracking, and WhatsApp message generation
- Team page for adding assignable pastors, elders, Bible workers, health leaders, prayer teams, and youth leaders
- Event dashboard with QR code rendering
- Basic outreach reports
- Owner admin page for product-level workspace summaries
- PWA manifest and service worker for installable app behavior
- `classification_payload` fields prepared for future AI classification without requiring AI in v1

## What The App Needs

1. A Supabase project.
2. Supabase Auth enabled with email/password login.
3. The contents of `supabase/schema.sql` pasted and run in the Supabase SQL editor.
4. Environment variables copied from `.env.example` into `.env.local`.
5. A deployed URL in `NEXT_PUBLIC_SITE_URL` when you deploy to Vercel.
6. For QR code usage, use the QR card on the Dashboard or Event detail page. It can download PNG/SVG, print a QR sheet, copy the link, or preview the public form.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a new Supabase project.
2. Open SQL Editor.
3. Paste the full contents of `supabase/schema.sql` into the editor. Do not type the file path.
4. Click **Run**.
5. In Project Settings, copy the project URL and anon key.
6. Create `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SHEPARDROUTE_SIGNUP_CODE=choose-a-long-private-code
```

7. In Authentication settings, add these redirect URLs:

```text
http://localhost:3000/dashboard
http://127.0.0.1:3000/dashboard
https://your-vercel-domain.vercel.app/dashboard
```

For local testing, open the app at `http://localhost:3000/login`. Avoid switching between `localhost` and `127.0.0.1` in the same session because browsers treat them as different origins.

The signup flow stores `church_name` and `full_name` in Supabase Auth metadata. The database trigger creates the church workspace and admin profile automatically.

Normal new-church signup requires `SHEPARDROUTE_SIGNUP_CODE`. Team invitation signups do not require this code because invite links are already token-protected and tied to the invited email address.

If you tried signing up before running the SQL, run the SQL now. It includes a backfill block that creates missing church profiles for existing auth users.

## Product Owner Admin

After you sign up with your own email, you can make that account a ShepardRoute owner admin.

Open Supabase SQL Editor and run `supabase/make-owner.sql`, replacing `your-email@example.com` with your signup email:

```sql
insert into public.app_admins (user_id)
select id
from auth.users
where email = 'you@example.com'
on conflict (user_id) do nothing;
```

Then open `/admin`. This shows SaaS-level workspace counts without exposing prayer request text.

## WhatsApp Connection

Version 1 uses WhatsApp deep links, so it does not need the WhatsApp Business API.

The app generates a URL like:

```text
https://wa.me/27712345678?text=Your%20message
```

When a team member clicks **Open in WhatsApp**, the browser opens WhatsApp Web or the WhatsApp mobile app with a pre-filled message. The user still reviews and sends the message manually, which is safer for consent and pastoral tone.

For automatic messaging later, ShepardRoute would need:

- A Meta Business account
- A verified WhatsApp Business phone number
- WhatsApp Business Platform access
- Approved message templates for outbound messages
- A server-side message log and opt-out workflow

## Deployment

Deploy to Vercel, set the same environment variables, and update `NEXT_PUBLIC_SITE_URL` to the production domain. The app is Vercel-ready and uses Supabase as the hosted database/auth provider.

After deployment, open **Setup** in the app sidebar to run environment and database health checks.

## Smoke Tests

Run the public page smoke test with:

```bash
npm run test:e2e
```

Authenticated smoke tests are skipped unless these variables are present:

```bash
E2E_EMAIL=admin@example.com
E2E_PASSWORD=your-password
```

Those tests create an event, verify QR actions, submit the public form, and confirm the new contact appears in the dashboard.

## Security Notes

- Dashboard tables are protected by Supabase RLS and scoped to the logged-in user church.
- Public QR forms write through `submit_event_registration`, a narrow security-definer RPC.
- Public users can only see active event metadata exposed through the limited `public_events` view.
- Prayer requests live in their own table with stricter role policies.
- Contact consent is required before public submission succeeds.
