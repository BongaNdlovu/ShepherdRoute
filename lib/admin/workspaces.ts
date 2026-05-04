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
  const q = params.q?.trim();

  let query = supabase
    .from("churches")
    .select("id, name, created_at, workspace_type, workspace_status, status_changed_at, status_change_reason, team_members(count), church_memberships(count), events(count)", { count: "exact" })
    .eq("workspace_type", workspaceType)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const churchIds = (data ?? []).map((church) => church.id);

  const contactCountByChurch = new Map<string, number>();
  const newContactCountByChurch = new Map<string, number>();

  if (churchIds.length > 0) {
    const { data: activeContacts, error: activeContactsError } = await supabase
      .from("contacts")
      .select("church_id, status")
      .in("church_id", churchIds)
      .is("deleted_at", null);

    if (activeContactsError) {
      throw new Error(activeContactsError.message);
    }

    for (const contact of activeContacts ?? []) {
      contactCountByChurch.set(
        contact.church_id,
        (contactCountByChurch.get(contact.church_id) ?? 0) + 1
      );

      if (contact.status === "new") {
        newContactCountByChurch.set(
          contact.church_id,
          (newContactCountByChurch.get(contact.church_id) ?? 0) + 1
        );
      }
    }
  }

  const items = (data ?? []).map((church) => ({
    church_id: church.id,
    church_name: church.name,
    created_at: church.created_at,
    team_count: Array.isArray(church.team_members) ? church.team_members[0]?.count ?? 0 : 0,
    profile_count: Array.isArray(church.church_memberships) ? church.church_memberships[0]?.count ?? 0 : 0,
    event_count: Array.isArray(church.events) ? church.events[0]?.count ?? 0 : 0,
    contact_count: contactCountByChurch.get(church.id) ?? 0,
    new_contact_count: newContactCountByChurch.get(church.id) ?? 0,
    workspace_type: (church.workspace_type === "ministry" ? "ministry" : "church") as "church" | "ministry",
    workspace_status: (church.workspace_status === "inactive" ? "inactive" : "active") as "active" | "inactive",
    status_changed_at: church.status_changed_at ?? null,
    status_change_reason: church.status_change_reason ?? null
  }));

  return ownerPageResult(items, count ?? 0, page, pageSize);
}

export async function getOwnerChurchesPage(params: OwnerPaginationParams = {}): Promise<OwnerPaginatedResult<OwnerChurchListItem>> {
  return getOwnerWorkspacesPage(params, "church");
}

export async function getOwnerMinistriesPage(params: OwnerPaginationParams = {}): Promise<OwnerPaginatedResult<OwnerChurchListItem>> {
  return getOwnerWorkspacesPage(params, "ministry");
}
