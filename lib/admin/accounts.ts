import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OwnerAccountRow, OwnerPaginatedResult, OwnerPaginationParams } from "./types";
import { normalizeOwnerPage, normalizeOwnerPageSize, ownerPageResult } from "./pagination";

export async function getOwnerAccountRows() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_account_rows");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerAccountRow[];
}

export async function getOwnerAccountsPage(
  params: OwnerPaginationParams = {}
): Promise<OwnerPaginatedResult<OwnerAccountRow>> {
  const page = normalizeOwnerPage(params.page);
  const pageSize = normalizeOwnerPageSize(params.pageSize);
  const q = params.q?.trim().toLowerCase();

  const rows = await getOwnerAccountRows();

  const filtered = q
    ? rows.filter((account) => {
        const haystack = [
          account.church_name,
          account.full_name,
          account.email,
          account.user_id,
          account.role,
          account.status,
          account.team_member_name,
          account.app_admin_role,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
    : rows;

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return ownerPageResult(items, filtered.length, page, pageSize);
}
