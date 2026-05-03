create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

do $$ begin
  create type public.team_role as enum (
    'admin',
    'pastor',
    'elder',
    'bible_worker',
    'health_leader',
    'prayer_team',
    'youth_leader',
    'viewer'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_status as enum ('active', 'invited', 'disabled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.team_invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_admin_role as enum ('owner', 'support_admin', 'billing_admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.event_type as enum (
    'sabbath_visitor',
    'church_service',
    'health_expo',
    'evangelistic_campaign',
    'prophecy_seminar',
    'bible_study',
    'visitor_sabbath',
    'youth_event',
    'cooking_class',
    'prayer_campaign',
    'regular_member',
    'baptized_member',
    'health_seminar',
    'custom',
    'community_outreach',
    'other'
  );
exception when duplicate_object then null;
end $$;

alter type public.event_type add value if not exists 'sabbath_visitor';
alter type public.event_type add value if not exists 'evangelistic_campaign';
alter type public.event_type add value if not exists 'prayer_campaign';
alter type public.event_type add value if not exists 'regular_member';
alter type public.event_type add value if not exists 'baptized_member';
alter type public.event_type add value if not exists 'health_seminar';
alter type public.event_type add value if not exists 'custom';

do $$ begin
  create type public.interest_tag as enum (
    'prayer',
    'bible_study',
    'health',
    'baptism',
    'pastoral_visit',
    'youth',
    'cooking_class'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.event_assignment_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.follow_up_status as enum (
    'new',
    'assigned',
    'contacted',
    'waiting',
    'interested',
    'bible_study_started',
    'attended_church',
    'baptism_interest',
    'closed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.follow_up_channel as enum ('call', 'whatsapp', 'sms', 'email', 'visit', 'note');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_channel as enum ('whatsapp', 'sms', 'email');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.urgency_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.prayer_visibility as enum (
    'general_prayer',
    'pastor_only',
    'private_contact',
    'family_support',
    'sensitive',
    'health_related',
    'pastoral_prayer',
    'pastors_only'
  );
exception when duplicate_object then null;
end $$;

alter type public.prayer_visibility add value if not exists 'general_prayer';
alter type public.prayer_visibility add value if not exists 'pastor_only';
alter type public.prayer_visibility add value if not exists 'private_contact';
alter type public.prayer_visibility add value if not exists 'family_support';
alter type public.prayer_visibility add value if not exists 'sensitive';
alter type public.prayer_visibility add value if not exists 'health_related';
alter type public.prayer_visibility add value if not exists 'pastoral_prayer';
alter type public.prayer_visibility add value if not exists 'pastors_only';

create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Africa/Johannesburg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.churches
  add column if not exists onboarding_dismissed_at timestamptz;

comment on column public.churches.onboarding_dismissed_at is 'When a church member dismissed the onboarding guidance banner';

alter table if exists public.churches
  add column if not exists workspace_type text not null default 'church',
  add column if not exists workspace_status text not null default 'active',
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_changed_by uuid references auth.users(id) on delete set null,
  add column if not exists status_change_reason text;

alter table if exists public.churches
  drop constraint if exists churches_workspace_type_check;

alter table if exists public.churches
  add constraint churches_workspace_type_check
  check (workspace_type in ('church', 'ministry'));

alter table if exists public.churches
  drop constraint if exists churches_workspace_status_check;

alter table if exists public.churches
  add constraint churches_workspace_status_check
  check (workspace_status in ('active', 'inactive'));

comment on column public.churches.workspace_type is 'Whether this workspace represents a church or ministry';
comment on column public.churches.workspace_status is 'Whether this workspace is active or inactive';
comment on column public.churches.status_changed_at is 'When the workspace status last changed';
comment on column public.churches.status_changed_by is 'Owner/admin user who last changed the workspace status';
comment on column public.churches.status_change_reason is 'Optional owner/admin reason for status change';

drop function if exists public.dismiss_onboarding_guide(uuid);

create or replace function public.dismiss_onboarding_guide(p_church_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Login is required.';
  end if;

  if not exists (
    select 1
    from public.church_memberships
    where church_memberships.church_id = p_church_id
      and church_memberships.user_id = auth.uid()
      and church_memberships.status = 'active'
  ) then
    raise exception 'You are not allowed to dismiss onboarding for this church.';
  end if;

  update public.churches
  set onboarding_dismissed_at = coalesce(onboarding_dismissed_at, now())
  where id = p_church_id;
end;
$$;

revoke all on function public.dismiss_onboarding_guide(uuid) from public;
grant execute on function public.dismiss_onboarding_guide(uuid) to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  avatar_url text,
  phone text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles
  add column if not exists phone text,
  add column if not exists preferences jsonb not null default '{}'::jsonb;

create table if not exists public.church_memberships (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.team_role not null default 'admin',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, user_id)
);

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_admin_role not null default 'owner',
  is_protected_owner boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.app_admins
  add column if not exists role public.app_admin_role not null default 'owner',
  add column if not exists is_protected_owner boolean not null default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

with first_owner as (
  select user_id
  from public.app_admins
  order by created_at asc
  limit 1
)
update public.app_admins
set role = 'owner',
    is_protected_owner = true,
    updated_at = now()
where user_id in (select user_id from first_owner)
  and not exists (
    select 1
    from public.app_admins
    where is_protected_owner = true
  );

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  membership_id uuid references public.church_memberships(id) on delete set null,
  display_name text not null,
  role public.team_role not null default 'viewer',
  app_role text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.team_members
  add column if not exists app_role text;

update public.team_members
set app_role = case
  when role = 'admin' then 'admin'
  when role in ('pastor', 'elder') then 'coordinator'
  else 'viewer'
end
where app_role is null;

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  team_member_id uuid references public.team_members(id) on delete set null,
  email text not null,
  normalized_email text not null,
  display_name text not null,
  role public.team_role not null default 'viewer',
  token_hash text not null unique,
  status public.team_invitation_status not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  event_type public.event_type not null default 'other',
  starts_on date,
  location text,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events
  add column if not exists archived_at timestamptz;

alter table public.events
  add column if not exists form_config jsonb not null default '{}'::jsonb,
  add column if not exists branding_config jsonb not null default '{}'::jsonb,
  add column if not exists public_info jsonb not null default '{}'::jsonb;

create table if not exists public.event_assignments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  team_member_id uuid references public.team_members(id) on delete set null,
  invitee_email text,
  invitation_token_hash text,
  invitation_expires_at timestamptz,
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  status public.event_assignment_status not null default 'pending',
  can_view_contacts boolean not null default false,
  can_assign_contacts boolean not null default false,
  can_view_reports boolean not null default false,
  can_export_reports boolean not null default false,
  can_edit_event_settings boolean not null default false,
  can_manage_event_team boolean not null default false,
  can_view_prayer_requests boolean not null default false,
  can_delete_event boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_assignments_exactly_one_identifier check (team_member_id is not null or invitee_email is not null),
  constraint event_assignments_email_lowercase check (invitee_email is null or invitee_email = lower(invitee_email))
);

create index if not exists event_assignments_event_idx on public.event_assignments(event_id);
create index if not exists event_assignments_team_member_idx on public.event_assignments(team_member_id) where team_member_id is not null;
create index if not exists event_assignments_invitee_email_idx on public.event_assignments(invitee_email) where invitee_email is not null;
create index if not exists event_assignments_church_idx on public.event_assignments(church_id);
create index if not exists event_assignments_status_idx on public.event_assignments(status);
create index if not exists event_assignments_token_hash_idx on public.event_assignments(invitation_token_hash) where invitation_token_hash is not null;

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  full_name text not null,
  normalized_name text,
  phone text,
  normalized_phone text,
  whatsapp_number text,
  normalized_whatsapp text,
  email text,
  normalized_email text,
  area text,
  normalized_area text,
  do_not_contact boolean not null default false,
  do_not_contact_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  event_id uuid references public.events(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  whatsapp_number text,
  normalized_name text,
  normalized_phone text,
  normalized_whatsapp text,
  normalized_email text,
  normalized_area text,
  area text,
  language text default 'English',
  best_time_to_contact text,
  status public.follow_up_status not null default 'new',
  urgency public.urgency_level not null default 'medium',
  assigned_to uuid references public.team_members(id) on delete set null,
  assigned_handling_role text,
  recommended_assigned_role text,
  consent_given boolean not null default false,
  consent_at timestamptz,
  consent_source text,
  consent_scope text[] not null default array[]::text[],
  preferred_contact_methods text[] not null default array[]::text[],
  do_not_contact boolean not null default false,
  do_not_contact_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  duplicate_of_contact_id uuid references public.contacts(id) on delete set null,
  duplicate_match_confidence numeric(4,3),
  duplicate_match_reason text,
  source text not null default 'public_form',
  classification_payload jsonb not null default '{"ready_for_ai": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.contacts
  add column if not exists best_time_to_contact text;
alter table if exists public.contacts
  add column if not exists person_id uuid references public.people(id) on delete set null,
  add column if not exists whatsapp_number text,
  add column if not exists normalized_name text,
  add column if not exists normalized_phone text,
  add column if not exists normalized_whatsapp text,
  add column if not exists normalized_email text,
  add column if not exists normalized_area text,
  add column if not exists consent_source text,
  add column if not exists consent_scope text[] not null default array[]::text[],
  add column if not exists preferred_contact_methods text[] not null default array[]::text[],
  add column if not exists assigned_handling_role text,
  add column if not exists recommended_assigned_role text,
  add column if not exists do_not_contact boolean not null default false,
  add column if not exists do_not_contact_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists duplicate_of_contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists duplicate_match_confidence numeric(4,3),
  add column if not exists duplicate_match_reason text;

create table if not exists public.contact_interests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  interest public.interest_tag not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contact_id, interest)
);

create table if not exists public.contact_journey_events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  event_type public.event_type,
  title text not null,
  summary text,
  selected_interests public.interest_tag[] not null default array[]::public.interest_tag[],
  classification_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  assigned_to uuid references public.team_members(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  channel public.follow_up_channel not null default 'note',
  status public.follow_up_status not null default 'contacted',
  notes text,
  next_action text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  request_text text not null,
  visibility public.prayer_visibility not null default 'general_prayer',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_messages (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  generated_by uuid references public.profiles(id) on delete set null,
  channel public.message_channel not null default 'whatsapp',
  message_text text not null,
  wa_link text,
  prompt_version text not null default 'v1_manual',
  purpose text not null default 'manual',
  approved_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.generated_messages
  add column if not exists purpose text not null default 'manual',
  add column if not exists approved_at timestamptz,
  add column if not exists opened_at timestamptz;

create index if not exists church_memberships_user_idx on public.church_memberships(user_id, status);
create index if not exists church_memberships_church_idx on public.church_memberships(church_id, role, status);
create index if not exists app_admins_role_idx on public.app_admins(role, is_protected_owner);
create index if not exists team_members_church_active_idx on public.team_members(church_id, is_active);
create index if not exists team_invitations_church_status_idx on public.team_invitations(church_id, status, created_at desc);
create index if not exists team_invitations_email_status_idx on public.team_invitations(normalized_email, status);
create index if not exists team_invitations_team_member_idx on public.team_invitations(team_member_id);
create index if not exists audit_logs_church_created_idx on public.audit_logs(church_id, created_at desc);
create index if not exists audit_logs_target_idx on public.audit_logs(target_type, target_id, created_at desc);
create index if not exists events_church_idx on public.events(church_id, starts_on desc);
create index if not exists events_slug_idx on public.events(slug);
create index if not exists people_church_phone_idx on public.people(church_id, normalized_phone) where normalized_phone is not null;
create index if not exists people_church_whatsapp_idx on public.people(church_id, normalized_whatsapp) where normalized_whatsapp is not null;
create index if not exists people_church_email_idx on public.people(church_id, normalized_email) where normalized_email is not null;
create index if not exists people_church_name_trgm_idx on public.people using gin (normalized_name gin_trgm_ops);
create index if not exists people_church_area_idx on public.people(church_id, normalized_area);
create index if not exists people_church_contact_flags_idx on public.people(church_id, do_not_contact, archived_at, deleted_at);
create index if not exists contacts_church_status_idx on public.contacts(church_id, status);
create index if not exists contacts_church_event_idx on public.contacts(church_id, event_id);
create index if not exists contacts_church_assigned_idx on public.contacts(church_id, assigned_to);
create index if not exists contacts_church_due_flags_idx on public.contacts(church_id, assigned_to, status, urgency);
create index if not exists contacts_church_person_idx on public.contacts(church_id, person_id);
create index if not exists contacts_church_phone_norm_idx on public.contacts(church_id, normalized_phone) where normalized_phone is not null;
create index if not exists contacts_church_whatsapp_norm_idx on public.contacts(church_id, normalized_whatsapp) where normalized_whatsapp is not null;
create index if not exists contacts_church_email_norm_idx on public.contacts(church_id, normalized_email) where normalized_email is not null;
create index if not exists contacts_church_created_at_idx on public.contacts(church_id, created_at desc);
create index if not exists contacts_full_name_trgm_idx on public.contacts using gin (full_name gin_trgm_ops);
create index if not exists contacts_normalized_name_trgm_idx on public.contacts using gin (normalized_name gin_trgm_ops);
create index if not exists contacts_phone_trgm_idx on public.contacts using gin (phone gin_trgm_ops);
create index if not exists contacts_area_trgm_idx on public.contacts using gin (area gin_trgm_ops);
create index if not exists contact_interests_church_interest_idx on public.contact_interests(church_id, interest);
create index if not exists follow_ups_contact_idx on public.follow_ups(contact_id, created_at desc);
create index if not exists follow_ups_church_due_idx on public.follow_ups(church_id, due_at) where completed_at is null;
create index if not exists follow_ups_church_status_idx on public.follow_ups(church_id, status, completed_at);
create index if not exists follow_ups_church_queue_idx
on public.follow_ups(church_id, completed_at, due_at, status, assigned_to);
create index if not exists follow_ups_church_assigned_due_idx
on public.follow_ups(church_id, assigned_to, due_at)
where completed_at is null;
create index if not exists prayer_requests_contact_idx on public.prayer_requests(contact_id, created_at desc);
create index if not exists prayer_requests_visibility_idx on public.prayer_requests(church_id, visibility);
create index if not exists generated_messages_contact_idx on public.generated_messages(contact_id, created_at desc);
create index if not exists generated_messages_suggested_queue_idx
on public.generated_messages(church_id, contact_id, created_at desc)
where purpose = 'suggested_whatsapp';
create unique index if not exists generated_messages_one_suggestion_per_contact_idx
on public.generated_messages(contact_id)
where purpose = 'suggested_whatsapp';
create index if not exists journey_person_created_idx on public.contact_journey_events(person_id, created_at desc);
create index if not exists journey_church_event_idx on public.contact_journey_events(church_id, event_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.normalize_contact_text(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9]+', ' ', 'g'), '');
$$;

create or replace function private.normalize_phone(input text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  digits text := regexp_replace(coalesce(input, ''), '[^0-9]+', '', 'g');
begin
  if digits = '' then
    return null;
  end if;

  if length(digits) = 10 and left(digits, 1) = '0' then
    return '27' || substring(digits from 2);
  end if;

  return digits;
end;
$$;

create or replace function private.default_follow_up_due_at(
  p_urgency public.urgency_level,
  p_classification_payload jsonb default '{}'::jsonb
)
returns timestamptz
language sql
stable
set search_path = public
as $$
  select case
    when p_urgency = 'high' then now() + interval '8 hours'
    when coalesce(p_classification_payload->>'recommended_assigned_role', '') = 'pastor' then now() + interval '1 day'
    when coalesce(p_classification_payload->'recommended_tags', '[]'::jsonb) ?| array['bible_study','prayer','baptism'] then now() + interval '2 days'
    else now() + interval '5 days'
  end;
$$;

create or replace function private.hash_invite_token(input text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(coalesce(input, ''), 'sha256'), 'hex');
$$;

create or replace function private.accept_team_invitation_for_user(
  p_token text,
  p_user_id uuid,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invitation public.team_invitations%rowtype;
  target_membership_id uuid;
  normalized_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
begin
  if p_user_id is null then
    raise exception 'Login is required before accepting this invitation.';
  end if;

  select *
  into target_invitation
  from public.team_invitations
  where token_hash = private.hash_invite_token(p_token)
    and status = 'pending'
  limit 1;

  if target_invitation.id is null then
    raise exception 'This invitation is invalid or has already been used.';
  end if;

  if target_invitation.expires_at <= now() then
    update public.team_invitations
    set status = 'expired',
        updated_at = now()
    where id = target_invitation.id;

    raise exception 'This invitation has expired.';
  end if;

  if normalized_email is null or normalized_email <> target_invitation.normalized_email then
    raise exception 'Use the invited email address to accept this invitation.';
  end if;

  insert into public.profiles (id, full_name, email)
  values (p_user_id, target_invitation.display_name, target_invitation.email)
  on conflict (id) do update
  set full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
      email = coalesce(public.profiles.email, excluded.email),
      updated_at = now();

  insert into public.church_memberships (church_id, user_id, role, status)
  values (target_invitation.church_id, p_user_id, target_invitation.role, 'active')
  on conflict (church_id, user_id) do update
  set role = excluded.role,
      status = 'active',
      updated_at = now()
  returning id into target_membership_id;

  update public.team_members
  set membership_id = target_membership_id,
      display_name = coalesce(nullif(display_name, ''), target_invitation.display_name),
      role = target_invitation.role,
      email = target_invitation.email,
      is_active = true,
      updated_at = now()
  where id = target_invitation.team_member_id;

  update public.team_invitations
  set status = 'accepted',
      accepted_by = p_user_id,
      accepted_at = now(),
      updated_at = now()
  where id = target_invitation.id;

  insert into public.audit_logs (
    church_id,
    actor_user_id,
    target_type,
    target_id,
    action,
    metadata
  )
  values (
    target_invitation.church_id,
    p_user_id,
    'team_invitation',
    target_invitation.id,
    'invitation.accepted',
    jsonb_build_object(
      'email', target_invitation.email,
      'role', target_invitation.role,
      'teamMemberId', target_invitation.team_member_id
    )
  );

  return target_invitation.church_id;
end;
$$;

create or replace function private.prepare_contact_identity()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched_person public.people%rowtype;
  latest_contact_id uuid;
  match_reason text;
  match_confidence numeric(4,3) := 0;
begin
  new.whatsapp_number := coalesce(nullif(new.whatsapp_number, ''), new.phone);
  new.normalized_name := private.normalize_contact_text(new.full_name);
  new.normalized_phone := private.normalize_phone(new.phone);
  new.normalized_whatsapp := private.normalize_phone(new.whatsapp_number);
  new.normalized_email := nullif(lower(trim(coalesce(new.email, ''))), '');
  new.normalized_area := private.normalize_contact_text(new.area);

  if new.consent_given and new.consent_at is null then
    new.consent_at := now();
  end if;

  if new.consent_source is null then
    new.consent_source := new.source;
  end if;

  if new.consent_scope is null or coalesce(array_length(new.consent_scope, 1), 0) = 0 then
    new.consent_scope := array['follow_up']::text[];
  end if;

  if new.person_id is null then
    select *
    into matched_person
    from public.people
    where people.church_id = new.church_id
      and people.deleted_at is null
      and (
        (new.normalized_phone is not null and people.normalized_phone = new.normalized_phone)
        or (new.normalized_whatsapp is not null and people.normalized_whatsapp = new.normalized_whatsapp)
        or (new.normalized_email is not null and people.normalized_email = new.normalized_email)
      )
    order by people.updated_at desc
    limit 1;

    if matched_person.id is not null then
      match_reason := 'Exact phone, WhatsApp, or email match';
      match_confidence := 1.000;
    elsif new.normalized_name is not null then
      select *
      into matched_person
      from public.people
      where people.church_id = new.church_id
        and people.deleted_at is null
        and people.normalized_name is not null
        and similarity(people.normalized_name, new.normalized_name) >= 0.72
        and (
          new.normalized_area is null
          or people.normalized_area is null
          or people.normalized_area = new.normalized_area
          or similarity(people.normalized_area, new.normalized_area) >= 0.65
        )
      order by similarity(people.normalized_name, new.normalized_name) desc, people.updated_at desc
      limit 1;

      if matched_person.id is not null then
        match_reason := 'Similar name and area match';
        match_confidence := greatest(0.720, similarity(matched_person.normalized_name, new.normalized_name))::numeric(4,3);
      end if;
    end if;

    if matched_person.id is null then
      insert into public.people (
        church_id,
        full_name,
        normalized_name,
        phone,
        normalized_phone,
        whatsapp_number,
        normalized_whatsapp,
        email,
        normalized_email,
        area,
        normalized_area,
        do_not_contact,
        do_not_contact_at
      )
      values (
        new.church_id,
        new.full_name,
        new.normalized_name,
        new.phone,
        new.normalized_phone,
        new.whatsapp_number,
        new.normalized_whatsapp,
        new.email,
        new.normalized_email,
        new.area,
        new.normalized_area,
        new.do_not_contact,
        new.do_not_contact_at
      )
      returning * into matched_person;
    else
      update public.people
      set full_name = coalesce(nullif(new.full_name, ''), people.full_name),
          normalized_name = coalesce(new.normalized_name, people.normalized_name),
          phone = coalesce(nullif(new.phone, ''), people.phone),
          normalized_phone = coalesce(new.normalized_phone, people.normalized_phone),
          whatsapp_number = coalesce(nullif(new.whatsapp_number, ''), people.whatsapp_number),
          normalized_whatsapp = coalesce(new.normalized_whatsapp, people.normalized_whatsapp),
          email = coalesce(nullif(new.email, ''), people.email),
          normalized_email = coalesce(new.normalized_email, people.normalized_email),
          area = coalesce(nullif(new.area, ''), people.area),
          normalized_area = coalesce(new.normalized_area, people.normalized_area),
          do_not_contact = people.do_not_contact or new.do_not_contact,
          do_not_contact_at = coalesce(people.do_not_contact_at, new.do_not_contact_at),
          updated_at = now()
      where people.id = matched_person.id
      returning * into matched_person;
    end if;

    new.person_id := matched_person.id;
  end if;

  if new.do_not_contact then
    update public.people
    set do_not_contact = true,
        do_not_contact_at = coalesce(do_not_contact_at, now()),
        updated_at = now()
    where id = new.person_id;
  end if;

  select contacts.id
  into latest_contact_id
  from public.contacts
  where contacts.church_id = new.church_id
    and contacts.person_id = new.person_id
    and contacts.id is distinct from new.id
  order by contacts.created_at desc
  limit 1;

  if latest_contact_id is not null and new.duplicate_of_contact_id is null then
    new.duplicate_of_contact_id := latest_contact_id;
    new.duplicate_match_confidence := coalesce(match_confidence, 0.900);
    new.duplicate_match_reason := coalesce(match_reason, 'Existing person journey match');
  end if;

  return new;
end;
$$;

drop trigger if exists churches_touch_updated_at on public.churches;
create trigger churches_touch_updated_at before update on public.churches for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();

drop trigger if exists memberships_touch_updated_at on public.church_memberships;
create trigger memberships_touch_updated_at before update on public.church_memberships for each row execute function public.touch_updated_at();

drop trigger if exists app_admins_touch_updated_at on public.app_admins;
create trigger app_admins_touch_updated_at before update on public.app_admins for each row execute function public.touch_updated_at();

drop trigger if exists team_members_touch_updated_at on public.team_members;
create trigger team_members_touch_updated_at before update on public.team_members for each row execute function public.touch_updated_at();

drop trigger if exists team_invitations_touch_updated_at on public.team_invitations;
create trigger team_invitations_touch_updated_at before update on public.team_invitations for each row execute function public.touch_updated_at();

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at before update on public.events for each row execute function public.touch_updated_at();

drop trigger if exists contacts_touch_updated_at on public.contacts;
create trigger contacts_touch_updated_at before update on public.contacts for each row execute function public.touch_updated_at();

drop trigger if exists contacts_prepare_identity on public.contacts;
create trigger contacts_prepare_identity before insert or update on public.contacts for each row execute function private.prepare_contact_identity();

drop trigger if exists contact_interests_touch_updated_at on public.contact_interests;
create trigger contact_interests_touch_updated_at before update on public.contact_interests for each row execute function public.touch_updated_at();

drop trigger if exists people_touch_updated_at on public.people;
create trigger people_touch_updated_at before update on public.people for each row execute function public.touch_updated_at();

drop trigger if exists contact_journey_events_touch_updated_at on public.contact_journey_events;
create trigger contact_journey_events_touch_updated_at before update on public.contact_journey_events for each row execute function public.touch_updated_at();

drop trigger if exists follow_ups_touch_updated_at on public.follow_ups;
create trigger follow_ups_touch_updated_at before update on public.follow_ups for each row execute function public.touch_updated_at();

drop trigger if exists prayer_requests_touch_updated_at on public.prayer_requests;
create trigger prayer_requests_touch_updated_at before update on public.prayer_requests for each row execute function public.touch_updated_at();

drop trigger if exists generated_messages_touch_updated_at on public.generated_messages;
create trigger generated_messages_touch_updated_at before update on public.generated_messages for each row execute function public.touch_updated_at();

drop trigger if exists event_assignments_touch_updated_at on public.event_assignments;
create trigger event_assignments_touch_updated_at before update on public.event_assignments for each row execute function public.touch_updated_at();

create or replace function public.validate_event_assignment_church_scope()
returns trigger as $$
declare
  event_church_id uuid;
  member_church_id uuid;
begin
  select e.church_id
  into event_church_id
  from public.events e
  where e.id = new.event_id;

  if event_church_id is null then
    raise exception 'Invalid event_id for event assignment';
  end if;

  if event_church_id <> new.church_id then
    raise exception 'event_id does not belong to church_id';
  end if;

  if new.team_member_id is not null then
    select tm.church_id
    into member_church_id
    from public.team_members tm
    where tm.id = new.team_member_id;

    if member_church_id is null then
      raise exception 'Invalid team_member_id for event assignment';
    end if;

    if member_church_id <> new.church_id then
      raise exception 'team_member_id does not belong to church_id';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists validate_event_assignment_church_scope_trigger on public.event_assignments;
create trigger validate_event_assignment_church_scope_trigger
before insert or update on public.event_assignments
for each row execute function public.validate_event_assignment_church_scope();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_church_id uuid;
  new_membership_id uuid;
  church_name text;
  full_name text;
  invite_token text;
  workspace_type text;
begin
  church_name := coalesce(new.raw_user_meta_data->>'church_name', 'New church');
  full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Church admin');
  invite_token := nullif(new.raw_user_meta_data->>'invite_token', '');
  workspace_type := coalesce(new.raw_user_meta_data->>'workspace_type', 'church');

  insert into public.profiles (id, full_name, email)
  values (new.id, full_name, new.email)
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email;

  if invite_token is not null then
    perform private.accept_team_invitation_for_user(invite_token, new.id, new.email);
    return new;
  end if;

  insert into public.churches (name, workspace_type)
  values (church_name, workspace_type)
  returning id into new_church_id;

  insert into public.church_memberships (church_id, user_id, role, status)
  values (new_church_id, new.id, 'admin', 'active')
  returning id into new_membership_id;

  insert into public.team_members (church_id, membership_id, display_name, role, email)
  values (new_church_id, new_membership_id, full_name, 'admin', new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop function if exists public.handle_new_user();
revoke all on function private.handle_new_user() from public, anon, authenticated;

do $$
declare
  user_record record;
  new_church_id uuid;
  new_membership_id uuid;
begin
  for user_record in
    select auth_user.id, auth_user.email, auth_user.raw_user_meta_data
    from auth.users as auth_user
    where not exists (
      select 1 from public.church_memberships where church_memberships.user_id = auth_user.id
    )
  loop
    insert into public.profiles (id, full_name, email)
    values (
      user_record.id,
      coalesce(user_record.raw_user_meta_data->>'full_name', user_record.email, 'Church admin'),
      user_record.email
    )
    on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email;

    insert into public.churches (name)
    values (coalesce(user_record.raw_user_meta_data->>'church_name', 'New church'))
    returning id into new_church_id;

    insert into public.church_memberships (church_id, user_id, role, status)
    values (new_church_id, user_record.id, 'admin', 'active')
    returning id into new_membership_id;

    insert into public.team_members (church_id, membership_id, display_name, role, email)
    values (
      new_church_id,
      new_membership_id,
      coalesce(user_record.raw_user_meta_data->>'full_name', user_record.email, 'Church admin'),
      'admin',
      user_record.email
    );
  end loop;
end;
$$;

create or replace function private.is_church_member(target_church_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.church_memberships
    where church_id = target_church_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins
    where user_id = auth.uid()
  );
$$;

create or replace function private.is_app_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
      and (
        role = 'owner'
        or is_protected_owner = true
      )
  );
$$;

create or replace function private.has_church_role(target_church_id uuid, allowed_roles public.team_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.church_memberships
    where church_id = target_church_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.current_user_can_manage_event_assignments(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    left join public.church_memberships cm on cm.user_id = auth.uid()
    left join public.team_members tm
      on tm.membership_id = cm.id
     and tm.church_id = e.church_id
    left join public.app_admins aa on aa.user_id = auth.uid()
    where e.id = target_event_id
      and cm.status = 'active'
      and (
        aa.role in ('owner', 'support_admin')
        or tm.role in ('admin', 'pastor')
      )
  );
$$;

create or replace function public.current_user_team_member_id_for_event(target_event_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select tm.id
  from public.events e
  join public.church_memberships cm on cm.user_id = auth.uid()
  join public.team_members tm
    on tm.membership_id = cm.id
   and tm.church_id = e.church_id
  where e.id = target_event_id
  limit 1;
$$;

create or replace function private.require_app_admin(
  p_allowed_roles public.app_admin_role[] default array['owner','support_admin']::public.app_admin_role[]
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Login is required.';
  end if;

  if not exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
      and role = any(p_allowed_roles)
  ) then
    raise exception 'Owner/admin access required.';
  end if;
end;
$$;

create or replace function private.require_protected_owner()
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Login is required.';
  end if;

  if not exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
      and role = 'owner'
      and is_protected_owner = true
  ) then
    raise exception 'Protected owner access required.';
  end if;
end;
$$;

revoke all on function private.is_church_member(uuid) from public, anon, authenticated;
revoke all on function private.is_app_admin() from public, anon, authenticated;
revoke all on function private.is_app_owner() from public, anon, authenticated;
revoke all on function private.has_church_role(uuid, public.team_role[]) from public, anon, authenticated;
revoke all on function public.current_user_can_manage_event_assignments(uuid) from public, anon, authenticated;
revoke all on function public.current_user_team_member_id_for_event(uuid) from public, anon, authenticated;
revoke all on function private.hash_invite_token(text) from public, anon, authenticated;
revoke all on function private.accept_team_invitation_for_user(text, uuid, text) from public, anon, authenticated;
revoke all on function private.require_app_admin(public.app_admin_role[]) from public;
revoke all on function private.require_protected_owner() from public;
grant execute on function private.is_church_member(uuid) to anon, authenticated;
grant execute on function private.is_app_admin() to anon, authenticated;
grant execute on function private.is_app_owner() to anon, authenticated;
grant execute on function private.has_church_role(uuid, public.team_role[]) to anon, authenticated;
grant execute on function public.current_user_can_manage_event_assignments(uuid) to anon, authenticated;
grant execute on function public.current_user_team_member_id_for_event(uuid) to anon, authenticated;
grant execute on function private.require_app_admin(public.app_admin_role[]) to authenticated;
grant execute on function private.require_protected_owner() to authenticated;

alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.church_memberships enable row level security;
alter table public.app_admins enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.events enable row level security;
alter table public.event_assignments enable row level security;
alter table public.people enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_interests enable row level security;
alter table public.contact_journey_events enable row level security;
alter table public.follow_ups enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.generated_messages enable row level security;

revoke insert, update, delete on table public.church_memberships from anon, authenticated;
revoke update, delete on table public.team_members from anon, authenticated;
grant update (display_name, phone, email, role, is_active, updated_at) on table public.team_members to authenticated;
revoke delete on table public.team_invitations from anon, authenticated;

drop policy if exists "Members can view their church" on public.churches;
create policy "Members can view their church"
on public.churches for select
using (
  private.is_church_member(id)
  or private.is_app_admin()
  or exists (
    select 1
    from public.events
    where events.church_id = churches.id
      and events.is_active = true
  )
);

drop policy if exists "Admins can update their church" on public.churches;
create policy "Admins can update their church"
on public.churches for update
using (private.has_church_role(id, array['admin','pastor']::public.team_role[]))
with check (private.has_church_role(id, array['admin','pastor']::public.team_role[]));

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (id = auth.uid() or private.is_app_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Members can view memberships" on public.church_memberships;
create policy "Members can view memberships"
on public.church_memberships for select
using ((status = 'active' and private.is_church_member(church_id)) or private.is_app_admin());

drop policy if exists "Admins can manage memberships" on public.church_memberships;
drop policy if exists "Leaders can insert memberships" on public.church_memberships;
drop policy if exists "Leaders can update memberships" on public.church_memberships;
drop policy if exists "Leaders can delete memberships" on public.church_memberships;

drop policy if exists "App admins can view own admin row" on public.app_admins;
create policy "App admins can view own admin row"
on public.app_admins for select
using (user_id = auth.uid());

drop policy if exists "App admins can view app admin rows" on public.app_admins;
create policy "App admins can view app admin rows"
on public.app_admins for select
using (private.is_app_admin());

drop policy if exists "Members can view church team" on public.team_members;
create policy "Members can view church team"
on public.team_members for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Leaders can manage church team" on public.team_members;
drop policy if exists "Leaders can add church team" on public.team_members;
create policy "Leaders can add church team"
on public.team_members for insert
with check (
  private.has_church_role(church_id, array['admin','pastor']::public.team_role[])
  and membership_id is null
  and role in ('pastor','elder','bible_worker','health_leader','prayer_team','youth_leader','viewer')
);

drop policy if exists "Leaders can update church team" on public.team_members;
create policy "Leaders can update church team"
on public.team_members for update
using (
  private.has_church_role(church_id, array['admin','pastor']::public.team_role[])
  and not exists (
    select 1
    from public.church_memberships
    join public.app_admins on app_admins.user_id = church_memberships.user_id
    where church_memberships.id = team_members.membership_id
      and app_admins.is_protected_owner = true
  )
)
with check (
  private.has_church_role(church_id, array['admin','pastor']::public.team_role[])
  and role in ('pastor','elder','bible_worker','health_leader','prayer_team','youth_leader','viewer')
  and not exists (
    select 1
    from public.church_memberships
    join public.app_admins on app_admins.user_id = church_memberships.user_id
    where church_memberships.id = team_members.membership_id
      and app_admins.is_protected_owner = true
  )
);

drop policy if exists "Users can update own linked team profile" on public.team_members;
create policy "Users can update own linked team profile"
on public.team_members for update
using (
  exists (
    select 1
    from public.church_memberships
    where church_memberships.id = team_members.membership_id
      and church_memberships.user_id = auth.uid()
      and church_memberships.status = 'active'
      and church_memberships.church_id = team_members.church_id
  )
)
with check (
  exists (
    select 1
    from public.church_memberships
    join public.profiles on profiles.id = church_memberships.user_id
    where church_memberships.id = team_members.membership_id
      and church_memberships.user_id = auth.uid()
      and church_memberships.status = 'active'
      and church_memberships.church_id = team_members.church_id
      and team_members.role = church_memberships.role
      and team_members.email is not distinct from profiles.email
      and team_members.is_active = true
  )
);

drop policy if exists "Leaders can delete church team" on public.team_members;

drop policy if exists "Leaders can view church invitations" on public.team_invitations;
create policy "Leaders can view church invitations"
on public.team_invitations for select
using (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]) or private.is_app_admin());

drop policy if exists "Leaders can create church invitations" on public.team_invitations;
create policy "Leaders can create church invitations"
on public.team_invitations for insert
with check (
  private.has_church_role(church_id, array['admin','pastor']::public.team_role[])
  and role in ('pastor','elder','bible_worker','health_leader','prayer_team','youth_leader','viewer')
);

drop policy if exists "Leaders can update church invitations" on public.team_invitations;
create policy "Leaders can update church invitations"
on public.team_invitations for update
using (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]))
with check (
  private.has_church_role(church_id, array['admin','pastor']::public.team_role[])
  and role in ('pastor','elder','bible_worker','health_leader','prayer_team','youth_leader','viewer')
);

drop policy if exists "Leaders can delete church invitations" on public.team_invitations;

drop policy if exists "Members can view church audit logs" on public.audit_logs;
create policy "Members can view church audit logs"
on public.audit_logs for select
using (private.is_app_admin() or private.has_church_role(church_id, array['admin','pastor']::public.team_role[]));

drop policy if exists "Members can create audit logs" on public.audit_logs;
create policy "Members can create audit logs"
on public.audit_logs for insert
with check (actor_user_id = auth.uid() and (private.is_app_admin() or private.is_church_member(church_id)));

drop policy if exists "Members can view church events" on public.events;
create policy "Members can view church events"
on public.events for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Leaders can manage church events" on public.events;
create policy "Leaders can manage church events"
on public.events for all
using (private.has_church_role(church_id, array['admin','pastor','elder','health_leader','youth_leader']::public.team_role[]))
with check (private.has_church_role(church_id, array['admin','pastor','elder','health_leader','youth_leader']::public.team_role[]));

drop policy if exists "event assignments select safely" on public.event_assignments;
create policy "event assignments select safely"
on public.event_assignments
for select
using (
  public.current_user_can_manage_event_assignments(event_id)
  or team_member_id = public.current_user_team_member_id_for_event(event_id)
  or (
    status = 'accepted'
    and revoked_at is null
    and team_member_id = public.current_user_team_member_id_for_event(event_id)
  )
);

drop policy if exists "event assignments insert by managers" on public.event_assignments;
create policy "event assignments insert by managers"
on public.event_assignments
for insert
with check (
  public.current_user_can_manage_event_assignments(event_id)
);

drop policy if exists "event assignments update by managers" on public.event_assignments;
create policy "event assignments update by managers"
on public.event_assignments
for update
using (
  public.current_user_can_manage_event_assignments(event_id)
)
with check (
  public.current_user_can_manage_event_assignments(event_id)
);

drop policy if exists "event assignments delete disabled" on public.event_assignments;
create policy "event assignments delete disabled"
on public.event_assignments
for delete
using (false);

drop policy if exists "Members can view church people" on public.people;
create policy "Members can view church people"
on public.people for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Members can create church people" on public.people;
create policy "Members can create church people"
on public.people for insert
with check (private.is_church_member(church_id));

drop policy if exists "Members can update church people" on public.people;
create policy "Members can update church people"
on public.people for update
using (private.is_church_member(church_id))
with check (private.is_church_member(church_id));

drop policy if exists "Members can view church contacts" on public.contacts;
create policy "Members can view church contacts"
on public.contacts for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Members can create church contacts" on public.contacts;
create policy "Members can create church contacts"
on public.contacts for insert
with check (private.is_church_member(church_id));

drop policy if exists "Members can update church contacts" on public.contacts;
create policy "Members can update church contacts"
on public.contacts for update
using (private.is_church_member(church_id))
with check (private.is_church_member(church_id));

drop policy if exists "Members can view contact interests" on public.contact_interests;
create policy "Members can view contact interests"
on public.contact_interests for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Members can create contact interests" on public.contact_interests;
create policy "Members can create contact interests"
on public.contact_interests for insert
with check (private.is_church_member(church_id));

drop policy if exists "Members can manage contact interests" on public.contact_interests;
create policy "Members can manage contact interests"
on public.contact_interests for update
using (private.is_church_member(church_id))
with check (private.is_church_member(church_id));

drop policy if exists "Members can view contact journeys" on public.contact_journey_events;
create policy "Members can view contact journeys"
on public.contact_journey_events for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Members can create contact journeys" on public.contact_journey_events;
create policy "Members can create contact journeys"
on public.contact_journey_events for insert
with check (private.is_church_member(church_id));

drop policy if exists "Members can update contact journeys" on public.contact_journey_events;
create policy "Members can update contact journeys"
on public.contact_journey_events for update
using (private.is_church_member(church_id))
with check (private.is_church_member(church_id));

drop policy if exists "Members can view follow ups" on public.follow_ups;
create policy "Members can view follow ups"
on public.follow_ups for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Members can create follow ups" on public.follow_ups;
create policy "Members can create follow ups"
on public.follow_ups for insert
with check (private.is_church_member(church_id));

drop policy if exists "Members can update follow ups" on public.follow_ups;
create policy "Members can update follow ups"
on public.follow_ups for update
using (private.is_church_member(church_id))
with check (private.is_church_member(church_id));

drop policy if exists "Prayer roles can view prayer requests" on public.prayer_requests;
create policy "Prayer roles can view prayer requests"
on public.prayer_requests for select
using (
  private.is_app_admin()
  or (
    visibility::text in ('pastoral_prayer','general_prayer')
    and private.has_church_role(church_id, array['admin','pastor','prayer_team']::public.team_role[])
  )
  or (
    visibility::text in ('pastors_only','pastor_only','private_contact','sensitive')
    and private.has_church_role(church_id, array['admin','pastor']::public.team_role[])
  )
  or (
    visibility::text = 'family_support'
    and private.has_church_role(church_id, array['admin','pastor','elder']::public.team_role[])
  )
  or (
    visibility::text = 'health_related'
    and private.has_church_role(church_id, array['admin','pastor','health_leader']::public.team_role[])
  )
);

drop policy if exists "Members can create prayer requests" on public.prayer_requests;
create policy "Members can create prayer requests"
on public.prayer_requests for insert
with check (private.is_church_member(church_id));

drop policy if exists "Prayer roles can update prayer requests" on public.prayer_requests;
create policy "Prayer roles can update prayer requests"
on public.prayer_requests for update
using (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]))
with check (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]));

