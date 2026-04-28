import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FollowUpStatus, Interest } from "@/lib/constants";

export type OwnerChurchSummary = {
  church_id: string;
  church_name: string;
  created_at: string;
  team_count: number;
  event_count: number;
  contact_count: number;
  new_contact_count: number;
};

export type ChurchContext = {
  userId: string;
  churchId: string;
  churchName: string;
  fullName: string;
  role: string;
  isAppAdmin: boolean;
};

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

export async function getChurchContext(): Promise<ChurchContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: membership, error } = await supabase
    .from("church_memberships")
    .select("church_id, role, churches(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !membership || !profile) {
    redirect("/login?error=Your%20church%20profile%20is%20not%20ready%20yet.");
  }

  const church = Array.isArray(membership.churches) ? membership.churches[0] : membership.churches;

  const { data: appAdmin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    churchId: membership.church_id,
    churchName: church?.name ?? "Your church",
    fullName: profile.full_name ?? user.email ?? "Team member",
    role: membership.role,
    isAppAdmin: Boolean(appAdmin)
  };
}

export async function getDashboardData(churchId: string) {
  const supabase = await createClient();
  const [{ data: contacts }, { data: events }, { data: team }] = await Promise.all([
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
      .order("display_name")
  ]);

  return {
    contacts: contacts ?? [],
    events: events ?? [],
    team: team ?? []
  };
}

export async function getContacts(
  churchId: string,
  filters: { q?: string; status?: string; interest?: string; event?: string; assignedTo?: string }
) {
  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select("id, full_name, phone, area, language, best_time_to_contact, status, urgency, assigned_to, created_at, events(id, name), team_members(display_name), contact_interests(interest)")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.event && filters.event !== "all") {
    query = query.eq("event_id", filters.event);
  }

  if (filters.assignedTo && filters.assignedTo !== "all") {
    if (filters.assignedTo === "unassigned") {
      query = query.is("assigned_to", null);
    } else {
      query = query.eq("assigned_to", filters.assignedTo);
    }
  }

  if (filters.q) {
    query = query.or(`full_name.ilike.%${filters.q}%,phone.ilike.%${filters.q}%,area.ilike.%${filters.q}%`);
  }

  const { data } = await query;
  const contacts = data ?? [];

  if (filters.interest && filters.interest !== "all") {
    return contacts.filter((contact) =>
      (contact.contact_interests ?? []).some((item: { interest: string }) => item.interest === filters.interest)
    );
  }

  return contacts;
}

function cleanUuid(value?: string) {
  return value && value !== "all" && value !== "unassigned" ? value : null;
}

export async function getContactsPage(
  churchId: string,
  filters: { q?: string; status?: string; interest?: string; event?: string; assignedTo?: string; page?: string; pageSize?: string }
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

export async function getContact(churchId: string, id: string) {
  const supabase = await createClient();
  const [{ data: contact }, { data: prayer }, { data: team }, { data: followUps }, { data: messages }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, events(name), team_members(display_name), contact_interests(interest)")
      .eq("church_id", churchId)
      .eq("id", id)
      .single(),
    supabase
      .from("prayer_requests")
      .select("request_text, visibility, created_at")
      .eq("church_id", churchId)
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
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
      .order("created_at", { ascending: false }),
    supabase
      .from("generated_messages")
      .select("id, channel, message_text, wa_link, created_at")
      .eq("church_id", churchId)
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
  ]);

  if (!contact) {
    notFound();
  }

  return { contact, prayer: prayer ?? [], team: team ?? [], followUps: followUps ?? [], messages: messages ?? [] };
}

export async function getEvents(churchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, name, event_type, starts_on, location, slug, is_active, created_at, contacts(count)")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getEvent(churchId: string, id: string) {
  const supabase = await createClient();
  const [{ data: event }, { data: contacts }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_type, starts_on, location, slug, description, is_active, created_at, contacts(count)")
      .eq("church_id", churchId)
      .eq("id", id)
      .single(),
    supabase
      .from("contacts")
      .select("id, full_name, phone, area, status, urgency, created_at, contact_interests(interest)")
      .eq("church_id", churchId)
      .eq("event_id", id)
      .order("created_at", { ascending: false })
  ]);

  if (!event) {
    notFound();
  }

  return { event, contacts: contacts ?? [] };
}

export async function getEventReport(churchId: string, id: string) {
  const { event, contacts } = await getEvent(churchId, id);

  if (!contacts.length) {
    return { event, contacts, followUps: [] };
  }

  const supabase = await createClient();
  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("id, status, channel, contact_id, created_at")
    .eq("church_id", churchId)
    .in("contact_id", contacts.map((contact) => contact.id));

  return { event, contacts, followUps: followUps ?? [] };
}

export async function getTeamMembers(churchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("id, display_name, role, is_active, created_at")
    .eq("church_id", churchId)
    .order("display_name");

  return data ?? [];
}

export async function getOwnerChurchSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_church_summaries");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerChurchSummary[];
}

export async function getPublicEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_events")
    .select("id, name, event_type, starts_on, location, slug, church_name")
    .eq("slug", slug)
    .single();

  if (!data) {
    notFound();
  }

  return data;
}
