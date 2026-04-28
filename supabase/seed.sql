-- Optional demo data for a local Supabase database.
-- This creates sample events only. Signups still create real church workspaces.

insert into public.churches (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Pinetown SDA Church')
on conflict do nothing;

insert into public.events (church_id, name, event_type, starts_on, location, slug, description)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Pinetown SDA Health Expo',
    'health_expo',
    '2026-05-10',
    'Pinetown Community Hall',
    'pinetown-health-expo',
    'Community health screening and lifestyle follow-up pathway.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Prophecy Seminar Night 1',
    'prophecy_seminar',
    '2026-05-17',
    'Pinetown SDA Church',
    'prophecy-night-1',
    'First-night registration for Bible study and pastoral follow-up.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Visitor Sabbath',
    'visitor_sabbath',
    null,
    'Pinetown SDA Church',
    'visitor-sabbath',
    'Weekly visitor care and connection card.'
  )
on conflict (slug) do nothing;
