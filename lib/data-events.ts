import { notFound } from "next/navigation";
import type { FollowUpChannel, FollowUpStatus, Interest } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const EVENT_CONTACT_LIMIT = 100;

type RpcError = { message: string };
type EventWorkspaceSummaryRpcRow = {
  event: unknown;
  total_contacts: number | string | null;
  new_contacts: number | string | null;
  assigned_contacts: number | string | null;
  pending_follow_ups: number | string | null;
  completed_follow_ups: number | string | null;
  overdue_follow_ups: number | string | null;
  high_urgency_contacts: number | string | null;
  prayer_requests: number | string | null;
  bible_study_interests: number | string | null;
  baptism_interests: number | string | null;
  health_interests: number | string | null;
  recent_contacts: unknown[] | null;
  due_follow_ups: unknown[] | null;
  team_snapshot: Array<{
    team_member_id: string;
    display_name: string;
    role: string | null;
    assigned_contact_count: number | string | null;
  }> | null;
};

type EventTeamSummaryRpcRow = {
  team_member_id: string;
  display_name: string;
  role: string | null;
  assigned_contact_count: number | string | null;
  pending_count: number | string | null;
  completed_count: number | string | null;
  overdue_count: number | string | null;
  last_activity_at: string | null;
};

type EventPerformanceRpcClient = {
  rpc(
    name: "event_workspace_summary",
    params: { p_church_id: string; p_event_id: string }
  ): Promise<{ data: EventWorkspaceSummaryRpcRow[] | EventWorkspaceSummaryRpcRow | null; error: RpcError | null }>;
  rpc(
    name: "event_team_summary",
    params: { p_church_id: string; p_event_id: string }
  ): Promise<{ data: EventTeamSummaryRpcRow[] | null; error: RpcError | null }>;
};

export type EventContactListItem = {
  id: string;
  full_name: string;
  phone: string;
  area: string | null;
  status: FollowUpStatus;
  urgency: "low" | "medium" | "high";
  created_at: string;
  contact_interests: Array<{ interest: Interest }>;
};

