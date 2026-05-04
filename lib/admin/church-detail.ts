import { createClient } from "@/lib/supabase/server";
import type { OwnerChurchDetail } from "./types";

export async function getOwnerChurchDetail(churchId: string): Promise<OwnerChurchDetail> {
  const supabase = await createClient();

  const [{ data: church, error }, { count: teamCount }, { count: profileCount }, { count: eventCount }, { count: contactCount }, { count: newContactCount }] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, timezone, created_at, updated_at, workspace_type, workspace_status, status_changed_at, status_change_reason")
      .eq("id", churchId)
      .single(),
    supabase.from("team_members").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("church_memberships").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("church_id", churchId),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("church_id", churchId).is("deleted_at", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("church_id", churchId).eq("status", "new").is("deleted_at", null)
  ]);

  if (error || !church) {
    throw new Error(error?.message ?? "Church not found.");
  }

  return {
    id: church.id,
    name: church.name,
    timezone: church.timezone,
    created_at: church.created_at,
    updated_at: church.updated_at,
    team_count: teamCount ?? 0,
    profile_count: profileCount ?? 0,
    event_count: eventCount ?? 0,
    contact_count: contactCount ?? 0,
    new_contact_count: newContactCount ?? 0,
    workspace_type: (church.workspace_type === "ministry" ? "ministry" : "church") as "church" | "ministry",
    workspace_status: (church.workspace_status === "inactive" ? "inactive" : "active") as "active" | "inactive",
    status_changed_at: church.status_changed_at ?? null,
    status_change_reason: church.status_change_reason ?? null
  };
}
