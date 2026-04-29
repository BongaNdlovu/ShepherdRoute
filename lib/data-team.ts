import { createClient } from "@/lib/supabase/server";

export async function getTeamMembers(churchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("id, display_name, role, is_active, created_at")
    .eq("church_id", churchId)
    .order("display_name");

  return data ?? [];
}