export async function getEvents(churchId: string, options: { includeArchived?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("id, name, event_type, starts_on, location, slug, is_active, archived_at, created_at, form_config, branding_config, public_info, contacts(count)")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  if (!options.includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data } = await query;

  return data ?? [];
}

export async function getEventOptions(churchId: string, options: { includeArchived?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("id, name, event_type, starts_on, location, slug, is_active, archived_at, created_at")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  if (!options.includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data } = await query;

  return data ?? [];
}

export async function getEvent(churchId: string, id: string) {
  const supabase = await createClient();
  const [{ data: event }, { data: contacts, count }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_type, starts_on, location, slug, description, is_active, archived_at, created_at, form_config, branding_config, public_info, contacts(count)")
      .eq("church_id", churchId)
      .eq("id", id)
      .single(),
    supabase
      .from("contacts")
      .select("id, full_name, phone, area, status, urgency, created_at, contact_interests(interest)", { count: "exact" })
      .eq("church_id", churchId)
      .eq("event_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(EVENT_CONTACT_LIMIT)
  ]);

  if (!event) {
    notFound();
  }

  return {
    event,
    contacts: (contacts ?? []) as unknown as EventContactListItem[],
    contactsTotal: count ?? contacts?.length ?? 0,
    contactsLimit: EVENT_CONTACT_LIMIT
  };
}

export type EventWorkspaceSummary = {
  event: {
    id: string;
    church_id: string;
    name: string;
    event_type: string | null;
    starts_on: string | null;
    location: string | null;
    slug: string;
    description: string | null;
    is_active: boolean;
    archived_at: string | null;
    created_at: string;
    form_config?: unknown;
    branding_config?: unknown;
    public_info?: unknown;
  };
  summary: {
    totalContacts: number;
    newContacts: number;
    assignedContacts: number;
    pendingFollowUps: number;
    completedFollowUps: number;
    overdueFollowUps: number;
    highUrgencyContacts: number;
    prayerRequests: number;
    bibleStudyInterests: number;
    baptismInterests: number;
    healthInterests: number;
  };
  recentContacts: EventContactListItem[];
  dueFollowUps: Array<{
    id: string;
    contact_id: string;
    contact_name: string;
    contact_phone: string;
    due_at: string;
    assigned_name: string | null;
    status: FollowUpStatus;
  }>;
  teamSnapshot: Array<{
    teamMemberId: string;
    displayName: string;
    role: string | null;
    assignedContactCount: number;
  }>;
};

export async function getEventWorkspaceSummary(churchId: string, eventId: string): Promise<EventWorkspaceSummary> {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as EventPerformanceRpcClient;
  const { data, error } = await rpcClient.rpc("event_workspace_summary", {
    p_church_id: churchId,
    p_event_id: eventId
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.event) {
    notFound();
  }

  return {
    event: row.event as EventWorkspaceSummary["event"],
    summary: {
      totalContacts: Number(row.total_contacts ?? 0),
      newContacts: Number(row.new_contacts ?? 0),
      assignedContacts: Number(row.assigned_contacts ?? 0),
      pendingFollowUps: Number(row.pending_follow_ups ?? 0),
      completedFollowUps: Number(row.completed_follow_ups ?? 0),
      overdueFollowUps: Number(row.overdue_follow_ups ?? 0),
      highUrgencyContacts: Number(row.high_urgency_contacts ?? 0),
      prayerRequests: Number(row.prayer_requests ?? 0),
      bibleStudyInterests: Number(row.bible_study_interests ?? 0),
      baptismInterests: Number(row.baptism_interests ?? 0),
      healthInterests: Number(row.health_interests ?? 0)
    },
    recentContacts: (row.recent_contacts ?? []) as EventContactListItem[],
    dueFollowUps: (row.due_follow_ups ?? []) as EventWorkspaceSummary["dueFollowUps"],
    teamSnapshot: (row.team_snapshot ?? []).map((member) => ({
      teamMemberId: member.team_member_id,
      displayName: member.display_name,
      role: member.role,
      assignedContactCount: Number(member.assigned_contact_count ?? 0)
    }))
  };
}

export type EventContactsParams = {
  q?: string;
  status?: FollowUpStatus;
  urgency?: "low" | "medium" | "high";
  assignedTo?: string;
  interest?: Interest;
  unassigned?: boolean;
  page?: number;
  pageSize?: number;
};

export type EventContactsPage = {
  contacts: Array<{
    id: string;
    person_id: string | null;
    full_name: string;
    phone: string | null;
    whatsapp_number: string | null;
    email: string | null;
    area: string | null;
    language: string | null;
    best_time_to_contact: string | null;
    status: FollowUpStatus;
    urgency: "low" | "medium" | "high";
    assigned_to: string | null;
    assigned_handling_role: string | null;
    recommended_assigned_role: string | null;
    do_not_contact: boolean;
    preferred_contact_methods: string[] | null;
    duplicate_of_contact_id: string | null;
    duplicate_match_confidence: number | null;
    duplicate_match_reason: string | null;
    assigned_name: string | null;
    created_at: string;
    interests: Interest[];
    total_count: number;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
};

type EventContactRpcRow = EventContactsPage["contacts"][number] & {
  total_count: number | string | bigint | null;
};

export async function getEventContactsPage(
  churchId: string,
  eventId: string,
  params: EventContactsParams = {}
): Promise<EventContactsPage> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_contacts", {
    p_church_id: churchId,
    p_q: params.q ?? null,
    p_status: params.status ?? null,
    p_event_id: eventId,
    p_interest: params.interest ?? null,
    p_assigned_to: params.assignedTo ?? null,
    p_unassigned: params.unassigned ?? false,
    p_limit: pageSize,
    p_offset: offset
  });

  if (error) {
    throw new Error(error.message);
  }

  const contacts = ((data ?? []) as EventContactRpcRow[]).map((row) => ({
    id: row.id,
    person_id: row.person_id,
    full_name: row.full_name,
    phone: row.phone,
    whatsapp_number: row.whatsapp_number,
    email: row.email,
    area: row.area,
    language: row.language,
    best_time_to_contact: row.best_time_to_contact,
    status: row.status,
    urgency: row.urgency,
    assigned_to: row.assigned_to,
    assigned_handling_role: row.assigned_handling_role,
    recommended_assigned_role: row.recommended_assigned_role,
    do_not_contact: row.do_not_contact,
    preferred_contact_methods: row.preferred_contact_methods,
    duplicate_of_contact_id: row.duplicate_of_contact_id,
    duplicate_match_confidence: row.duplicate_match_confidence,
    duplicate_match_reason: row.duplicate_match_reason,
    assigned_name: row.assigned_name,
    created_at: row.created_at,
    interests: row.interests ?? [],
    total_count: Number(row.total_count ?? 0)
  }));

  const totalCount = data[0]?.total_count ?? 0;

  return {
    contacts,
    totalCount,
    page,
    pageSize
  };
}

export type EventFollowUpsParams = {
  status?: "overdue" | "today" | "upcoming" | "completed" | "all";
  assignedTo?: string;
  urgency?: "low" | "medium" | "high";
  page?: number;
  pageSize?: number;
};

export type EventFollowUpsPage = {
  followUps: Array<{
    id: string;
    contact_id: string;
    contact_name: string;
    contact_phone: string;
    contact_do_not_contact: boolean;
    contact_whatsapp: string | null;
    contact_email: string | null;
    contact_status: FollowUpStatus;
    contact_urgency: "low" | "medium" | "high";
    assigned_to: string | null;
    assigned_name: string | null;
    status: FollowUpStatus;
    channel: string | null;
    next_action: string | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
    interests: Interest[];
    suggested_message_id: string | null;
    suggested_message_text: string | null;
    suggested_wa_link: string | null;
    suggested_opened_at: string | null;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
};

type EventFollowUpRpcRow = {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  contact_do_not_contact: boolean;
  contact_whatsapp: string | null;
  contact_email: string | null;
  contact_status: FollowUpStatus;
  contact_urgency: "low" | "medium" | "high";
  assigned_to: string | null;
  assigned_name: string | null;
  status: FollowUpStatus;
  channel: FollowUpChannel | null;
  next_action: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  interests: Interest[] | null;
  suggested_message_id: string | null;
  suggested_message_text: string | null;
  suggested_wa_link: string | null;
  suggested_opened_at: string | null;
  total_count: number | string | bigint | null;
};

export async function getEventFollowUpsPage(
  churchId: string,
  eventId: string,
  params: EventFollowUpsParams = {}
): Promise<EventFollowUpsPage> {
  const supabase = await createClient();
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize ?? 25)));
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("event_follow_ups_page", {
    p_church_id: churchId,
    p_event_id: eventId,
    p_status: params.status ?? "all",
    p_assigned_to: params.assignedTo ?? null,
    p_urgency: params.urgency ?? null,
    p_limit: pageSize,
    p_offset: offset
  });

  if (error) {
    throw new Error(error.message);
  }

  const followUps = ((data ?? []) as EventFollowUpRpcRow[]).map((row) => ({
    id: row.id,
    contact_id: row.contact_id,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_do_not_contact: row.contact_do_not_contact,
    contact_whatsapp: row.contact_whatsapp,
    contact_email: row.contact_email,
    contact_status: row.contact_status,
    contact_urgency: row.contact_urgency,
    assigned_to: row.assigned_to,
    assigned_name: row.assigned_name,
    status: row.status,
    channel: row.channel,
    next_action: row.next_action,
    due_at: row.due_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    interests: row.interests ?? [],
    suggested_message_id: row.suggested_message_id,
    suggested_message_text: row.suggested_message_text,
    suggested_wa_link: row.suggested_wa_link,
    suggested_opened_at: row.suggested_opened_at
  }));

  const totalCount = Number(data?.[0]?.total_count ?? 0);

  return {
    followUps,
    totalCount,
    page,
    pageSize
  };
}

export type EventTeamMemberSummary = {
  teamMemberId: string;
  displayName: string;
  role: string | null;
  assignedContactCount: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
  lastActivityAt: string | null;
};

export async function getEventTeam(churchId: string, eventId: string): Promise<EventTeamMemberSummary[]> {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as EventPerformanceRpcClient;
  const { data, error } = await rpcClient.rpc("event_team_summary", {
    p_church_id: churchId,
    p_event_id: eventId
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    teamMemberId: row.team_member_id,
    displayName: row.display_name,
    role: row.role,
    assignedContactCount: Number(row.assigned_contact_count ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    completedCount: Number(row.completed_count ?? 0),
    overdueCount: Number(row.overdue_count ?? 0),
    lastActivityAt: row.last_activity_at
  }));
}