drop policy if exists "Members can view generated messages" on public.generated_messages;
create policy "Members can view generated messages"
on public.generated_messages for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Members can create generated messages" on public.generated_messages;
create policy "Members can create generated messages"
on public.generated_messages for insert
with check (private.is_church_member(church_id));

drop policy if exists "Members can update generated messages" on public.generated_messages;
create policy "Members can update generated messages"
on public.generated_messages for update
using (private.is_church_member(church_id) or private.is_app_admin())
with check (private.is_church_member(church_id) or private.is_app_admin());

drop function if exists public.is_church_member(uuid);
drop function if exists public.is_app_admin();
drop function if exists public.is_app_owner();
drop function if exists public.has_church_role(uuid, public.team_role[]);

drop function if exists public.team_invitation_preview(text);

create or replace function public.team_invitation_preview(p_token text)
returns table (
  church_name text,
  display_name text,
  email text,
  role public.team_role,
  status public.team_invitation_status,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    churches.name as church_name,
    team_invitations.display_name,
    team_invitations.email,
    team_invitations.role,
    case
      when team_invitations.status = 'pending' and team_invitations.expires_at <= now() then 'expired'::public.team_invitation_status
      else team_invitations.status
    end as status,
    team_invitations.expires_at
  from public.team_invitations
  join public.churches on churches.id = team_invitations.church_id
  where team_invitations.token_hash = private.hash_invite_token(p_token)
  limit 1;
$$;

revoke all on function public.team_invitation_preview(text) from public, anon, authenticated;
grant execute on function public.team_invitation_preview(text) to anon, authenticated;

drop function if exists public.accept_team_invitation(text);

create or replace function public.accept_team_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Login is required before accepting this invitation.';
  end if;

  select email
  into current_email
  from auth.users
  where id = auth.uid();

  return private.accept_team_invitation_for_user(p_token, auth.uid(), current_email);
end;
$$;

revoke all on function public.accept_team_invitation(text) from public, anon, authenticated;
grant execute on function public.accept_team_invitation(text) to authenticated;

drop view if exists public.public_events;
create view public.public_events
with (security_invoker = true) as
select
  events.id,
  events.name,
  events.event_type,
  events.starts_on,
  events.location,
  events.slug,
  churches.name as church_name,
  events.form_config,
  events.branding_config,
  events.public_info
from public.events
join public.churches on churches.id = events.church_id
where events.is_active = true
  and events.archived_at is null;

grant select on public.public_events to anon, authenticated;
grant select on public.churches, public.events to anon, authenticated;

drop function if exists public.owner_church_summaries();

create function public.owner_church_summaries()
returns table (
  church_id uuid,
  church_name text,
  created_at timestamptz,
  team_count bigint,
  event_count bigint,
  contact_count bigint,
  new_contact_count bigint
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Login is required.';
  end if;

  if not private.is_app_admin() then
    raise exception 'Only app admins can view owner church summaries.';
  end if;

  return query
  select
    churches.id as church_id,
    churches.name as church_name,
    churches.created_at,
    coalesce(team_counts.team_count, 0) as team_count,
    coalesce(event_counts.event_count, 0) as event_count,
    coalesce(contact_counts.contact_count, 0) as contact_count,
    coalesce(new_contact_counts.new_contact_count, 0) as new_contact_count
  from public.churches
  left join (
    select team_members.church_id, count(*) as team_count
    from public.team_members
    group by team_members.church_id
  ) team_counts on team_counts.church_id = churches.id
  left join (
    select events.church_id, count(*) as event_count
    from public.events
    group by events.church_id
  ) event_counts on event_counts.church_id = churches.id
  left join (
    select contacts.church_id, count(*) as contact_count
    from public.contacts
    where contacts.deleted_at is null
    group by contacts.church_id
  ) contact_counts on contact_counts.church_id = churches.id
  left join (
    select contacts.church_id, count(*) as new_contact_count
    from public.contacts
    where contacts.deleted_at is null
      and contacts.status = 'new'
    group by contacts.church_id
  ) new_contact_counts on new_contact_counts.church_id = churches.id
  order by churches.created_at desc;
end;
$$;

revoke all on function public.owner_church_summaries() from public;
grant execute on function public.owner_church_summaries() to authenticated;

drop function if exists public.owner_account_rows();

create or replace function public.owner_account_rows()
returns table (
  church_id uuid,
  church_name text,
  church_created_at timestamptz,
  membership_id uuid,
  user_id uuid,
  full_name text,
  email text,
  role public.team_role,
  status public.membership_status,
  membership_created_at timestamptz,
  team_member_id uuid,
  team_member_name text,
  team_member_active boolean,
  app_admin_role public.app_admin_role,
  is_protected_owner boolean,
  event_count bigint,
  contact_count bigint
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.require_app_admin();

  return query
  select
    churches.id as church_id,
    churches.name as church_name,
    churches.created_at as church_created_at,
    church_memberships.id as membership_id,
    church_memberships.user_id,
    profiles.full_name,
    profiles.email,
    church_memberships.role,
    church_memberships.status,
    church_memberships.created_at as membership_created_at,
    team_members.id as team_member_id,
    team_members.display_name as team_member_name,
    coalesce(team_members.is_active, false) as team_member_active,
    app_admins.role as app_admin_role,
    coalesce(app_admins.is_protected_owner, false) as is_protected_owner,
    count(distinct events.id) as event_count,
    count(distinct contacts.id) as contact_count
  from public.churches
  join public.church_memberships on church_memberships.church_id = churches.id
  left join public.profiles on profiles.id = church_memberships.user_id
  left join public.team_members on team_members.membership_id = church_memberships.id
  left join public.app_admins on app_admins.user_id = church_memberships.user_id
  left join public.events on events.church_id = churches.id
  left join public.contacts on contacts.church_id = churches.id
  group by
    churches.id,
    churches.name,
    churches.created_at,
    church_memberships.id,
    church_memberships.user_id,
    profiles.full_name,
    profiles.email,
    church_memberships.role,
    church_memberships.status,
    church_memberships.created_at,
    team_members.id,
    team_members.display_name,
    team_members.is_active,
    app_admins.role,
    app_admins.is_protected_owner
  order by churches.created_at desc, church_memberships.created_at asc;
end;
$$;

revoke all on function public.owner_account_rows() from public, anon, authenticated;
grant execute on function public.owner_account_rows() to authenticated;

drop function if exists public.owner_invitation_rows();

create or replace function public.owner_invitation_rows()
returns table (
  church_id uuid,
  church_name text,
  invitation_id uuid,
  team_member_id uuid,
  display_name text,
  email text,
  role public.team_role,
  status public.team_invitation_status,
  invited_by_name text,
  accepted_by_name text,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.require_app_admin();

  return query
  select
    churches.id as church_id,
    churches.name as church_name,
    team_invitations.id as invitation_id,
    team_invitations.team_member_id,
    team_invitations.display_name,
    team_invitations.email,
    team_invitations.role,
    case
      when team_invitations.status = 'pending' and team_invitations.expires_at <= now() then 'expired'::public.team_invitation_status
      else team_invitations.status
    end as status,
    invited_by_profile.full_name as invited_by_name,
    accepted_by_profile.full_name as accepted_by_name,
    team_invitations.expires_at,
    team_invitations.accepted_at,
    team_invitations.created_at
  from public.team_invitations
  join public.churches on churches.id = team_invitations.church_id
  left join public.profiles as invited_by_profile on invited_by_profile.id = team_invitations.invited_by
  left join public.profiles as accepted_by_profile on accepted_by_profile.id = team_invitations.accepted_by
  order by team_invitations.created_at desc;
end;
$$;

revoke all on function public.owner_invitation_rows() from public, anon, authenticated;
grant execute on function public.owner_invitation_rows() to authenticated;

drop function if exists public.owner_update_membership_status(uuid, public.membership_status);

create or replace function public.owner_update_membership_status(
  p_membership_id uuid,
  p_status public.membership_status
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_membership public.church_memberships%rowtype;
  target_is_protected_owner boolean := false;
  active_leader_count integer := 0;
begin
  perform private.require_app_admin(array['owner','support_admin']::public.app_admin_role[]);

  select *
  into target_membership
  from public.church_memberships
  where id = p_membership_id
  limit 1;

  if target_membership.id is null then
    raise exception 'Membership not found.';
  end if;

  select exists (
    select 1
    from public.app_admins
    where app_admins.user_id = target_membership.user_id
      and app_admins.is_protected_owner = true
  )
  into target_is_protected_owner
  ;

  if target_is_protected_owner and p_status <> 'active' then
    raise exception 'Protected owner access cannot be deactivated from the app.';
  end if;

  select count(*)
  into active_leader_count
  from public.church_memberships
  where church_id = target_membership.church_id
    and status = 'active'
    and role in ('admin','pastor')
    and id <> target_membership.id;

  if target_membership.status = 'active'
    and target_membership.role in ('admin','pastor')
    and p_status <> 'active'
    and active_leader_count = 0 then
    raise exception 'Every church must keep at least one active admin or pastor.';
  end if;

  update public.church_memberships
  set status = p_status,
      updated_at = now()
  where id = target_membership.id;

  update public.team_members
  set is_active = p_status = 'active',
      updated_at = now()
  where membership_id = target_membership.id;

  insert into public.audit_logs (
    church_id,
    actor_user_id,
    target_type,
    target_id,
    action,
    metadata
  )
  values (
    target_membership.church_id,
    auth.uid(),
    'church_membership',
    target_membership.id,
    'membership.status_changed',
    jsonb_build_object(
      'fromStatus', target_membership.status,
      'toStatus', p_status,
      'role', target_membership.role
    )
  );
end;
$$;

revoke all on function public.owner_update_membership_status(uuid, public.membership_status) from public, anon, authenticated;
revoke all on function public.owner_update_membership_status(uuid, public.membership_status) from public;
grant execute on function public.owner_update_membership_status(uuid, public.membership_status) to authenticated;

drop function if exists public.owner_update_membership_role(uuid, public.team_role);

create or replace function public.owner_update_membership_role(
  p_membership_id uuid,
  p_role public.team_role
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_membership public.church_memberships%rowtype;
  target_is_protected_owner boolean := false;
  active_leader_count integer := 0;
begin
  perform private.require_app_admin(array['owner','support_admin']::public.app_admin_role[]);

  select *
  into target_membership
  from public.church_memberships
  where id = p_membership_id
  limit 1;

  if target_membership.id is null then
    raise exception 'Membership not found.';
  end if;

  select exists (
    select 1
    from public.app_admins
    where app_admins.user_id = target_membership.user_id
      and app_admins.is_protected_owner = true
  )
  into target_is_protected_owner
  ;

  if target_is_protected_owner and p_role <> target_membership.role then
    raise exception 'Protected owner church role cannot be changed from the app.';
  end if;

  select count(*)
  into active_leader_count
  from public.church_memberships
  where church_id = target_membership.church_id
    and status = 'active'
    and role in ('admin','pastor')
    and id <> target_membership.id;

  if target_membership.status = 'active'
    and target_membership.role in ('admin','pastor')
    and p_role not in ('admin','pastor')
    and active_leader_count = 0 then
    raise exception 'Every church must keep at least one active admin or pastor.';
  end if;

  update public.church_memberships
  set role = p_role,
      updated_at = now()
  where id = target_membership.id;

  update public.team_members
  set role = p_role,
      updated_at = now()
  where membership_id = target_membership.id;

  insert into public.audit_logs (
    church_id,
    actor_user_id,
    target_type,
    target_id,
    action,
    metadata
  )
  values (
    target_membership.church_id,
    auth.uid(),
    'church_membership',
    target_membership.id,
    'membership.role_changed',
    jsonb_build_object(
      'fromRole', target_membership.role,
      'toRole', p_role,
      'status', target_membership.status
    )
  );
end;
$$;

revoke all on function public.owner_update_membership_role(uuid, public.team_role) from public, anon, authenticated;
revoke all on function public.owner_update_membership_role(uuid, public.team_role) from public;
grant execute on function public.owner_update_membership_role(uuid, public.team_role) to authenticated;

drop function if exists public.search_contacts(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  public.interest_tag,
  uuid,
  boolean,
  integer,
  integer
);

create or replace function public.search_contacts(
  p_church_id uuid,
  p_q text default null,
  p_status public.follow_up_status default null,
  p_event_id uuid default null,
  p_interest public.interest_tag default null,
  p_assigned_to uuid default null,
  p_unassigned boolean default false,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  person_id uuid,
  full_name text,
  phone text,
  email text,
  area text,
  language text,
  best_time_to_contact text,
  status public.follow_up_status,
  urgency public.urgency_level,
  assigned_to uuid,
  assigned_handling_role text,
  recommended_assigned_role text,
  do_not_contact boolean,
  duplicate_of_contact_id uuid,
  duplicate_match_confidence numeric,
  duplicate_match_reason text,
  created_at timestamptz,
  event_id uuid,
  event_name text,
  assigned_name text,
  interests public.interest_tag[],
  total_count bigint
)
language sql
security invoker
set search_path = public
as $$
  with filtered as (
    select
      contacts.id,
      contacts.person_id,
      contacts.full_name,
      contacts.phone,
      contacts.email,
      contacts.area,
      contacts.language,
      contacts.best_time_to_contact,
      contacts.status,
      contacts.urgency,
      contacts.assigned_to,
      contacts.assigned_handling_role,
      contacts.recommended_assigned_role,
      contacts.do_not_contact,
      contacts.duplicate_of_contact_id,
      contacts.duplicate_match_confidence,
      contacts.duplicate_match_reason,
      contacts.created_at,
      events.id as event_id,
      events.name as event_name,
      team_members.display_name as assigned_name,
      count(*) over() as total_count
    from public.contacts
    left join public.events on events.id = contacts.event_id
    left join public.team_members on team_members.id = contacts.assigned_to
    where contacts.church_id = p_church_id
      and (
        nullif(trim(coalesce(p_q, '')), '') is null
        or contacts.full_name ilike '%' || trim(p_q) || '%'
        or contacts.phone ilike '%' || trim(p_q) || '%'
        or contacts.email ilike '%' || trim(p_q) || '%'
        or contacts.area ilike '%' || trim(p_q) || '%'
      )
      and contacts.deleted_at is null
      and contacts.archived_at is null
      and (p_status is null or contacts.status = p_status)
      and (p_event_id is null or contacts.event_id = p_event_id)
      and (
        case
          when p_unassigned then contacts.assigned_to is null
          when p_assigned_to is not null then contacts.assigned_to = p_assigned_to
          else true
        end
      )
      and (
        p_interest is null
        or exists (
          select 1
          from public.contact_interests
          where contact_interests.contact_id = contacts.id
            and contact_interests.interest = p_interest
        )
      )
    order by contacts.created_at desc
    limit greatest(1, least(coalesce(p_limit, 25), 100))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    filtered.id,
    filtered.person_id,
    filtered.full_name,
    filtered.phone,
    filtered.email,
    filtered.area,
    filtered.language,
    filtered.best_time_to_contact,
    filtered.status,
    filtered.urgency,
    filtered.assigned_to,
    filtered.assigned_handling_role,
    filtered.recommended_assigned_role,
    filtered.do_not_contact,
    filtered.duplicate_of_contact_id,
    filtered.duplicate_match_confidence,
    filtered.duplicate_match_reason,
    filtered.created_at,
    filtered.event_id,
    filtered.event_name,
    filtered.assigned_name,
    coalesce(
      (
        select array_agg(contact_interests.interest order by contact_interests.interest::text)
        from public.contact_interests
        where contact_interests.contact_id = filtered.id
      ),
      array[]::public.interest_tag[]
    ) as interests,
    filtered.total_count
  from filtered;
$$;

revoke all on function public.search_contacts(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  public.interest_tag,
  uuid,
  boolean,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.search_contacts(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  public.interest_tag,
  uuid,
  boolean,
  integer,
  integer
) to authenticated;

drop function if exists public.search_follow_ups(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  boolean,
  text,
  integer,
  integer
);

create or replace function public.search_follow_ups(
  p_church_id uuid,
  p_q text default null,
  p_status public.follow_up_status default null,
  p_assigned_to uuid default null,
  p_unassigned boolean default false,
  p_due_state text default 'open_due',
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  contact_id uuid,
  assigned_to uuid,
  status public.follow_up_status,
  channel public.follow_up_channel,
  next_action text,
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz,
  contact_full_name text,
  contact_phone text,
  contact_email text,
  contact_area text,
  contact_status public.follow_up_status,
  contact_urgency public.urgency_level,
  contact_do_not_contact boolean,
  event_id uuid,
  event_name text,
  assigned_name text,
  interests public.interest_tag[],
  suggested_message_id uuid,
  suggested_message_text text,
  suggested_wa_link text,
  suggested_opened_at timestamptz,
  total_count bigint
)
language sql
security invoker
set search_path = public
as $$
  with filtered as (
    select
      follow_ups.id,
      follow_ups.contact_id,
      follow_ups.assigned_to,
      follow_ups.status,
      follow_ups.channel,
      follow_ups.next_action,
      follow_ups.notes,
      follow_ups.due_at,
      follow_ups.completed_at,
      follow_ups.created_at,
      contacts.full_name as contact_full_name,
      contacts.phone as contact_phone,
      contacts.email as contact_email,
      contacts.area as contact_area,
      contacts.status as contact_status,
      contacts.urgency as contact_urgency,
      contacts.do_not_contact as contact_do_not_contact,
      events.id as event_id,
      events.name as event_name,
      team_members.display_name as assigned_name,
      generated_messages.id as suggested_message_id,
      generated_messages.message_text as suggested_message_text,
      generated_messages.wa_link as suggested_wa_link,
      generated_messages.opened_at as suggested_opened_at,
      count(*) over() as total_count
    from public.follow_ups
    join public.contacts on contacts.id = follow_ups.contact_id
    left join public.events on events.id = contacts.event_id
    left join public.team_members on team_members.id = follow_ups.assigned_to
    left join public.generated_messages on generated_messages.contact_id = contacts.id
      and generated_messages.church_id = follow_ups.church_id
      and generated_messages.purpose = 'suggested_whatsapp'
    where follow_ups.church_id = p_church_id
      and contacts.church_id = p_church_id
      and contacts.deleted_at is null
      and contacts.archived_at is null
      and (
        case coalesce(nullif(p_due_state, ''), 'open_due')
          when 'all' then true
          when 'overdue' then follow_ups.completed_at is null and follow_ups.due_at < now()
          when 'due_today' then follow_ups.completed_at is null and follow_ups.due_at >= date_trunc('day', now()) and follow_ups.due_at < date_trunc('day', now()) + interval '1 day'
          when 'upcoming' then follow_ups.completed_at is null and follow_ups.due_at >= date_trunc('day', now()) + interval '1 day'
          when 'completed' then follow_ups.completed_at is not null
          else follow_ups.completed_at is null and follow_ups.due_at < date_trunc('day', now()) + interval '1 day'
        end
      )
      and (p_status is null or follow_ups.status = p_status)
      and (
        case
          when p_unassigned then follow_ups.assigned_to is null
          when p_assigned_to is not null then follow_ups.assigned_to = p_assigned_to
          else true
        end
      )
      and (
        nullif(trim(coalesce(p_q, '')), '') is null
        or contacts.full_name ilike '%' || trim(p_q) || '%'
        or contacts.phone ilike '%' || trim(p_q) || '%'
        or contacts.email ilike '%' || trim(p_q) || '%'
        or contacts.area ilike '%' || trim(p_q) || '%'
        or follow_ups.next_action ilike '%' || trim(p_q) || '%'
        or follow_ups.notes ilike '%' || trim(p_q) || '%'
        or events.name ilike '%' || trim(p_q) || '%'
      )
    order by follow_ups.due_at asc nulls last, follow_ups.created_at desc
    limit greatest(1, least(coalesce(p_limit, 25), 100))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    filtered.id,
    filtered.contact_id,
    filtered.assigned_to,
    filtered.status,
    filtered.channel,
    filtered.next_action,
    filtered.notes,
    filtered.due_at,
    filtered.completed_at,
    filtered.created_at,
    filtered.contact_full_name,
    filtered.contact_phone,
    filtered.contact_email,
    filtered.contact_area,
    filtered.contact_status,
    filtered.contact_urgency,
    filtered.contact_do_not_contact,
    filtered.event_id,
    filtered.event_name,
    filtered.assigned_name,
    coalesce(
      (
        select array_agg(contact_interests.interest order by contact_interests.interest::text)
        from public.contact_interests
        where contact_interests.contact_id = filtered.contact_id
      ),
      array[]::public.interest_tag[]
    ) as interests,
    filtered.suggested_message_id,
    filtered.suggested_message_text,
    filtered.suggested_wa_link,
    filtered.suggested_opened_at,
    filtered.total_count
  from filtered;
$$;

revoke all on function public.search_follow_ups(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  boolean,
  text,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.search_follow_ups(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  boolean,
  text,
  integer,
  integer
) to authenticated;

drop function if exists public.event_follow_up_counts(uuid, uuid);

create or replace function public.event_follow_up_counts(
  p_church_id uuid,
  p_event_id uuid
)
returns table (
  pending_follow_ups bigint,
  completed_follow_ups bigint,
  overdue_follow_ups bigint,
  due_now_follow_ups bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (
      where f.completed_at is null
        and (f.status is null or f.status <> 'closed')
    ) as pending_follow_ups,
    count(*) filter (
      where f.completed_at is not null
    ) as completed_follow_ups,
    count(*) filter (
      where f.completed_at is null
        and f.due_at is not null
        and f.due_at < now()
    ) as overdue_follow_ups,
    count(*) filter (
      where f.completed_at is null
        and f.due_at is not null
        and f.due_at <= now()
    ) as due_now_follow_ups
  from public.follow_ups f
  inner join public.contacts c on c.id = f.contact_id
  where f.church_id = p_church_id
    and c.church_id = p_church_id
    and c.event_id = p_event_id
    and c.deleted_at is null;
$$;

revoke all on function public.event_follow_up_counts(uuid, uuid) from public;
grant execute on function public.event_follow_up_counts(uuid, uuid) to authenticated;

drop function if exists public.event_follow_ups_page(uuid, uuid, text, uuid, public.urgency_level, integer, integer);

create or replace function public.event_follow_ups_page(
  p_church_id uuid,
  p_event_id uuid,
  p_status text default 'all',
  p_assigned_to uuid default null,
  p_urgency public.urgency_level default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  contact_id uuid,
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  contact_status public.follow_up_status,
  contact_urgency public.urgency_level,
  assigned_to uuid,
  assigned_name text,
  status public.follow_up_status,
  channel public.follow_up_channel,
  next_action text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select
      f.id,
      f.contact_id,
      c.full_name as contact_name,
      c.phone as contact_phone,
      c.whatsapp_number as contact_whatsapp,
      c.email as contact_email,
      c.status as contact_status,
      c.urgency as contact_urgency,
      f.assigned_to,
      tm.display_name as assigned_name,
      f.status,
      f.channel,
      f.next_action,
      f.due_at,
      f.completed_at,
      f.created_at
    from public.follow_ups f
    inner join public.contacts c on c.id = f.contact_id
    left join public.team_members tm on tm.id = f.assigned_to
    where f.church_id = p_church_id
      and c.church_id = p_church_id
      and c.event_id = p_event_id
      and c.deleted_at is null
      and (p_assigned_to is null or f.assigned_to = p_assigned_to)
      and (p_urgency is null or c.urgency = p_urgency)
      and (
        p_status is null
        or p_status = 'all'
        or (p_status = 'overdue' and f.completed_at is null and f.due_at < now())
        or (p_status = 'today' and f.completed_at is null and f.due_at >= date_trunc('day', now()) and f.due_at < date_trunc('day', now()) + interval '1 day')
        or (p_status = 'upcoming' and f.completed_at is null and f.due_at >= date_trunc('day', now()) + interval '1 day')
        or (p_status = 'completed' and f.completed_at is not null)
      )
  )
  select
    filtered.*,
    count(*) over() as total_count
  from filtered
  order by filtered.due_at asc nulls last, filtered.created_at desc
  limit greatest(1, least(coalesce(p_limit, 25), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

revoke all on function public.event_follow_ups_page(uuid, uuid, text, uuid, public.urgency_level, integer, integer) from public;
grant execute on function public.event_follow_ups_page(uuid, uuid, text, uuid, public.urgency_level, integer, integer) to authenticated;

drop function if exists public.export_contacts(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  public.interest_tag,
  uuid,
  boolean
);

create or replace function public.export_contacts(
  p_church_id uuid,
  p_q text default null,
  p_status public.follow_up_status default null,
  p_event_id uuid default null,
  p_interest public.interest_tag default null,
  p_assigned_to uuid default null,
  p_unassigned boolean default false
)
returns table (
  id uuid,
  person_id uuid,
  full_name text,
  phone text,
  email text,
  area text,
  language text,
  best_time_to_contact text,
  status public.follow_up_status,
  urgency public.urgency_level,
  assigned_to uuid,
  assigned_handling_role text,
  recommended_assigned_role text,
  do_not_contact boolean,
  duplicate_of_contact_id uuid,
  duplicate_match_confidence numeric,
  duplicate_match_reason text,
  created_at timestamptz,
  event_id uuid,
  event_name text,
  assigned_name text,
  interests public.interest_tag[],
  total_count bigint
)
language sql
security invoker
set search_path = public
as $$
  with filtered as (
    select
      contacts.id,
      contacts.person_id,
      contacts.full_name,
      contacts.phone,
      contacts.email,
      contacts.area,
      contacts.language,
      contacts.best_time_to_contact,
      contacts.status,
      contacts.urgency,
      contacts.assigned_to,
      contacts.assigned_handling_role,
      contacts.recommended_assigned_role,
      contacts.do_not_contact,
      contacts.duplicate_of_contact_id,
      contacts.duplicate_match_confidence,
      contacts.duplicate_match_reason,
      contacts.created_at,
      events.id as event_id,
      events.name as event_name,
      team_members.display_name as assigned_name,
      count(*) over() as total_count
    from public.contacts
    left join public.events on events.id = contacts.event_id
    left join public.team_members on team_members.id = contacts.assigned_to
    where contacts.church_id = p_church_id
      and (
        nullif(trim(coalesce(p_q, '')), '') is null
        or contacts.full_name ilike '%' || trim(p_q) || '%'
        or contacts.phone ilike '%' || trim(p_q) || '%'
        or contacts.email ilike '%' || trim(p_q) || '%'
        or contacts.area ilike '%' || trim(p_q) || '%'
      )
      and contacts.deleted_at is null
      and contacts.archived_at is null
      and (p_status is null or contacts.status = p_status)
      and (p_event_id is null or contacts.event_id = p_event_id)
      and (
        case
          when p_unassigned then contacts.assigned_to is null
          when p_assigned_to is not null then contacts.assigned_to = p_assigned_to
          else true
        end
      )
      and (
        p_interest is null
        or exists (
          select 1
          from public.contact_interests
          where contact_interests.contact_id = contacts.id
            and contact_interests.church_id = contacts.church_id
            and contact_interests.interest = p_interest
        )
      )
    order by contacts.created_at desc
  )
  select
    filtered.id,
    filtered.person_id,
    filtered.full_name,
    filtered.phone,
    filtered.email,
    filtered.area,
    filtered.language,
    filtered.best_time_to_contact,
    filtered.status,
    filtered.urgency,
    filtered.assigned_to,
    filtered.assigned_handling_role,
    filtered.recommended_assigned_role,
    filtered.do_not_contact,
    filtered.duplicate_of_contact_id,
    filtered.duplicate_match_confidence,
    filtered.duplicate_match_reason,
    filtered.created_at,
    filtered.event_id,
    filtered.event_name,
    filtered.assigned_name,
    coalesce(
      (
        select array_agg(contact_interests.interest order by contact_interests.interest::text)
        from public.contact_interests
        where contact_interests.contact_id = filtered.id
      ),
      array[]::public.interest_tag[]
    ) as interests,
    filtered.total_count
  from filtered;
$$;

revoke all on function public.export_contacts(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  public.interest_tag,
  uuid,
  boolean
) from public, anon, authenticated;

grant execute on function public.export_contacts(
  uuid,
  text,
  public.follow_up_status,
  uuid,
  public.interest_tag,
  uuid,
  boolean
) to authenticated;

drop function if exists public.outreach_report_summary(uuid);

create or replace function public.outreach_report_summary(p_church_id uuid)
returns table (
  total_contacts bigint,
  followed_up_count bigint,
  bible_study_count bigint,
  prayer_count bigint,
  health_count bigint,
  baptism_count bigint,
  high_priority_count bigint,
  unassigned_count bigint,
  due_today_count bigint,
  overdue_count bigint,
  waiting_reply_count bigint,
  no_consent_count bigint,
  do_not_contact_count bigint,
  events jsonb
)
language sql
security invoker
set search_path = public
as $$
  with event_counts as (
    select
      events.id,
      events.name,
      events.event_type,
      events.created_at,
      count(contacts.id) as contact_count
    from public.events
    left join public.contacts on contacts.event_id = events.id
      and contacts.church_id = events.church_id
      and contacts.deleted_at is null
    where events.church_id = p_church_id
    group by events.id, events.name, events.event_type, events.created_at
  )
  select
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.deleted_at is null
    ) as total_contacts,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.status <> 'new'
        and contacts.deleted_at is null
    ) as followed_up_count,
    (
      select count(distinct contacts.id)
      from public.contacts
      join public.contact_interests on contact_interests.contact_id = contacts.id
        and contact_interests.church_id = contacts.church_id
      where contacts.church_id = p_church_id
        and contact_interests.interest = 'bible_study'
        and contacts.deleted_at is null
    ) as bible_study_count,
    (
      select count(distinct contacts.id)
      from public.contacts
      join public.contact_interests on contact_interests.contact_id = contacts.id
        and contact_interests.church_id = contacts.church_id
      where contacts.church_id = p_church_id
        and contact_interests.interest = 'prayer'
        and contacts.deleted_at is null
    ) as prayer_count,
    (
      select count(distinct contacts.id)
      from public.contacts
      join public.contact_interests on contact_interests.contact_id = contacts.id
        and contact_interests.church_id = contacts.church_id
      where contacts.church_id = p_church_id
        and contact_interests.interest in ('health', 'cooking_class')
        and contacts.deleted_at is null
    ) as health_count,
    (
      select count(distinct contacts.id)
      from public.contacts
      join public.contact_interests on contact_interests.contact_id = contacts.id
        and contact_interests.church_id = contacts.church_id
      where contacts.church_id = p_church_id
        and contact_interests.interest = 'baptism'
        and contacts.deleted_at is null
    ) as baptism_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.urgency = 'high'
        and contacts.deleted_at is null
    ) as high_priority_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.assigned_to is null
        and contacts.status <> 'closed'
        and contacts.deleted_at is null
    ) as unassigned_count,
    (
      select count(distinct follow_ups.contact_id)
      from public.follow_ups
      join public.contacts on contacts.id = follow_ups.contact_id
      where follow_ups.church_id = p_church_id
        and contacts.status <> 'closed'
        and contacts.deleted_at is null
        and follow_ups.completed_at is null
        and follow_ups.due_at >= date_trunc('day', now())
        and follow_ups.due_at < date_trunc('day', now()) + interval '1 day'
    ) as due_today_count,
    (
      select count(distinct follow_ups.contact_id)
      from public.follow_ups
      join public.contacts on contacts.id = follow_ups.contact_id
      where follow_ups.church_id = p_church_id
        and contacts.status <> 'closed'
        and contacts.deleted_at is null
        and follow_ups.completed_at is null
        and follow_ups.due_at < now()
    ) as overdue_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.status = 'waiting'
        and contacts.status <> 'closed'
        and contacts.deleted_at is null
    ) as waiting_reply_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.consent_given is distinct from true
        and contacts.status <> 'closed'
        and contacts.deleted_at is null
    ) as no_consent_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.do_not_contact = true
        and contacts.deleted_at is null
    ) as do_not_contact_count,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', event_counts.id,
            'name', event_counts.name,
            'event_type', event_counts.event_type,
            'contact_count', event_counts.contact_count
          )
          order by event_counts.created_at desc
        )
        from event_counts
      ),
      '[]'::jsonb
    ) as events;
$$;

revoke all on function public.outreach_report_summary(uuid) from public, anon, authenticated;
grant execute on function public.outreach_report_summary(uuid) to authenticated;

drop function if exists public.event_report_summary(uuid, uuid);

create or replace function public.event_report_summary(
  p_church_id uuid,
  p_event_id uuid
)
returns table (
  total_contacts bigint,
  followed_up_count bigint,
  bible_study_count bigint,
  prayer_count bigint,
  baptism_count bigint,
  high_priority_count bigint,
  follow_up_count bigint,
  status_counts jsonb,
  interest_counts jsonb
)
language sql
security invoker
set search_path = public
as $$
  with event_contacts as (
    select *
    from public.contacts
    where contacts.church_id = p_church_id
      and contacts.event_id = p_event_id
      and contacts.deleted_at is null
  )
  select
    (select count(*) from event_contacts) as total_contacts,
    (select count(*) from event_contacts where status <> 'new') as followed_up_count,
    (
      select count(distinct event_contacts.id)
      from event_contacts
      join public.contact_interests on contact_interests.contact_id = event_contacts.id
        and contact_interests.church_id = event_contacts.church_id
      where contact_interests.interest = 'bible_study'
    ) as bible_study_count,
    (
      select count(distinct event_contacts.id)
      from event_contacts
      join public.contact_interests on contact_interests.contact_id = event_contacts.id
        and contact_interests.church_id = event_contacts.church_id
      where contact_interests.interest = 'prayer'
    ) as prayer_count,
    (
      select count(distinct event_contacts.id)
      from event_contacts
      join public.contact_interests on contact_interests.contact_id = event_contacts.id
        and contact_interests.church_id = event_contacts.church_id
      where contact_interests.interest = 'baptism'
    ) as baptism_count,
    (select count(*) from event_contacts where urgency = 'high') as high_priority_count,
    (
      select count(*)
      from public.follow_ups
      join event_contacts on event_contacts.id = follow_ups.contact_id
      where follow_ups.church_id = p_church_id
    ) as follow_up_count,
    coalesce(
      (
        select jsonb_object_agg(status_rows.status, status_rows.count)
        from (
          select event_contacts.status::text as status, count(*) as count
          from event_contacts
          group by event_contacts.status
        ) status_rows
      ),
      '{}'::jsonb
    ) as status_counts,
    coalesce(
      (
        select jsonb_object_agg(interest_rows.interest, interest_rows.count)
        from (
          select contact_interests.interest::text as interest, count(distinct event_contacts.id) as count
          from event_contacts
          join public.contact_interests on contact_interests.contact_id = event_contacts.id
            and contact_interests.church_id = event_contacts.church_id
          group by contact_interests.interest
        ) interest_rows
      ),
      '{}'::jsonb
    ) as interest_counts;
$$;

revoke all on function public.event_report_summary(uuid, uuid) from public, anon, authenticated;
grant execute on function public.event_report_summary(uuid, uuid) to authenticated;

drop function if exists public.reset_church_contact_data(uuid);

create function public.reset_church_contact_data(p_church_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    raise exception 'Login is required.';
  end if;

  if not (
    private.is_app_admin()
    or exists (
      select 1
      from public.church_memberships
      where church_id = p_church_id
        and user_id = auth.uid()
        and role = 'admin'
        and status = 'active'
    )
  ) then
    raise exception 'You do not have permission to reset contact data.';
  end if;

  delete from public.generated_messages
  where church_id = p_church_id;

  delete from public.prayer_requests
  where church_id = p_church_id;

  delete from public.follow_ups
  where church_id = p_church_id;

  delete from public.contact_form_answers
  where church_id = p_church_id;

  delete from public.contact_interests
  where church_id = p_church_id;

  delete from public.contact_journey_events
  where church_id = p_church_id;

  update public.data_requests
  set related_contact_id = null,
      updated_at = now()
  where church_id = p_church_id
    and related_contact_id is not null;

  delete from public.contacts
  where church_id = p_church_id;

  delete from public.people
  where church_id = p_church_id;

  insert into public.audit_logs (
    church_id,
    actor_user_id,
    target_type,
    action,
    metadata
  )
  values (
    p_church_id,
    auth.uid(),
    'church_contact_data',
    'contact_data.reset',
    jsonb_build_object('reset_at', now())
  );
end;
$$;

revoke all on function public.reset_church_contact_data(uuid) from public;
grant execute on function public.reset_church_contact_data(uuid) to authenticated;

drop function if exists public.submit_event_registration(
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  boolean
);

drop function if exists public.submit_event_registration(
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  boolean
);

drop function if exists public.submit_event_registration(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text,
  boolean
);

drop function if exists public.submit_event_registration(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text[],
  text,
  boolean,
  text,
  text,
  text,
  uuid,
  jsonb,
  text
);

drop function if exists public.submit_event_registration(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text[],
  text,
  boolean,
  text,
  text,
  text,
  uuid,
  text,
  jsonb
);

drop function if exists private.submit_event_registration_impl(
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  boolean
);

drop function if exists private.submit_event_registration_impl(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text,
  boolean
);

drop function if exists private.submit_event_registration_impl(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text[],
  text,
  boolean,
  text,
  text,
  text,
  uuid,
  jsonb,
  text
);

drop function if exists private.submit_event_registration_impl(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text[],
  text,
  boolean,
  text,
  text,
  text,
  uuid,
  text,
  jsonb
);

create or replace function private.submit_event_registration_impl(
  p_slug text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_area text,
  p_language text,
  p_best_time_to_contact text,
  p_interests public.interest_tag[],
  p_message text,
  p_urgency public.urgency_level,
  p_classification_payload jsonb,
  p_prayer_visibility public.prayer_visibility,
  p_consent_scope text[],
  p_preferred_contact_methods text[],
  p_consent_source text,
  p_consent_given boolean,
  p_consent_text_snapshot text,
  p_privacy_policy_version text,
  p_consent_status text,
  p_consent_recorded_by uuid,
  p_form_answers jsonb,
  p_recommended_assigned_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event public.events%rowtype;
  target_church_name text;
  new_contact_id uuid;
  selected_interest public.interest_tag;
  computed_urgency public.urgency_level := coalesce(p_urgency, 'medium'::public.urgency_level);
  computed_due_at timestamptz;
  computed_classification_payload jsonb := coalesce(
    p_classification_payload,
    jsonb_build_object('classification_version', 'rule_v1', 'rule_based', true, 'ready_for_ai', false)
  );
  recommended_role text := coalesce(p_classification_payload->>'recommended_assigned_role', 'elder');
  assigned_owner_id uuid;
  suggested_message text;
  suggested_wa_link text;
  first_name text;
  digits text;
  journey_title text;
  form_answer jsonb;
begin
  if p_consent_given is distinct from true then
    raise exception 'Consent is required before follow-up can be requested.';
  end if;

  if array_length(p_interests, 1) is null then
    raise exception 'Select at least one interest.';
  end if;

  select * into target_event
  from public.events
  where slug = p_slug
    and is_active = true
    and archived_at is null
  limit 1;

  if target_event.id is null then
    raise exception 'This event is not available.';
  end if;

  select name into target_church_name
  from public.churches
  where id = target_event.church_id;

  select id into assigned_owner_id
  from public.team_members
  where church_id = target_event.church_id
    and is_active = true
    and role::text = any(
      case recommended_role
        when 'pastor' then array['pastor','elder','admin']
        when 'elder' then array['elder','pastor','admin']
        when 'bible_worker' then array['bible_worker','pastor','elder','admin']
        when 'health_leader' then array['health_leader','pastor','elder','admin']
        when 'prayer_team' then array['prayer_team','pastor','elder','admin']
        when 'youth_leader' then array['youth_leader','elder','pastor','admin']
        when 'family_ministries' then array['elder','pastor','admin']
        when 'deacon_deaconess' then array['elder','pastor','admin']
        when 'interest_coordinator' then array['elder','pastor','admin']
        when 'event_leader' then array['elder','pastor','admin']
        when 'admin_secretary' then array['elder','pastor','admin']
        when 'general_follow_up_team' then array['elder','pastor','admin']
        else array['elder','pastor','admin']
      end
    )
  order by array_position(
    case recommended_role
      when 'pastor' then array['pastor','elder','admin']
      when 'elder' then array['elder','pastor','admin']
      when 'bible_worker' then array['bible_worker','pastor','elder','admin']
      when 'health_leader' then array['health_leader','pastor','elder','admin']
      when 'prayer_team' then array['prayer_team','pastor','elder','admin']
      when 'youth_leader' then array['youth_leader','elder','pastor','admin']
      when 'family_ministries' then array['elder','pastor','admin']
      when 'deacon_deaconess' then array['elder','pastor','admin']
      when 'interest_coordinator' then array['elder','pastor','admin']
      when 'event_leader' then array['elder','pastor','admin']
      when 'admin_secretary' then array['elder','pastor','admin']
      when 'general_follow_up_team' then array['elder','pastor','admin']
      else array['elder','pastor','admin']
    end,
    role::text
  ), display_name
  limit 1;

  insert into public.contacts (
    church_id,
    event_id,
    full_name,
    phone,
    email,
    whatsapp_number,
    area,
    language,
    best_time_to_contact,
    status,
    urgency,
    assigned_to,
    recommended_assigned_role,
    consent_given,
    consent_at,
    consent_source,
    consent_scope,
    preferred_contact_methods,
    consent_text_snapshot,
    privacy_policy_version,
    consent_status,
    consent_recorded_by,
    source,
    classification_payload
  )
  values (
    target_event.church_id,
    target_event.id,
    p_full_name,
    nullif(p_phone, ''),
    nullif(p_email, ''),
    nullif(p_phone, ''),
    nullif(p_area, ''),
    coalesce(nullif(p_language, ''), 'English'),
    nullif(p_best_time_to_contact, ''),
    case when assigned_owner_id is null then 'new'::public.follow_up_status else 'assigned'::public.follow_up_status end,
    computed_urgency,
    assigned_owner_id,
    p_recommended_assigned_role,
    true,
    now(),
    coalesce(nullif(p_consent_source, ''), target_event.event_type::text),
    coalesce(p_consent_scope, array['follow_up']::text[]),
    coalesce(p_preferred_contact_methods, array[]::text[]),
    nullif(p_consent_text_snapshot, ''),
    coalesce(p_privacy_policy_version, 'v1.0'),
    coalesce(p_consent_status, 'given'),
    p_consent_recorded_by,
    'public_form',
    computed_classification_payload
  )
  returning id into new_contact_id;

  foreach selected_interest in array p_interests loop
    insert into public.contact_interests (church_id, contact_id, interest)
    values (target_event.church_id, new_contact_id, selected_interest)
    on conflict (contact_id, interest) do nothing;
  end loop;

  -- Insert form answers if provided
  if jsonb_array_length(coalesce(p_form_answers, '[]'::jsonb)) > 0 then
    for form_answer in select * from jsonb_to_recordset(coalesce(p_form_answers, '[]'::jsonb)) as x(
      question_name text,
      question_label text,
      question_type text,
      answer_value jsonb,
      answer_display jsonb
    )
    loop
      insert into public.contact_form_answers (
        church_id,
        contact_id,
        event_id,
        question_name,
        question_label,
        question_type,
        answer_value,
        answer_display
      )
      values (
        target_event.church_id,
        new_contact_id,
        target_event.id,
        form_answer.question_name,
        form_answer.question_label,
        form_answer.question_type,
        form_answer.answer_value,
        form_answer.answer_display
      );
    end loop;
  end if;

  if nullif(trim(coalesce(p_message, '')), '') is not null then
    insert into public.prayer_requests (church_id, contact_id, request_text, visibility)
    values (target_event.church_id, new_contact_id, trim(p_message), coalesce(p_prayer_visibility, 'general_prayer'::public.prayer_visibility));
  end if;

  computed_due_at := private.default_follow_up_due_at(computed_urgency, computed_classification_payload);

  insert into public.follow_ups (church_id, contact_id, assigned_to, channel, status, next_action, due_at)
  values (
    target_event.church_id,
    new_contact_id,
    assigned_owner_id,
    'note',
    case when assigned_owner_id is null then 'new'::public.follow_up_status else 'assigned'::public.follow_up_status end,
    coalesce(computed_classification_payload->>'recommended_next_action', 'Assign first follow-up within 48 hours.'),
    computed_due_at
  );

  first_name := coalesce(nullif(split_part(trim(p_full_name), ' ', 1), ''), 'there');
  suggested_message := case
    when 'pastoral_visit'::public.interest_tag = any(p_interests) then
      'Good day ' || first_name || ', thank you for connecting with ' || coalesce(target_church_name, 'our church') || ' after ' || target_event.name || '. You mentioned that you would appreciate a pastoral visit. Would it be okay if one of our pastoral team members contacts you to find a suitable time?'
    when 'baptism'::public.interest_tag = any(p_interests) then
      'Good day ' || first_name || ', thank you for reaching out to ' || coalesce(target_church_name, 'our church') || ' after ' || target_event.name || '. Thank you for sharing your baptism request. We would be honoured to connect you with a Bible worker who can walk with you through preparation. Would it also be helpful if we shared Bible study options with you?'
    when 'prayer'::public.interest_tag = any(p_interests) then
      'Good day ' || first_name || ', thank you for trusting ' || coalesce(target_church_name, 'our church') || ' after ' || target_event.name || '. We have received your prayer request, and we will handle it with care. Would you like someone from our prayer team to check in with you?'
    when 'bible_study'::public.interest_tag = any(p_interests) then
      'Good day ' || first_name || ', thank you for connecting with ' || coalesce(target_church_name, 'our church') || ' after ' || target_event.name || '. We are glad you are interested in Bible study. Would it be okay if one of our Bible workers contacts you and shares the available study options?'
    when 'health'::public.interest_tag = any(p_interests) then
      'Good day ' || first_name || ', thank you for connecting with ' || coalesce(target_church_name, 'our church') || ' after ' || target_event.name || '. You showed interest in health resources. Would you like us to send a simple resource and let you know about the next health program?'
    when 'cooking_class'::public.interest_tag = any(p_interests) then
      'Good day ' || first_name || ', thank you for connecting with ' || coalesce(target_church_name, 'our church') || ' after ' || target_event.name || '. You selected cooking class updates. Would you like us to send details when the next healthy cooking session is planned?'
    else
      'Good day ' || first_name || ', thank you for visiting ' || coalesce(target_church_name, 'our church') || ' after ' || target_event.name || '. We are grateful you connected with us. Would it be okay if one of our team members follows up with you this week?'
  end;

  digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if digits like '0%' then
    digits := '27' || substring(digits from 2);
  end if;
  suggested_wa_link := 'https://wa.me/' || digits || '?text=' || replace(replace(replace(replace(suggested_message, '%', '%25'), ' ', '%20'), '&', '%26'), '?', '%3F');

  insert into public.generated_messages (
    church_id,
    contact_id,
    channel,
    message_text,
    wa_link,
    prompt_version,
    purpose
  )
  values (
    target_event.church_id,
    new_contact_id,
    'whatsapp',
    suggested_message,
    suggested_wa_link,
    'v1_suggested_rpc',
    'suggested_whatsapp'
  );

  journey_title := 'Submitted ' || target_event.name;

  insert into public.contact_journey_events (
    church_id,
    person_id,
    contact_id,
    event_id,
    event_type,
    title,
    summary,
    selected_interests,
    classification_payload
  )
  select
    contacts.church_id,
    contacts.person_id,
    contacts.id,
    target_event.id,
    target_event.event_type,
    journey_title,
    computed_classification_payload->>'summary',
    p_interests,
    computed_classification_payload
  from public.contacts
  where contacts.id = new_contact_id
    and contacts.person_id is not null;

  return new_contact_id;
end;
$$;

revoke all on function private.submit_event_registration_impl(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text[],
  text,
  boolean,
  text,
  text,
  text,
  uuid,
  jsonb,
  text) from public, anon, authenticated;

grant execute on function private.submit_event_registration_impl(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text[],
  text,
  boolean,
  text,
  text,
  text,
  uuid,
  jsonb,
  text) to anon, authenticated;

create or replace function public.submit_event_registration(
  p_slug text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_area text,
  p_language text,
  p_best_time_to_contact text,
  p_interests public.interest_tag[],
  p_message text,
  p_urgency public.urgency_level,
  p_classification_payload jsonb,
  p_prayer_visibility public.prayer_visibility,
  p_consent_scope text[],
  p_preferred_contact_methods text[],
  p_consent_source text,
  p_consent_given boolean,
  p_consent_text_snapshot text,
  p_privacy_policy_version text,
  p_consent_status text,
  p_consent_recorded_by uuid,
  p_form_answers jsonb,
  p_recommended_assigned_role text
)
returns uuid
language sql
security invoker
set search_path = public
as $$
  select private.submit_event_registration_impl(
    p_slug,
    p_full_name,
    p_phone,
    p_email,
    p_area,
    p_language,
    p_best_time_to_contact,
    p_interests,
    p_message,
    p_urgency,
    p_classification_payload,
    p_prayer_visibility,
    p_consent_scope,
    p_preferred_contact_methods,
    p_consent_source,
    p_consent_given,
    p_consent_text_snapshot,
    p_privacy_policy_version,
    p_consent_status,
    p_consent_recorded_by,
    p_form_answers,
    p_recommended_assigned_role
  );
$$;

grant execute on function public.submit_event_registration(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  public.interest_tag[],
  text,
  public.urgency_level,
  jsonb,
  public.prayer_visibility,
  text[],
  text[],
  text,
  boolean,
  text,
  text,
  text,
  uuid,
  jsonb,
  text
) to anon, authenticated;

drop function if exists public.owner_church_profiles_page(uuid, text, integer, integer);

create or replace function public.owner_church_profiles_page(
  p_church_id uuid,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  membership_id uuid,
  user_id uuid,
  full_name text,
  email text,
  phone text,
  role text,
  status text,
  membership_created_at timestamptz,
  app_admin_role text,
  is_protected_owner boolean,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.require_app_admin();

  return query
  with filtered as (
    select
      cm.id as membership_id,
      cm.user_id,
      p.full_name,
      p.email,
      p.phone,
      cm.role::text as role,
      cm.status::text as status,
      cm.created_at as membership_created_at,
      aa.role::text as app_admin_role,
      coalesce(aa.is_protected_owner, false) as is_protected_owner
    from public.church_memberships cm
    left join public.profiles p on p.id = cm.user_id
    left join public.app_admins aa on aa.user_id = cm.user_id
    where cm.church_id = p_church_id
      and (
        p_search is null
        or p_search = ''
        or p.full_name ilike ('%' || p_search || '%')
        or p.email ilike ('%' || p_search || '%')
        or p.phone ilike ('%' || p_search || '%')
        or cm.user_id::text ilike ('%' || p_search || '%')
      )
  )
  select
    filtered.*,
    count(*) over() as total_count
  from filtered
  order by membership_created_at desc
  limit greatest(1, least(p_limit, 100))
  offset greatest(0, p_offset);
end;
$$;

revoke all on function public.owner_church_profiles_page(uuid, text, integer, integer) from public;
grant execute on function public.owner_church_profiles_page(uuid, text, integer, integer) to authenticated;

drop function if exists public.owner_church_events_page(uuid, text, integer, integer);

create or replace function public.owner_church_events_page(
  p_church_id uuid,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  event_type text,
  starts_on date,
  location text,
  slug text,
  is_active boolean,
  archived_at timestamptz,
  created_at timestamptz,
  contact_count bigint,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.require_app_admin();

  return query
  with filtered as (
    select
      e.id,
      e.name,
      e.event_type::text as event_type,
      e.starts_on,
      e.location,
      e.slug,
      e.is_active,
      e.archived_at,
      e.created_at,
      (
        select count(*)
        from public.contacts c
        where c.event_id = e.id
          and c.church_id = e.church_id
          and c.deleted_at is null
      ) as contact_count
    from public.events e
    where e.church_id = p_church_id
      and (
        p_search is null
        or p_search = ''
        or e.name ilike ('%' || p_search || '%')
        or e.location ilike ('%' || p_search || '%')
        or e.slug ilike ('%' || p_search || '%')
      )
  )
  select
    filtered.*,
    count(*) over() as total_count
  from filtered
  order by created_at desc
  limit greatest(1, least(p_limit, 100))
  offset greatest(0, p_offset);
end;
$$;

revoke all on function public.owner_church_events_page(uuid, text, integer, integer) from public;
grant execute on function public.owner_church_events_page(uuid, text, integer, integer) to authenticated;

-- Handling Role Assignment Safety Migration
-- Phase 1: Add constraints and follow_ups.assigned_handling_role

-- Validate contact handling roles before adding constraints
do $$
declare
  invalid_count integer;
begin
  select count(*) into invalid_count
  from public.contacts
  where assigned_handling_role is not null
    and assigned_handling_role not in (
      'pastor',
      'elder',
      'bible_worker',
      'prayer_team',
      'health_leader',
      'youth_leader',
      'family_ministries',
      'deacon_deaconess',
      'interest_coordinator',
      'event_leader',
      'admin_secretary',
      'general_follow_up_team'
    );

  if invalid_count > 0 then
    raise exception 'Cannot add contacts_assigned_handling_role_check: % invalid assigned_handling_role values found.', invalid_count;
  end if;
end $$;

-- Validate recommended roles before adding constraints
do $$
declare
  invalid_count integer;
begin
  select count(*) into invalid_count
  from public.contacts
  where recommended_assigned_role is not null
    and recommended_assigned_role not in (
      'pastor',
      'elder',
      'bible_worker',
      'prayer_team',
      'health_leader',
      'youth_leader',
      'family_ministries',
      'deacon_deaconess',
      'interest_coordinator',
      'event_leader',
      'admin_secretary',
      'general_follow_up_team'
    );

  if invalid_count > 0 then
    raise exception 'Cannot add contacts_recommended_assigned_role_check: % invalid recommended_assigned_role values found.', invalid_count;
  end if;
end $$;

alter table if exists public.contacts
  drop constraint if exists contacts_assigned_handling_role_check;

alter table if exists public.contacts
  add constraint contacts_assigned_handling_role_check
  check (
    assigned_handling_role is null
    or assigned_handling_role in (
      'pastor',
      'elder',
      'bible_worker',
      'prayer_team',
      'health_leader',
      'youth_leader',
      'family_ministries',
      'deacon_deaconess',
      'interest_coordinator',
      'event_leader',
      'admin_secretary',
      'general_follow_up_team'
    )
  );

alter table if exists public.contacts
  drop constraint if exists contacts_recommended_assigned_role_check;

alter table if exists public.contacts
  add constraint contacts_recommended_assigned_role_check
  check (
    recommended_assigned_role is null
    or recommended_assigned_role in (
      'pastor',
      'elder',
      'bible_worker',
      'prayer_team',
      'health_leader',
      'youth_leader',
      'family_ministries',
      'deacon_deaconess',
      'interest_coordinator',
      'event_leader',
      'admin_secretary',
      'general_follow_up_team'
    )
  );

alter table if exists public.follow_ups
  add column if not exists assigned_handling_role text;

alter table if exists public.follow_ups
  drop constraint if exists follow_ups_assigned_handling_role_check;

alter table if exists public.follow_ups
  add constraint follow_ups_assigned_handling_role_check
  check (
    assigned_handling_role is null
    or assigned_handling_role in (
      'pastor',
      'elder',
      'bible_worker',
      'prayer_team',
      'health_leader',
      'youth_leader',
      'family_ministries',
      'deacon_deaconess',
      'interest_coordinator',
      'event_leader',
      'admin_secretary',
      'general_follow_up_team'
    )
  );

create index if not exists follow_ups_church_handling_role_idx
on public.follow_ups(church_id, assigned_handling_role, due_at)
where completed_at is null;

-- Backfill contacts with recommended roles
update public.contacts
set assigned_handling_role = recommended_assigned_role,
    updated_at = now()
where assigned_handling_role is null
  and recommended_assigned_role is not null
  and deleted_at is null;

-- Backfill follow-up history from current contact handling role
update public.follow_ups fu
set assigned_handling_role = c.assigned_handling_role,
    updated_at = now()
from public.contacts c
where fu.contact_id = c.id
  and fu.church_id = c.church_id
  and fu.assigned_handling_role is null
  and c.assigned_handling_role is not null;
