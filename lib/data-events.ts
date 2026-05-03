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
