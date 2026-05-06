import { redirect } from "next/navigation";
import { canAssignFollowUp, canManageContacts } from "@/lib/permissions";
import type { AppRole, TeamRole } from "@/lib/constants";
import type { getChurchContext } from "@/lib/data";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAppRole(context: Awaited<ReturnType<typeof getChurchContext>>, supabase: SupabaseClient): Promise<AppRole | null> {
  const { data: currentUserTeamMember } = await supabase
    .from("team_members")
    .select("app_role")
    .eq("church_id", context.churchId)
    .eq("membership_id", context.membershipId)
    .maybeSingle();

  return currentUserTeamMember?.app_role as AppRole | null;
}

export async function requireActiveTeamMemberInChurch(
  supabase: SupabaseClient,
  churchId: string,
  teamMemberId: string | null,
  fallbackPath = "/contacts"
) {
  if (!teamMemberId) {
    return;
  }

  const { data, error } = await supabase
    .from("team_members")
    .select("id")
    .eq("church_id", churchId)
    .eq("id", teamMemberId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    redirect(`${fallbackPath}?error=Invalid%20assignee%20selected.`);
  }
}

export async function requireContactManager(context: Awaited<ReturnType<typeof getChurchContext>>, supabase: SupabaseClient, fallbackPath = "/contacts") {
  const appRole = await getAppRole(context, supabase);

  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect(`${fallbackPath}?error=This%20workspace%20is%20inactive.`);
  }

  if (!canManageContacts(context.role as TeamRole, appRole)) {
    redirect(`${fallbackPath}?error=You%20do%20not%20have%20permission%20to%20manage%20contacts.`);
  }
}

export async function requireFollowUpAssigner(context: Awaited<ReturnType<typeof getChurchContext>>, supabase: SupabaseClient, fallbackPath = "/follow-ups") {
  const appRole = await getAppRole(context, supabase);

  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect(`${fallbackPath}?error=This%20workspace%20is%20inactive.`);
  }

  if (!canAssignFollowUp(context.role as TeamRole, appRole)) {
    redirect(`${fallbackPath}?error=You%20do%20not%20have%20permission%20to%20update%20follow-ups.`);
  }
}

export function safeReturnTo(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function actionError(error: { message?: string } | null | undefined, fallback: string) {
  if (error?.message) {
    console.error(fallback, error);
  }

  return encodeURIComponent(fallback);
}
