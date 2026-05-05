import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OwnerChurchListItem, OwnerChurchSummary, OwnerPaginatedResult, OwnerPaginationParams, OwnerWorkspaceType } from "./types";
import { normalizeOwnerPage, normalizeOwnerPageSize, ownerPageResult } from "./pagination";

export async function getOwnerChurchSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_church_summaries");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerChurchSummary[];
}

async function getOwnerWorkspacesPage(params: OwnerPaginationParams = {}, workspaceType: OwnerWorkspaceType): Promise<OwnerPaginatedResult<OwnerChurchListItem>> {
  const supabase = await createClient();
  const page = normalizeOwnerPage(params.page);
  const pageSize = normalizeOwnerPageSize(params.pageSize);
  const offset = (page - 1) * pageSize;
  const { data, error } = await supabase.rpc("owner_workspace_rows_page", {
    p_workspace_type: workspaceType,
    p_search: params.q?.trim() || null,
    p_limit: pageSize,
    p_offset: offset
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const items = rows.map((church: {
    church_id: string;
    church_name: string;
    created_at: string;
    team_count: number | null;
    profile_count: number | null;
    event_count: number | null;
    contact_count: number | null;
    new_contact_count: number | null;
    workspace_type: string | null;
    workspace_status: string | null;
    status_changed_at: string | null;
    status_change_reason: string | null;
    total_count: number | null;
  }) => ({
    church_id: church.church_id,
    church_name: church.church_name,
    created_at: church.created_at,
    team_count: church.team_count ?? 0,
    profile_count: church.profile_count ?? 0,
    event_count: church.event_count ?? 0,
    contact_count: church.contact_count ?? 0,
    new_contact_count: church.new_contact_count ?? 0,
    workspace_type: (church.workspace_type === "ministry" ? "ministry" : "church") as "church" | "ministry",
    workspace_status: (church.workspace_status === "inactive" ? "inactive" : "active") as "active" | "inactive",
    status_changed_at: church.status_changed_at ?? null,
    status_change_reason: church.status_change_reason ?? null
  }));

  return ownerPageResult(items, rows[0]?.total_count ?? 0, page, pageSize);
}

export async function getOwnerChurchesPage(params: OwnerPaginationParams = {}): Promise<OwnerPaginatedResult<OwnerChurchListItem>> {
  return getOwnerWorkspacesPage(params, "church");
}

export async function getOwnerMinistriesPage(params: OwnerPaginationParams = {}): Promise<OwnerPaginatedResult<OwnerChurchListItem>> {
  return getOwnerWorkspacesPage(params, "ministry");
}
