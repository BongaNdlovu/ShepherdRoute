import type { FollowUpStatus, Interest } from "@/lib/constants";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data-events";

export type OutreachReportEvent = {
  id: string;
  name: string;
  event_type: string;
  contact_count: number;
};

export type OutreachReportSummary = {
  total_contacts: number;
  followed_up_count: number;
  bible_study_count: number;
  prayer_count: number;
  health_count: number;
  baptism_count: number;
  high_priority_count: number;
  unassigned_count: number;
  due_today_count: number;
  overdue_count: number;
  waiting_reply_count: number;
  no_consent_count: number;
  do_not_contact_count: number;
  events: OutreachReportEvent[];
};

export type EventReportSummary = {
  total_contacts: number;
  followed_up_count: number;
  bible_study_count: number;
  prayer_count: number;
  baptism_count: number;
  high_priority_count: number;
  follow_up_count: number;
  status_counts: Record<string, number>;
  interest_counts: Record<string, number>;
};

export type EventReportExportContact = {
  id: string;
  full_name: string;
  phone: string;
  area: string | null;
  status: FollowUpStatus;
  urgency: "low" | "medium" | "high";
  created_at: string;
  contact_interests: Array<{ interest: Interest }>;
};

export type TodayFollowUpItem = {
  id: string;
  contact_id: string;
  assigned_to: string | null;
  status: FollowUpStatus;
  next_action: string | null;
  due_at: string | null;
  contact: {
    id: string;
    full_name: string;
    phone: string;
    status: FollowUpStatus;
    urgency: "low" | "medium" | "high";
    assigned_to: string | null;
    do_not_contact: boolean;
    event_name: string | null;
    interests: Interest[];
  };
  assigned_name: string | null;
  suggested_message: {
    id: string;
    message_text: string;
    wa_link: string | null;
    opened_at: string | null;
  } | null;
};

const emptyOutreachSummary: OutreachReportSummary = {
  total_contacts: 0,
  followed_up_count: 0,
  bible_study_count: 0,
  prayer_count: 0,
  health_count: 0,
  baptism_count: 0,
  high_priority_count: 0,
  unassigned_count: 0,
  due_today_count: 0,
  overdue_count: 0,
  waiting_reply_count: 0,
  no_consent_count: 0,
  do_not_contact_count: 0,
  events: []
};

const emptyEventSummary: EventReportSummary = {
  total_contacts: 0,
  followed_up_count: 0,
  bible_study_count: 0,
  prayer_count: 0,
  baptism_count: 0,
  high_priority_count: 0,
  follow_up_count: 0,
  status_counts: {},
  interest_counts: {}
};

function asNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, count]) => [key, Number(count) || 0])
  );
}

function parseOutreachSummary(row: Partial<OutreachReportSummary> | null | undefined): OutreachReportSummary {
  if (!row) return emptyOutreachSummary;

  return {
    total_contacts: Number(row.total_contacts) || 0,
    followed_up_count: Number(row.followed_up_count) || 0,
    bible_study_count: Number(row.bible_study_count) || 0,
    prayer_count: Number(row.prayer_count) || 0,
    health_count: Number(row.health_count) || 0,
    baptism_count: Number(row.baptism_count) || 0,
    high_priority_count: Number(row.high_priority_count) || 0,
    unassigned_count: Number(row.unassigned_count) || 0,
    due_today_count: Number(row.due_today_count) || 0,
    overdue_count: Number(row.overdue_count) || 0,
    waiting_reply_count: Number(row.waiting_reply_count) || 0,
    no_consent_count: Number(row.no_consent_count) || 0,
    do_not_contact_count: Number(row.do_not_contact_count) || 0,
    events: Array.isArray(row.events) ? row.events : []
  };
}

function parseEventSummary(row: Partial<EventReportSummary> | null | undefined): EventReportSummary {
  if (!row) return emptyEventSummary;

  return {
    total_contacts: Number(row.total_contacts) || 0,
    followed_up_count: Number(row.followed_up_count) || 0,
    bible_study_count: Number(row.bible_study_count) || 0,
    prayer_count: Number(row.prayer_count) || 0,
    baptism_count: Number(row.baptism_count) || 0,
    high_priority_count: Number(row.high_priority_count) || 0,
    follow_up_count: Number(row.follow_up_count) || 0,
    status_counts: asNumberRecord(row.status_counts),
    interest_counts: asNumberRecord(row.interest_counts)
  };
}

