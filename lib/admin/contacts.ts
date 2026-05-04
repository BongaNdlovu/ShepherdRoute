import { createClient } from "@/lib/supabase/server";
import type { OwnerChurchContactRow, OwnerPaginatedResult, OwnerPaginationParams } from "./types";
import { normalizeOwnerPage, normalizeOwnerPageSize, ownerPageResult } from "./pagination";

export async function getOwnerChurchContactsPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchContactRow>> {
  const supabase = await createClient();
  const page = normalizeOwnerPage(params.page);
  const pageSize = normalizeOwnerPageSize(params.pageSize);
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

  return ownerPageResult(items, count ?? 0, page, pageSize);
}
