import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OwnerAdminOverview } from "./types";

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
