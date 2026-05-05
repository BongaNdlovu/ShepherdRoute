import { createClient } from "@/lib/supabase/server";

export type EventInvitationPreview = {
  workspace_name: string;
  event_name: string;
  invitee_email: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
};

export async function getEventInvitationPreview(token: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_invitation_preview", {
    p_token: token
  });

  return (data?.[0] ?? null) as EventInvitationPreview | null;
}
