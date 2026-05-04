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
    .eq("membership_id", context.userId)
    .maybeSingle();

  return currentUserTeamMember?.app_role as AppRole | null;
}

export async function requireContactManager(context: Awaited<ReturnType<typeof getChurchContext>>, supabase: SupabaseClient, fallbackPath = "/contacts") {
  const appRole = await getAppRole(context, supabase);

  if (!canManageContacts(context.role as TeamRole, appRole)) {
    redirect(`${fallbackPath}?error=You%20do%20not%20have%20permission%20to%20manage%20contacts.`);
  }
}

export async function requireFollowUpAssigner(context: Awaited<ReturnType<typeof getChurchContext>>, supabase: SupabaseClient, fallbackPath = "/follow-ups") {
  const appRole = await getAppRole(context, supabase);

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
  return encodeURIComponent(error?.message ?? fallback);
}
