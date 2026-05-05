import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OwnerAdminOverview, OwnerAdminAnalytics } from "./types";

type OwnerAdminOverviewRpcRow = {
  church_count?: number | string | null;
  ministry_count?: number | string | null;
  active_account_count?: number | string | null;
  disabled_account_count?: number | string | null;
  pending_invitation_count?: number | string | null;
  team_member_count?: number | string | null;
  event_count?: number | string | null;
  contact_count?: number | string | null;
};

type OwnerAdminAnalyticsRpcRow = {
  active_workspace_count?: number | string | null;
  inactive_workspace_count?: number | string | null;
  contacts_last_30_days?: number | string | null;
  events_last_30_days?: number | string | null;
  open_data_request_count?: number | string | null;
  top_workspaces?: unknown;
};

function count(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getOwnerAdminOverview(): Promise<OwnerAdminOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_admin_overview").maybeSingle();

  if (error || !data) {
    notFound();
  }

  const row = data as OwnerAdminOverviewRpcRow;

  return {
    churchCount: count(row.church_count),
    ministryCount: count(row.ministry_count),
    activeAccountCount: count(row.active_account_count),
    disabledAccountCount: count(row.disabled_account_count),
    pendingInvitationCount: count(row.pending_invitation_count),
    teamMemberCount: count(row.team_member_count),
    eventCount: count(row.event_count),
    contactCount: count(row.contact_count)
  };
}

export async function getOwnerAdminAnalytics(): Promise<OwnerAdminAnalytics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_admin_analytics").maybeSingle();

  if (error || !data) {
    notFound();
  }

  const row = data as OwnerAdminAnalyticsRpcRow;

  return {
    activeWorkspaceCount: count(row.active_workspace_count),
    inactiveWorkspaceCount: count(row.inactive_workspace_count),
    contactsLast30Days: count(row.contacts_last_30_days),
    eventsLast30Days: count(row.events_last_30_days),
    openDataRequestCount: count(row.open_data_request_count),
    topWorkspaces: Array.isArray(row.top_workspaces) ? row.top_workspaces as OwnerAdminAnalytics["topWorkspaces"] : []
  };
}
