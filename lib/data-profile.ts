import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type UserProfileSettings = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  preferences: Json;
  memberships: Array<{
    id: string;
    church_id: string;
    church_name: string;
    role: string;
    status: string;
    team_member_id: string | null;
    team_display_name: string | null;
    team_phone: string | null;
    team_email: string | null;
  }>;
};

export async function getUserProfileSettings(userId: string): Promise<UserProfileSettings | null> {
  const supabase = await createClient();

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, preferences")
      .eq("id", userId)
      .single(),
    supabase
      .from("church_memberships")
      .select("id, church_id, role, status, churches(name), team_members(id, display_name, phone, email)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
  ]);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    preferences: profile.preferences,
    memberships: (memberships ?? []).map((membership) => {
      const church = Array.isArray(membership.churches) ? membership.churches[0] : membership.churches;
      const teamMember = Array.isArray(membership.team_members) ? membership.team_members[0] : membership.team_members;

      return {
        id: membership.id,
        church_id: membership.church_id,
        church_name: church?.name ?? "Your church",
        role: membership.role,
        status: membership.status,
        team_member_id: teamMember?.id ?? null,
        team_display_name: teamMember?.display_name ?? null,
        team_phone: teamMember?.phone ?? null,
        team_email: teamMember?.email ?? null
      };
    })
  };
}
