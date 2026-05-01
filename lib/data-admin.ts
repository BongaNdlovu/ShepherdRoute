import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OwnerChurchSummary = {
  church_id: string;
  church_name: string;
  created_at: string;
  team_count: number;
  event_count: number;
  contact_count: number;
  new_contact_count: number;
};

export type OwnerAccountRow = {
  church_id: string;
  church_name: string;
  church_created_at: string;
  membership_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: "active" | "invited" | "disabled";
  membership_created_at: string;
  team_member_id: string | null;
  team_member_name: string | null;
  team_member_active: boolean;
  app_admin_role: "owner" | "support_admin" | "billing_admin" | null;
  is_protected_owner: boolean;
  event_count: number;
  contact_count: number;
};

export type OwnerInvitationRow = {
  church_id: string;
  church_name: string;
  invitation_id: string;
  team_member_id: string | null;
  display_name: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  invited_by_name: string | null;
  accepted_by_name: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type OwnerPaginationParams = {
  q?: string;
  page?: string;
  pageSize?: string;
};

export type OwnerPaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type OwnerChurchListItem = {
  church_id: string;
  church_name: string;
  created_at: string;
  team_count: number;
  profile_count: number;
  event_count: number;
  contact_count: number;
  new_contact_count: number;
};

export type OwnerChurchDetail = {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  team_count: number;
  profile_count: number;
  event_count: number;
  contact_count: number;
  new_contact_count: number;
};

export type OwnerChurchTeamRow = {
  id: string;
  display_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  membership_id: string | null;
  created_at: string;
};

export type OwnerChurchProfileRow = {
  membership_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: "active" | "invited" | "disabled";
  membership_created_at: string;
  app_admin_role: "owner" | "support_admin" | "billing_admin" | null;
  is_protected_owner: boolean;
};

export type OwnerChurchEventRow = {
  id: string;
  name: string;
  event_type: string;
  starts_on: string | null;
  location: string | null;
  slug: string;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  contact_count: number;
};

export type OwnerChurchContactRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  area: string | null;
  status: string;
  urgency: "low" | "medium" | "high";
  event_id: string | null;
  event_name: string | null;
  assigned_name: string | null;
  created_at: string;
};

function normalizePage(value?: string) {
  return Math.max(1, Number(value ?? 1) || 1);
}

function normalizePageSize(value?: string) {
  return Math.min(100, Math.max(10, Number(value ?? 25) || 25));
}

function pageResult<T>(items: T[], total: number, page: number, pageSize: number): OwnerPaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getOwnerChurchSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_church_summaries");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerChurchSummary[];
}

export async function getOwnerInvitationRows() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_invitation_rows");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerInvitationRow[];
}

export async function getOwnerAccountRows() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_account_rows");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerAccountRow[];
}

export async function getOwnerChurchesPage(params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchListItem>> {
  const supabase = await createClient();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const q = params.q?.trim();

  let query = supabase
    .from("churches")
    .select("id, name, created_at, team_members(count), church_memberships(count), events(count), contacts(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((church) => ({
    church_id: church.id,
    church_name: church.name,
    created_at: church.created_at,
    team_count: Array.isArray(church.team_members) ? church.team_members[0]?.count ?? 0 : 0,
    profile_count: Array.isArray(church.church_memberships) ? church.church_memberships[0]?.count ?? 0 : 0,
    event_count: Array.isArray(church.events) ? church.events[0]?.count ?? 0 : 0,
    contact_count: Array.isArray(church.contacts) ? church.contacts[0]?.count ?? 0 : 0,
    new_contact_count: 0
  }));

  return pageResult(items, count ?? 0, page, pageSize);
}

