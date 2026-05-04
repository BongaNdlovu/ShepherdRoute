import { createClient } from "@/lib/supabase/server";
import type { OwnerChurchTeamRow, OwnerPaginatedResult, OwnerPaginationParams } from "./types";
import { normalizeOwnerPage, normalizeOwnerPageSize, ownerPageResult } from "./pagination";

export async function getOwnerChurchTeamPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchTeamRow>> {
  const supabase = await createClient();
  const page = normalizeOwnerPage(params.page);
  const pageSize = normalizeOwnerPageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const q = params.q?.trim();

  let query = supabase
    .from("team_members")
    .select("id, display_name, role, phone, email, is_active, membership_id, created_at", { count: "exact" })
    .eq("church_id", churchId)
    .order("display_name")
    .range(offset, offset + pageSize - 1);

  if (q) {
    query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return ownerPageResult((data ?? []) as OwnerChurchTeamRow[], count ?? 0, page, pageSize);
}
