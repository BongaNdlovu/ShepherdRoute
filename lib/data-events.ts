import { notFound } from "next/navigation";
import type { FollowUpStatus, Interest } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const EVENT_CONTACT_LIMIT = 100;

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

  const [{ data: event }, totalContacts, newContacts, assignedContacts, pendingFollowUps, completedFollowUps, overdueFollowUps, highUrgencyContacts, eventContactIds, recentContacts, dueFollowUps, teamSnapshot] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("church_id", churchId)
      .eq("id", eventId)
      .single(),

    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .is("archived_at", null),

    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .eq("status", "new")
      .is("deleted_at", null)
      .is("archived_at", null),

    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .not("assigned_to", "is", null)
      .is("deleted_at", null)
      .is("archived_at", null),

    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .is("completed_at", null)
      .gte("due_at", new Date().toISOString()),

    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .not("completed_at", "is", null),

    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .is("completed_at", null)
      .lt("due_at", new Date().toISOString()),

    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .eq("urgency", "high")
      .is("deleted_at", null)
      .is("archived_at", null),

    supabase
      .from("contacts")
      .select("id")
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .is("deleted_at", null),

    supabase
      .from("contacts")
      .select("id, full_name, phone, area, status, urgency, created_at, contact_interests(interest)")
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("follow_ups")
      .select(`
        id,
        contact_id,
        due_at,
        status,
        contacts!inner(full_name, phone),
        team_members(display_name)
      `)
      .eq("church_id", churchId)
      .is("completed_at", null)
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(5),

    supabase
      .from("contacts")
      .select("assigned_to, team_members!inner(display_name, role)")
      .eq("church_id", churchId)
      .eq("event_id", eventId)
      .not("assigned_to", "is", null)
      .is("deleted_at", null)
  ]);

  if (!event) {
    notFound();
  }

  const contactIds = (eventContactIds.data ?? []).map((c: { id: string }) => c.id);

  const [prayerRequests, bibleStudyInterests, baptismInterests, healthInterests] = await Promise.all([
    contactIds.length > 0
      ? supabase
          .from("prayer_requests")
          .select("id", { count: "exact", head: true })
          .eq("church_id", churchId)
          .in("contact_id", contactIds)
      : { count: 0 },

    contactIds.length > 0
      ? supabase
          .from("contact_interests")
          .select("id", { count: "exact", head: true })
          .eq("interest", "bible_study")
          .in("contact_id", contactIds)
      : { count: 0 },

    contactIds.length > 0
      ? supabase
          .from("contact_interests")
          .select("id", { count: "exact", head: true })
          .eq("interest", "baptism")
          .in("contact_id", contactIds)
      : { count: 0 },

    contactIds.length > 0
      ? supabase
          .from("contact_interests")
          .select("id", { count: "exact", head: true })
          .eq("interest", "health")
          .in("contact_id", contactIds)
      : { count: 0 }
  ]);

  const teamMap = new Map<string, { displayName: string; role: string | null; count: number }>();
  (teamSnapshot.data ?? []).forEach((row: { assigned_to: string; team_members: { display_name: string; role: string | null }[] }) => {
    const member = row.team_members[0];
    if (member && row.assigned_to) {
      const existing = teamMap.get(row.assigned_to);
      if (existing) {
        existing.count++;
      } else {
        teamMap.set(row.assigned_to, {
          displayName: member.display_name,
          role: member.role,
          count: 1
        });
      }
    }
  });

  const teamSnapshotArray = Array.from(teamMap.entries()).map(([teamMemberId, data]) => ({
    teamMemberId,
    displayName: data.displayName,
    role: data.role,
    assignedContactCount: data.count
  }));

  return {
    event: event as EventWorkspaceSummary["event"],
    summary: {
      totalContacts: totalContacts.count ?? 0,
      newContacts: newContacts.count ?? 0,
      assignedContacts: assignedContacts.count ?? 0,
      pendingFollowUps: pendingFollowUps.count ?? 0,
      completedFollowUps: completedFollowUps.count ?? 0,
      overdueFollowUps: overdueFollowUps.count ?? 0,
      highUrgencyContacts: highUrgencyContacts.count ?? 0,
      prayerRequests: prayerRequests.count ?? 0,
      bibleStudyInterests: bibleStudyInterests.count ?? 0,
      baptismInterests: baptismInterests.count ?? 0,
      healthInterests: healthInterests.count ?? 0
    },
    recentContacts: (recentContacts.data ?? []) as unknown as EventContactListItem[],
    dueFollowUps: (dueFollowUps.data ?? []).map((row: { id: string; contact_id: string; contacts: { full_name: string; phone: string }[]; team_members: { display_name: string }[]; due_at: string; status: FollowUpStatus }) => ({
      id: row.id,
      contact_id: row.contact_id,
      contact_name: row.contacts[0]?.full_name ?? "",
      contact_phone: row.contacts[0]?.phone ?? "",
      due_at: row.due_at,
      assigned_name: row.team_members[0]?.display_name ?? null,
      status: row.status
    })),
    teamSnapshot: teamSnapshotArray
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
    full_name: string;
    phone: string;
    email: string | null;
    area: string | null;
    status: FollowUpStatus;
    urgency: "low" | "medium" | "high";
    assigned_to: string | null;
    assigned_name: string | null;
    created_at: string;
    interests: Interest[];
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
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

  const contacts = (data ?? []).map((row: { id: string; full_name: string; phone: string; email: string | null; area: string | null; status: FollowUpStatus; urgency: "low" | "medium" | "high"; assigned_to: string | null; assigned_name: string | null; created_at: string; interests: Interest[] }) => ({
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    area: row.area,
    status: row.status,
    urgency: row.urgency,
    assigned_to: row.assigned_to,
    assigned_name: row.assigned_name,
    created_at: row.created_at,
    interests: row.interests ?? []
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
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
};

export async function getEventFollowUpsPage(
  churchId: string,
  eventId: string,
  params: EventFollowUpsParams = {}
): Promise<EventFollowUpsPage> {
  const supabase = await createClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const { data: eventContactIds } = await supabase
    .from("contacts")
    .select("id")
    .eq("church_id", churchId)
    .eq("event_id", eventId)
    .is("deleted_at", null);

  const contactIds = (eventContactIds ?? []).map((c: { id: string }) => c.id);

  let query = supabase
    .from("follow_ups")
    .select(`
      id,
      contact_id,
      assigned_to,
      status,
      channel,
      next_action,
      due_at,
      completed_at,
      created_at,
      contacts!inner(
        id,
        full_name,
        phone,
        whatsapp_number,
        email,
        status,
        urgency
      ),
      team_members(display_name)
    `)
    .eq("church_id", churchId)
    .in("contact_id", contactIds)
    .order("due_at", { ascending: true, nullsFirst: false })
    .range(offset, offset + pageSize - 1);

  if (params.assignedTo) {
    query = query.eq("assigned_to", params.assignedTo);
  }

  if (params.status && params.status !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (params.status) {
      case "overdue":
        query = query.is("completed_at", null).lt("due_at", now.toISOString());
        break;
      case "today":
        query = query.is("completed_at", null)
          .gte("due_at", today.toISOString())
          .lt("due_at", tomorrow.toISOString());
        break;
      case "upcoming":
        query = query.is("completed_at", null).gte("due_at", tomorrow.toISOString());
        break;
      case "completed":
        query = query.not("completed_at", "is", null);
        break;
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const followUps = (data ?? []).map((row: { id: string; contact_id: string; contacts: { full_name: string; phone: string; whatsapp_number: string | null; email: string | null; status: FollowUpStatus; urgency: "low" | "medium" | "high" }[]; team_members: { display_name: string }[]; assigned_to: string | null; status: FollowUpStatus; channel: string | null; next_action: string | null; due_at: string | null; completed_at: string | null; created_at: string }) => ({
    id: row.id,
    contact_id: row.contact_id,
    contact_name: row.contacts[0]?.full_name ?? "",
    contact_phone: row.contacts[0]?.phone ?? "",
    contact_whatsapp: row.contacts[0]?.whatsapp_number ?? null,
    contact_email: row.contacts[0]?.email ?? null,
    contact_status: row.contacts[0]?.status,
    contact_urgency: row.contacts[0]?.urgency,
    assigned_to: row.assigned_to,
    assigned_name: row.team_members[0]?.display_name ?? null,
    status: row.status,
    channel: row.channel,
    next_action: row.next_action,
    due_at: row.due_at,
    completed_at: row.completed_at,
    created_at: row.created_at
  }));

  const { count } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("church_id", churchId)
    .in("contact_id", contactIds);

  return {
    followUps,
    totalCount: count ?? 0,
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

  const { data: assignedContacts } = await supabase
    .from("contacts")
    .select("id, assigned_to, team_members!inner(display_name, role), created_at")
    .eq("church_id", churchId)
    .eq("event_id", eventId)
    .not("assigned_to", "is", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const teamMap = new Map<string, {
    displayName: string;
    role: string | null;
    assignedContactCount: number;
    contactIds: string[];
    lastActivityAt: string | null;
  }>();

  (assignedContacts ?? []).forEach((row: { assigned_to: string; team_members: { display_name: string; role: string | null }[]; id: string; created_at: string }) => {
    const member = row.team_members[0];
    if (member && row.assigned_to) {
      const existing = teamMap.get(row.assigned_to);
      if (existing) {
        existing.assignedContactCount++;
        existing.contactIds.push(row.id);
      } else {
        teamMap.set(row.assigned_to, {
          displayName: member.display_name,
          role: member.role,
          assignedContactCount: 1,
          contactIds: [row.id],
          lastActivityAt: row.created_at
        });
      }
    }
  });

  const teamMemberIds = Array.from(teamMap.keys());

  if (teamMemberIds.length === 0) {
    return [];
  }

  const { data: followUpData } = await supabase
    .from("follow_ups")
    .select("assigned_to, completed_at, due_at")
    .eq("church_id", churchId)
    .in("assigned_to", teamMemberIds)
    .in("contact_id", Array.from(teamMap.values()).flatMap(m => m.contactIds));

  const followUpStats = new Map<string, { pending: number; completed: number; overdue: number }>();
  const now = new Date();

  (followUpData ?? []).forEach((row: { assigned_to: string; completed_at: string | null; due_at: string | null }) => {
    const stats = followUpStats.get(row.assigned_to) || { pending: 0, completed: 0, overdue: 0 };
    if (row.completed_at) {
      stats.completed++;
    } else if (row.due_at && new Date(row.due_at) < now) {
      stats.overdue++;
    } else {
      stats.pending++;
    }
    followUpStats.set(row.assigned_to, stats);
  });

  return Array.from(teamMap.entries()).map(([teamMemberId, data]) => {
    const stats = followUpStats.get(teamMemberId) || { pending: 0, completed: 0, overdue: 0 };
    return {
      teamMemberId,
      displayName: data.displayName,
      role: data.role,
      assignedContactCount: data.assignedContactCount,
      pendingCount: stats.pending,
      completedCount: stats.completed,
      overdueCount: stats.overdue,
      lastActivityAt: data.lastActivityAt
    };
  });
}
