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
  topic_counts: Record<string, number>;
  form_answer_counts: Array<{
    question_name: string;
    question_label: string;
    count: number;
  }>;
};

export type EventReportExportContact = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  area: string | null;
  language: string | null;
  best_time_to_contact: string | null;
  status: FollowUpStatus;
  urgency: "low" | "medium" | "high";
  assigned_name: string | null;
  created_at: string;
  archived_at: string | null;
  contact_interests: Array<{ interest: Interest }>;
};

export type EventReportDocumentContact = EventReportExportContact & {
  do_not_contact: boolean;
  consent_given: boolean;
  preferred_contact_methods: string[] | null;
  follow_ups: Array<{
    status: FollowUpStatus;
    channel: string | null;
    next_action: string | null;
    notes: string | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
    assigned_name: string | null;
  }>;
  prayer_requests: Array<{
    request_text: string;
    visibility: string;
    created_at: string;
  }>;
  form_answers: Array<{
    question_name: string;
    question_label: string;
    answer_display: unknown;
  }>;
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

type RpcError = { message: string };
type TodayFollowUpsRpcRow = {
  id: string;
  contact_id: string;
  assigned_to: string | null;
  status: FollowUpStatus;
  next_action: string | null;
  due_at: string | null;
  contact_id_value: string;
  contact_full_name: string;
  contact_phone: string;
  contact_status: FollowUpStatus;
  contact_urgency: "low" | "medium" | "high";
  contact_assigned_to: string | null;
  contact_do_not_contact: boolean;
  event_name: string | null;
  interests: Interest[] | null;
  assigned_name: string | null;
  suggested_message_id: string | null;
  suggested_message_text: string | null;
  suggested_wa_link: string | null;
  suggested_opened_at: string | null;
};

type ReportsPerformanceRpcClient = {
  rpc(
    name: "today_follow_ups",
    params: { p_church_id: string; p_limit: number }
  ): Promise<{ data: TodayFollowUpsRpcRow[] | null; error: RpcError | null }>;
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
  interest_counts: {},
  topic_counts: {},
  form_answer_counts: []
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
    interest_counts: asNumberRecord(row.interest_counts),
    topic_counts: asNumberRecord(row.topic_counts),
    form_answer_counts: Array.isArray(row.form_answer_counts)
      ? row.form_answer_counts.map((item) => ({
          question_name: String(item.question_name ?? ""),
          question_label: String(item.question_label ?? ""),
          count: Number(item.count) || 0
        }))
      : []
  };
}

export async function getTodayFollowUps(churchId: string): Promise<TodayFollowUpItem[]> {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as ReportsPerformanceRpcClient;
  // The RPC keeps the former purpose === "suggested_whatsapp" filter in SQL.
  const { data, error } = await rpcClient.rpc("today_follow_ups", {
    p_church_id: churchId,
    p_limit: 12
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    contact_id: row.contact_id,
    assigned_to: row.assigned_to,
    status: row.status,
    next_action: row.next_action,
    due_at: row.due_at,
    contact: {
      id: row.contact_id_value,
      full_name: row.contact_full_name,
      phone: row.contact_phone,
      status: row.contact_status,
      urgency: row.contact_urgency,
      assigned_to: row.contact_assigned_to,
      do_not_contact: row.contact_do_not_contact,
      event_name: row.event_name,
      interests: row.interests ?? []
    },
    assigned_name: row.assigned_name,
    suggested_message: row.suggested_message_id
      ? {
        id: row.suggested_message_id,
        message_text: row.suggested_message_text ?? "",
        wa_link: row.suggested_wa_link,
        opened_at: row.suggested_opened_at
      }
      : null
  }));
}

