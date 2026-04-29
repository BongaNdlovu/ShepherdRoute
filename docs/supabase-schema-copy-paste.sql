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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  membership_id uuid references public.church_memberships(id) on delete set null,
  display_name text not null,
  role public.team_role not null default 'viewer',
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  event_id uuid references public.events(id) on delete set null,
  full_name text not null,
  phone text not null,
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
  consent_given boolean not null default false,
  consent_at timestamptz,
  consent_source text,
  consent_scope text[] not null default array[]::text[],
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists church_memberships_user_idx on public.church_memberships(user_id, status);
create index if not exists church_memberships_church_idx on public.church_memberships(church_id, role, status);
create index if not exists team_members_church_active_idx on public.team_members(church_id, is_active);
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
create index if not exists prayer_requests_contact_idx on public.prayer_requests(contact_id, created_at desc);
create index if not exists prayer_requests_visibility_idx on public.prayer_requests(church_id, visibility);
create index if not exists generated_messages_contact_idx on public.generated_messages(contact_id, created_at desc);
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
    when coalesce(p_classification_payload->'recommended_tags', '[]'::jsonb) ?| array['bible_study','prayer'] then now() + interval '2 days'
    else now() + interval '5 days'
  end;
$$;

create or replace function private.prepare_contact_identity()
returns trigger
language plpgsql
security definer
set search_path = public
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
begin
  church_name := coalesce(new.raw_user_meta_data->>'church_name', 'New church');
  full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Church admin');

  insert into public.profiles (id, full_name, email)
  values (new.id, full_name, new.email)
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email;

  insert into public.churches (name)
  values (church_name)
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

revoke all on function private.is_church_member(uuid) from public, anon, authenticated;
revoke all on function private.is_app_admin() from public, anon, authenticated;
revoke all on function private.has_church_role(uuid, public.team_role[]) from public, anon, authenticated;
grant execute on function private.is_church_member(uuid) to anon, authenticated;
grant execute on function private.is_app_admin() to anon, authenticated;
grant execute on function private.has_church_role(uuid, public.team_role[]) to anon, authenticated;

alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.church_memberships enable row level security;
alter table public.app_admins enable row level security;
alter table public.team_members enable row level security;
alter table public.events enable row level security;
alter table public.people enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_interests enable row level security;
alter table public.contact_journey_events enable row level security;
alter table public.follow_ups enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.generated_messages enable row level security;

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
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Admins can manage memberships" on public.church_memberships;
create policy "Admins can manage memberships"
on public.church_memberships for all
using (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]))
with check (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]));

drop policy if exists "App admins can view own admin row" on public.app_admins;
create policy "App admins can view own admin row"
on public.app_admins for select
using (user_id = auth.uid());

drop policy if exists "Members can view church team" on public.team_members;
create policy "Members can view church team"
on public.team_members for select
using (private.is_church_member(church_id) or private.is_app_admin());

drop policy if exists "Leaders can manage church team" on public.team_members;
create policy "Leaders can manage church team"
on public.team_members for all
using (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]))
with check (private.has_church_role(church_id, array['admin','pastor']::public.team_role[]));

drop policy if exists "Members can view church events" on public.events;
create policy "Members can view church events"
on public.events for select
using (private.is_church_member(church_id) or private.is_app_admin() or is_active = true);

drop policy if exists "Leaders can manage church events" on public.events;
create policy "Leaders can manage church events"
on public.events for all
using (private.has_church_role(church_id, array['admin','pastor','elder','health_leader','youth_leader']::public.team_role[]))
with check (private.has_church_role(church_id, array['admin','pastor','elder','health_leader','youth_leader']::public.team_role[]));

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

drop function if exists public.is_church_member(uuid);
drop function if exists public.is_app_admin();
drop function if exists public.has_church_role(uuid, public.team_role[]);

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
  churches.name as church_name
from public.events
join public.churches on churches.id = events.church_id
where events.is_active = true
  and events.archived_at is null;

grant select on public.public_events to anon, authenticated;
grant select on public.churches, public.events to anon, authenticated;

drop function if exists public.owner_church_summaries();

create or replace function public.owner_church_summaries()
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
security invoker
set search_path = public
as $$
begin
  if not private.is_app_admin() then
    raise exception 'Only ShepardRoute app admins can view owner summaries.';
  end if;

  return query
  select
    churches.id,
    churches.name,
    churches.created_at,
    count(distinct team_members.id) filter (where team_members.is_active) as team_count,
    count(distinct events.id) as event_count,
    count(distinct contacts.id) as contact_count,
    count(distinct contacts.id) filter (where contacts.status = 'new') as new_contact_count
  from public.churches
  left join public.team_members on team_members.church_id = churches.id
  left join public.events on events.church_id = churches.id
  left join public.contacts on contacts.church_id = churches.id
  group by churches.id, churches.name, churches.created_at
  order by churches.created_at desc;
end;
$$;

revoke all on function public.owner_church_summaries() from public, anon, authenticated;
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
  event_count bigint,
  contact_count bigint
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not private.is_app_admin() then
    raise exception 'Only ShepardRoute app admins can view account rows.';
  end if;

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
    count(distinct events.id) as event_count,
    count(distinct contacts.id) as contact_count
  from public.churches
  join public.church_memberships on church_memberships.church_id = churches.id
  left join public.profiles on profiles.id = church_memberships.user_id
  left join public.team_members on team_members.membership_id = church_memberships.id
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
    team_members.is_active
  order by churches.created_at desc, church_memberships.created_at asc;