export async function getTodayFollowUps(churchId: string): Promise<TodayFollowUpItem[]> {
  const supabase = await createClient();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);

  const { data, error } = await supabase
    .from("follow_ups")
    .select(`
      id,
      contact_id,
      assigned_to,
      status,
      next_action,
      due_at,
      contacts(
        id,
        full_name,
        phone,
        status,
        urgency,
        assigned_to,
        do_not_contact,
        events(name),
        contact_interests(interest),
        generated_messages(id, message_text, wa_link, opened_at, purpose, created_at)
      ),
      team_members(display_name)
    `)
    .eq("church_id", churchId)
    .is("completed_at", null)
    .lt("due_at", tomorrow.toISOString())
    .neq("status", "closed")
    .order("due_at", { ascending: true })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).flatMap((row) => {
    const contactRow = Array.isArray(row.contacts) ? row.contacts[0] ?? null : row.contacts;
    if (!contactRow || contactRow.status === "closed") return [];

    const event = Array.isArray(contactRow.events) ? contactRow.events[0] ?? null : contactRow.events;
    const teamMember = Array.isArray(row.team_members) ? row.team_members[0] ?? null : row.team_members;
    const messages = Array.isArray(contactRow.generated_messages) ? contactRow.generated_messages : [];
    const suggestedMessage = messages
      .filter((message) => message.purpose === "suggested_whatsapp")
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] ?? null;

    return [{
      id: row.id,
      contact_id: row.contact_id,
      assigned_to: row.assigned_to,
      status: row.status,
      next_action: row.next_action,
      due_at: row.due_at,
      contact: {
        id: contactRow.id,
        full_name: contactRow.full_name,
        phone: contactRow.phone,
        status: contactRow.status,
        urgency: contactRow.urgency,
        assigned_to: contactRow.assigned_to,
        do_not_contact: contactRow.do_not_contact,
        event_name: event?.name ?? null,
        interests: (contactRow.contact_interests ?? []).map((item) => item.interest)
      },
      assigned_name: teamMember?.display_name ?? null,
      suggested_message: suggestedMessage
        ? {
          id: suggestedMessage.id,
          message_text: suggestedMessage.message_text,
          wa_link: suggestedMessage.wa_link,
          opened_at: suggestedMessage.opened_at
        }
        : null
    }];
  });
}

export async function getDashboardData(churchId: string) {
  const supabase = await createClient();
  const [{ data: contacts }, { data: events }, { data: team }, summary, todayFollowUps] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, full_name, phone, area, status, urgency, created_at, events(name), contact_interests(interest)")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("events")
      .select("id, name, event_type, starts_on, location, slug, is_active, contacts(count)")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("team_members")
      .select("id, display_name, role")
      .eq("church_id", churchId)
      .eq("is_active", true)
      .order("display_name"),
    getOutreachReportSummary(churchId),
    getTodayFollowUps(churchId)
  ]);

  return {
    contacts: contacts ?? [],
    events: events ?? [],
    team: team ?? [],
    summary,
    todayFollowUps
  };
}

export async function getOutreachReportSummary(churchId: string): Promise<OutreachReportSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("outreach_report_summary", {
    p_church_id: churchId
  });

  if (error) {
    throw new Error(error.message);
  }

  return parseOutreachSummary(Array.isArray(data) ? data[0] : data);
}

export async function getEventReportSummary(churchId: string, id: string) {
  const { event } = await getEvent(churchId, id);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("event_report_summary", {
    p_church_id: churchId,
    p_event_id: id
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    event,
    summary: parseEventSummary(Array.isArray(data) ? data[0] : data)
  };
}

export async function getEventReportContacts(churchId: string, id: string) {
  const { event } = await getEvent(churchId, id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, full_name, phone, area, status, urgency, created_at, contact_interests(interest)")
    .eq("church_id", churchId)
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    notFound();
  }

  return { event, contacts: data ?? [] };
}

export async function getEventReportExportMeta(churchId: string, id: string) {
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, name")
    .eq("church_id", churchId)
    .eq("id", id)
    .single();

  if (error || !event) {
    notFound();
  }

  return event;
}

export async function getEventReportContactsPage(churchId: string, id: string, offset: number, limit: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, full_name, phone, area, status, urgency, created_at, contact_interests(interest)")
    .eq("church_id", churchId)
    .eq("event_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as EventReportExportContact[];
}
