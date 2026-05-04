import { createClient } from "@/lib/supabase/server";
import type { OwnerChurchEventRow, OwnerPaginatedResult, OwnerPaginationParams } from "./types";
import { normalizeOwnerPage, normalizeOwnerPageSize, ownerPageResult } from "./pagination";

export async function getOwnerChurchEventsPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchEventRow>> {
  const supabase = await createClient();
  const page = normalizeOwnerPage(params.page);
  const pageSize = normalizeOwnerPageSize(params.pageSize);
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("owner_church_events_page", {
    p_church_id: churchId,
    p_search: params.q?.trim() || null,
    p_limit: pageSize,
    p_offset: offset
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const total = Number(rows[0]?.total_count ?? 0);

  const items = rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    event_type: row.event_type as string,
    starts_on: row.starts_on as string | null,
    location: row.location as string | null,
    slug: row.slug as string,
    is_active: row.is_active as boolean,
    archived_at: row.archived_at as string | null,
    created_at: row.created_at as string,
    contact_count: Number(row.contact_count ?? 0)
  }));

  return ownerPageResult(items, total, page, pageSize);
}