end;
$$;

revoke all on function public.owner_account_rows() from public, anon, authenticated;
grant execute on function public.owner_account_rows() to authenticated;

drop function if exists public.owner_update_membership_status(uuid, public.membership_status);

create or replace function public.owner_update_membership_status(
  p_membership_id uuid,
  p_status public.membership_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_membership public.church_memberships%rowtype;
begin
  if not private.is_app_admin() then
    raise exception 'Only ShepardRoute app admins can update account access.';
  end if;

  select *
  into target_membership
  from public.church_memberships
  where id = p_membership_id
  limit 1;

  if target_membership.id is null then
    raise exception 'Membership not found.';
  end if;

  update public.church_memberships
  set status = p_status,
      updated_at = now()
  where id = target_membership.id;

  update public.team_members
  set is_active = p_status = 'active',
      updated_at = now()
  where membership_id = target_membership.id;
end;
$$;

revoke all on function public.owner_update_membership_status(uuid, public.membership_status) from public, anon, authenticated;
grant execute on function public.owner_update_membership_status(uuid, public.membership_status) to authenticated;

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
    where events.church_id = p_church_id
    group by events.id, events.name, events.event_type, events.created_at
  )
  select
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
    ) as total_contacts,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.status <> 'new'
    ) as followed_up_count,
    (
      select count(distinct contacts.id)
      from public.contacts
      join public.contact_interests on contact_interests.contact_id = contacts.id
        and contact_interests.church_id = contacts.church_id
      where contacts.church_id = p_church_id
        and contact_interests.interest = 'bible_study'
    ) as bible_study_count,
    (
      select count(distinct contacts.id)
      from public.contacts
      join public.contact_interests on contact_interests.contact_id = contacts.id
        and contact_interests.church_id = contacts.church_id
      where contacts.church_id = p_church_id
        and contact_interests.interest = 'prayer'
    ) as prayer_count,
    (
      select count(distinct contacts.id)
      from public.contacts
      join public.contact_interests on contact_interests.contact_id = contacts.id
        and contact_interests.church_id = contacts.church_id
      where contacts.church_id = p_church_id
        and contact_interests.interest in ('health', 'cooking_class')
    ) as health_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.urgency = 'high'
    ) as high_priority_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.assigned_to is null
        and contacts.status <> 'closed'
    ) as unassigned_count,
    (
      select count(distinct follow_ups.contact_id)
      from public.follow_ups
      join public.contacts on contacts.id = follow_ups.contact_id
      where follow_ups.church_id = p_church_id
        and contacts.status <> 'closed'
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
        and follow_ups.completed_at is null
        and follow_ups.due_at < now()
    ) as overdue_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.status = 'waiting'
        and contacts.status <> 'closed'
    ) as waiting_reply_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.consent_given is distinct from true
        and contacts.status <> 'closed'
    ) as no_consent_count,
    (
      select count(*)
      from public.contacts
      where contacts.church_id = p_church_id
        and contacts.do_not_contact = true
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
  p_consent_source text,
  p_consent_given boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event public.events%rowtype;
  new_contact_id uuid;
  interest public.interest_tag;
  computed_urgency public.urgency_level := coalesce(p_urgency, 'medium'::public.urgency_level);
  computed_due_at timestamptz;
  computed_classification_payload jsonb := coalesce(
    p_classification_payload,
    jsonb_build_object('classification_version', 'rule_v1', 'rule_based', true, 'ready_for_ai', false)
  );
  journey_title text;
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
    consent_given,
    consent_at,
    consent_source,
    consent_scope,
    source,
    classification_payload
  )
  values (
    target_event.church_id,
    target_event.id,
    p_full_name,
    p_phone,
    nullif(p_email, ''),
    p_phone,
    nullif(p_area, ''),
    coalesce(nullif(p_language, ''), 'English'),
    nullif(p_best_time_to_contact, ''),
    'new',
    computed_urgency,
    true,
    now(),
    coalesce(nullif(p_consent_source, ''), target_event.event_type::text),
    coalesce(p_consent_scope, array['follow_up']::text[]),
    'public_form',
    computed_classification_payload
  )
  returning id into new_contact_id;

  foreach interest in array p_interests loop
    insert into public.contact_interests (church_id, contact_id, interest)
    values (target_event.church_id, new_contact_id, interest)
    on conflict (contact_id, interest) do nothing;
  end loop;

  if nullif(trim(coalesce(p_message, '')), '') is not null then
    insert into public.prayer_requests (church_id, contact_id, request_text, visibility)
    values (target_event.church_id, new_contact_id, trim(p_message), coalesce(p_prayer_visibility, 'general_prayer'::public.prayer_visibility));
  end if;

  computed_due_at := private.default_follow_up_due_at(computed_urgency, computed_classification_payload);

  insert into public.follow_ups (church_id, contact_id, channel, status, next_action, due_at)
  values (
    target_event.church_id,
    new_contact_id,
    'note',
    'new',
    coalesce(computed_classification_payload->>'recommended_next_action', 'Assign first follow-up within 48 hours.'),
    computed_due_at
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
  text,
  boolean
) from public, anon, authenticated;

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
  text,
  boolean
) to anon, authenticated;

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
  p_consent_source text,
  p_consent_given boolean
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
    p_consent_source,
    p_consent_given
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
  text,
  boolean
) to anon, authenticated;
