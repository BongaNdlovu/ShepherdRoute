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
  const offset = (page - 1) * pageSize;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_account_rows_page", {
    p_search: params.q?.trim() || null,
    p_limit: pageSize,
    p_offset: offset
  });

  if (error) {
    notFound();
  }

  const rows = (data ?? []) as Array<OwnerAccountRow & { total_count?: number }>;
  const total = rows[0]?.total_count ?? 0;
  const items = rows.map((row) => {
    const account = { ...row };
    delete account.total_count;
    return account;
  });

  return ownerPageResult(items, total, page, pageSize);
}
