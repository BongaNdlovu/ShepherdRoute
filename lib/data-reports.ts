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

export async function getDashboardData(churchId: string) {
  const supabase = await createClient();
  const [{ data: contacts }, { data: events }, { data: team }, summary] = await Promise.all([
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
    getOutreachReportSummary(churchId)
  ]);

  return {
    contacts: contacts ?? [],
    events: events ?? [],
    team: team ?? [],
    summary
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
