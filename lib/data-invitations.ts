import { createClient } from "@/lib/supabase/server";

export type TeamInvitationPreview = {
  church_name: string;
  display_name: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
};

export async function getTeamInvitationPreview(token: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("team_invitation_preview", {
    p_token: token
  });

  return (data?.[0] ?? null) as TeamInvitationPreview | null;
}