export async function getOwnerChurchDetail(churchId: string): Promise<OwnerChurchDetail> {
  const supabase = await createClient();

  const [{ data: church, error }, { count: teamCount }, { count: profileCount }, { count: eventCount }, { count: contactCount }, { count: newContactCount }] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, timezone, created_at, updated_at")
      .eq("id", churchId)
      .single(),
    supabase.from("team_members").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_memberships").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("church_id", churchId).is("deleted_at", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("church_id", churchId).eq("status", "new").is("deleted_at", null)
  ]);

  if (error || !church) {
    throw new Error(error?.message ?? "Church not found.");
  }

  return {
    id: church.id,
    name: church.name,
    timezone: church.timezone,
    created_at: church.created_at,
    updated_at: church.updated_at,
    team_count: teamCount ?? 0,
    profile_count: profileCount ?? 0,
    event_count: eventCount ?? 0,
    contact_count: contactCount ?? 0,
    new_contact_count: newContactCount ?? 0
  };
}

export async function getOwnerChurchTeamPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchTeamRow>> {
  const supabase = await createClient();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const q = params.q?.trim();

  let query = supabase
    .from("team_members")
    .select("id, display_name, role, phone, email, is_active, membership_id, created_at", { count: "exact" })
    .eq("church_id", churchId)
    .order("display_name")
    .range(offset, offset + pageSize - 1);

  if (q) {
    query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return pageResult((data ?? []) as OwnerChurchTeamRow[], count ?? 0, page, pageSize);
}

export async function getOwnerChurchProfilesPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchProfileRow>> {
  const supabase = await createClient();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const q = params.q?.trim();

  let query = supabase
    .from("church_memberships")
    .select("id, user_id, role, status, created_at, profiles(full_name, email, phone), app_admins(role, is_protected_owner)", { count: "exact" })
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (q) {
    query = query.or(`profiles.full_name.ilike.%${q}%,profiles.email.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const appAdmin = Array.isArray(row.app_admins) ? row.app_admins[0] : row.app_admins;

    return {
      membership_id: row.id,
      user_id: row.user_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      role: row.role,
      status: row.status,
      membership_created_at: row.created_at,
      app_admin_role: appAdmin?.role ?? null,
      is_protected_owner: appAdmin?.is_protected_owner ?? false
    };
  }) as OwnerChurchProfileRow[];

  return pageResult(items, count ?? 0, page, pageSize);
}

export async function getOwnerChurchEventsPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchEventRow>> {
  const supabase = await createClient();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const q = params.q?.trim();

  let query = supabase
    .from("events")
    .select("id, name, event_type, starts_on, location, slug, is_active, archived_at, created_at, contacts(count)", { count: "exact" })
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (q) {
    query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []).map((event) => ({
    id: event.id,
    name: event.name,
    event_type: event.event_type,
    starts_on: event.starts_on,
    location: event.location,
    slug: event.slug,
    is_active: event.is_active,
    archived_at: event.archived_at,
    created_at: event.created_at,
    contact_count: Array.isArray(event.contacts) ? event.contacts[0]?.count ?? 0 : 0
  }));

  return pageResult(items, count ?? 0, page, pageSize);
}

export async function getOwnerChurchContactsPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchContactRow>> {
  const supabase = await createClient();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const q = params.q?.trim();

  let query = supabase
    .from("contacts")
    .select("id, full_name, phone, email, area, status, urgency, event_id, created_at, events(name), team_members(display_name)", { count: "exact" })
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,area.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []).map((contact) => {
    const event = Array.isArray(contact.events) ? contact.events[0] : contact.events;
    const teamMember = Array.isArray(contact.team_members) ? contact.team_members[0] : contact.team_members;

    return {
      id: contact.id,
      full_name: contact.full_name,
      phone: contact.phone,
      email: contact.email,
      area: contact.area,
      status: contact.status,
      urgency: contact.urgency,
      event_id: contact.event_id,
      event_name: event?.name ?? null,
      assigned_name: teamMember?.display_name ?? null,
      created_at: contact.created_at
    };
  }) as OwnerChurchContactRow[];

  return pageResult(items, count ?? 0, page, pageSize);
}