export async function getDashboardData(churchId: string) {
  const supabase = await createClient();
  const [{ data: contacts }, { data: events }, { data: team }, summary, todayFollowUps] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, full_name, phone, area, status, urgency, created_at, events(name), contact_interests(interest)")
      .eq("church_id", churchId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("events")
      .select("id, name, event_type, starts_on, location, slug, is_active, archived_at, contacts(count)")
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
    .select("id, full_name, phone, email, area, language, best_time_to_contact, status, urgency, created_at, team_members(display_name), contact_interests(interest)")
    .eq("church_id", churchId)
    .eq("event_id", id)
    .is("deleted_at", null)
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
    .select("id, name, form_config")
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
    .select("id, full_name, phone, email, area, language, best_time_to_contact, status, urgency, created_at, archived_at, team_members(display_name), contact_interests(interest)")
    .eq("church_id", churchId)
    .eq("event_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((contact) => {
    const teamMember = Array.isArray(contact.team_members) ? contact.team_members[0] ?? null : contact.team_members;

    return {
      ...contact,
      assigned_name: teamMember?.display_name ?? null
    };
  }) as unknown as EventReportExportContact[];
}

export async function getEventReportDocumentContacts(churchId: string, id: string): Promise<EventReportDocumentContact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, full_name, phone, email, area, language, best_time_to_contact, status, urgency, created_at, archived_at, do_not_contact, consent_given, preferred_contact_methods, team_members(display_name), contact_interests(interest)")
    .eq("church_id", churchId)
    .eq("event_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const contacts = (data ?? []).map((contact) => {
    const teamMember = Array.isArray(contact.team_members) ? contact.team_members[0] ?? null : contact.team_members;

    return {
      ...contact,
      assigned_name: teamMember?.display_name ?? null
    };
  }) as unknown as Array<Omit<EventReportDocumentContact, "follow_ups" | "prayer_requests" | "form_answers">>;

  if (!contacts.length) {
    return [];
  }

  const contactIds = contacts.map((contact) => contact.id);
  const [{ data: followUps, error: followUpsError }, { data: prayerRequests, error: prayerError }, { data: formAnswers, error: answersError }] = await Promise.all([
    supabase
      .from("follow_ups")
      .select("contact_id, status, channel, next_action, notes, due_at, completed_at, created_at, team_members(display_name)")
      .eq("church_id", churchId)
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("prayer_requests")
      .select("contact_id, request_text, visibility, created_at")
      .eq("church_id", churchId)
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_form_answers")
      .select("contact_id, question_name, question_label, answer_display")
      .eq("church_id", churchId)
      .eq("event_id", id)
      .in("contact_id", contactIds)
      .order("created_at", { ascending: true })
  ]);

  if (followUpsError) throw new Error(followUpsError.message);
  if (prayerError) throw new Error(prayerError.message);
  if (answersError) throw new Error(answersError.message);

  const followUpsByContact = new Map<string, EventReportDocumentContact["follow_ups"]>();
  for (const followUp of followUps ?? []) {
    const teamMember = Array.isArray(followUp.team_members) ? followUp.team_members[0] ?? null : followUp.team_members;
    const rows = followUpsByContact.get(followUp.contact_id) ?? [];
    rows.push({
      status: followUp.status as FollowUpStatus,
      channel: followUp.channel,
      next_action: followUp.next_action,
      notes: followUp.notes,
      due_at: followUp.due_at,
      completed_at: followUp.completed_at,
      created_at: followUp.created_at,
      assigned_name: teamMember?.display_name ?? null
    });
    followUpsByContact.set(followUp.contact_id, rows);
  }

  const prayerByContact = new Map<string, EventReportDocumentContact["prayer_requests"]>();
  for (const request of prayerRequests ?? []) {
    const rows = prayerByContact.get(request.contact_id) ?? [];
    rows.push({
      request_text: request.request_text,
      visibility: request.visibility,
      created_at: request.created_at
    });
    prayerByContact.set(request.contact_id, rows);
  }

  const answersByContact = new Map<string, EventReportDocumentContact["form_answers"]>();
  for (const answer of formAnswers ?? []) {
    const rows = answersByContact.get(answer.contact_id) ?? [];
    rows.push({
      question_name: answer.question_name,
      question_label: answer.question_label,
      answer_display: answer.answer_display
    });
    answersByContact.set(answer.contact_id, rows);
  }

  return contacts.map((contact) => ({
    ...contact,
    follow_ups: followUpsByContact.get(contact.id) ?? [],
    prayer_requests: prayerByContact.get(contact.id) ?? [],
    form_answers: answersByContact.get(contact.id) ?? []
  }));
}
