import { createClient } from "@/lib/supabase/server";
import type { OwnerChurchProfileRow, OwnerPaginatedResult, OwnerPaginationParams } from "./types";
import { normalizeOwnerPage, normalizeOwnerPageSize, ownerPageResult } from "./pagination";

export async function getOwnerChurchProfilesPage(churchId: string, params: OwnerPaginationParams): Promise<OwnerPaginatedResult<OwnerChurchProfileRow>> {
  const supabase = await createClient();
  const page = normalizeOwnerPage(params.page);
  const pageSize = normalizeOwnerPageSize(params.pageSize);
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("owner_church_profiles_page", {
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
    membership_id: row.membership_id as string,
    user_id: row.user_id as string,
    full_name: row.full_name as string | null,
    email: row.email as string | null,
    phone: row.phone as string | null,
    role: row.role as string,
    status: row.status as "active" | "invited" | "disabled",
    membership_created_at: row.membership_created_at as string,
    app_admin_role: row.app_admin_role as "owner" | "support_admin" | "billing_admin" | null,
    is_protected_owner: Boolean(row.is_protected_owner)
  }));

  return ownerPageResult(items, total, page, pageSize);
}
