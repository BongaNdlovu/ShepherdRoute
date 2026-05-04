import { createClient } from "@/lib/supabase/server";

export async function getTeamMembers(churchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, membership_id, display_name, role, app_role, phone, email, is_active, created_at")
    .eq("church_id", churchId)
    .order("display_name");

  if (error) {
    console.error("[getTeamMembers] query error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return [];
  }

  return data ?? [];
}

export async function getTeamInvitations(churchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_invitations")
    .select("id, team_member_id, email, display_name, role, status, expires_at, accepted_at, created_at")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTeamInvitations] query error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return [];
  }

  return data ?? [];
}
