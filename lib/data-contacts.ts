import { notFound } from "next/navigation";
import type { FollowUpStatus, Interest } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const CONTACT_DETAIL_FOLLOW_UP_LIMIT = 25;
const CONTACT_DETAIL_PRAYER_LIMIT = 10;
const CONTACT_DETAIL_MESSAGE_LIMIT = 3;

export type ContactListItem = {
  id: string;
  full_name: string;
  phone: string;
  area: string | null;
  language: string | null;
  best_time_to_contact: string | null;
  status: FollowUpStatus;
  urgency: "low" | "medium" | "high";
  assigned_to: string | null;
  created_at: string;
  event_id: string | null;
  event_name: string | null;
  assigned_name: string | null;
  interests: Interest[];
  total_count: number;
};

export type ContactPageResult = {
  contacts: ContactListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type ContactFilters = {
  q?: string;
  status?: string;
  interest?: string;
  event?: string;
  assignedTo?: string;
};

export type ContactDetailResult = {
  contact: {
    id: string;
    full_name: string;
    phone: string;
    area: string | null;
    language: string | null;
    best_time_to_contact: string | null;
    status: FollowUpStatus;
    urgency: "low" | "medium" | "high";
    assigned_to: string | null;
    consent_given: boolean;
    events: { name: string } | null;
    team_members: { display_name: string } | { display_name: string }[] | null;
    contact_interests: Array<{ interest: Interest }>;
  };
  prayer: Array<{ request_text: string; visibility: string; created_at: string }>;
  team: Array<{ id: string; display_name: string; role: string }>;
  followUps: Array<{
    id: string;
    channel: string;
    status: string;
    notes: string | null;
    next_action: string | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
    team_members: { display_name: string } | { display_name: string }[] | null;
  }>;
  messages: Array<{ id: string; channel: string; message_text: string; wa_link: string | null; created_at: string }>;
};

type ContactDetailRow = Omit<ContactDetailResult["contact"], "events"> & {
  events: { name: string } | { name: string }[] | null;
};

function cleanUuid(value?: string) {
  return value && value !== "all" && value !== "unassigned" ? value : null;
}

export async function getContacts(churchId: string, filters: ContactFilters) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_contacts", {
    p_church_id: churchId,
    p_q: filters.q?.trim() || null,
    p_status: filters.status && filters.status !== "all" ? filters.status : null,
    p_event_id: cleanUuid(filters.event),
    p_interest: filters.interest && filters.interest !== "all" ? filters.interest : null,
    p_assigned_to: cleanUuid(filters.assignedTo),
    p_unassigned: filters.assignedTo === "unassigned"
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContactListItem[];
}

export async function getContactsPage(
  churchId: string,
  filters: ContactFilters & { page?: string; pageSize?: string }
): Promise<ContactPageResult> {
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize ?? 25) || 25));
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_contacts", {
    p_church_id: churchId,
    p_q: filters.q?.trim() || null,
    p_status: filters.status && filters.status !== "all" ? filters.status : null,
    p_event_id: cleanUuid(filters.event),
    p_interest: filters.interest && filters.interest !== "all" ? filters.interest : null,
    p_assigned_to: cleanUuid(filters.assignedTo),
    p_unassigned: filters.assignedTo === "unassigned",
    p_limit: pageSize,
    p_offset: offset
  });

  if (error) {
    throw new Error(error.message);
  }

  const contacts = (data ?? []) as ContactListItem[];
  const total = contacts[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    contacts,
    total,
    page,
    pageSize,
    pageCount
  };
}

export async function getContact(churchId: string, id: string): Promise<ContactDetailResult> {
  const supabase = await createClient();
  const [{ data: contact }, { data: prayer }, { data: team }, { data: followUps }, { data: messages }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, full_name, phone, area, language, best_time_to_contact, status, urgency, assigned_to, consent_given, events(name), team_members(display_name), contact_interests(interest)")
      .eq("church_id", churchId)
      .eq("id", id)
      .single(),
    supabase
      .from("prayer_requests")
      .select("request_text, visibility, created_at")
      .eq("church_id", churchId)
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(CONTACT_DETAIL_PRAYER_LIMIT),
    supabase
      .from("team_members")
      .select("id, display_name, role")
      .eq("church_id", churchId)
      .eq("is_active", true)
      .order("display_name"),
    supabase
      .from("follow_ups")
      .select("id, channel, status, notes, next_action, due_at, completed_at, created_at, team_members(display_name)")
      .eq("church_id", churchId)
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(CONTACT_DETAIL_FOLLOW_UP_LIMIT),
    supabase
      .from("generated_messages")
      .select("id, channel, message_text, wa_link, created_at")
      .eq("church_id", churchId)
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(CONTACT_DETAIL_MESSAGE_LIMIT)
  ]);

  if (!contact) {
    notFound();
  }

  const contactRow = contact as unknown as ContactDetailRow;
  const event = Array.isArray(contactRow.events) ? contactRow.events[0] ?? null : contactRow.events;

  return {
    contact: { ...contactRow, events: event },
    prayer: prayer ?? [],
    team: team ?? [],
    followUps: followUps ?? [],
    messages: messages ?? []
  };
}
