"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyInviteError } from "@/lib/app-errors";

const acceptEventInviteSchema = z.object({
  token: z.string().min(20).max(200)
});

export async function acceptEventInvitationAction(formData: FormData) {
  const parsed = acceptEventInviteSchema.safeParse({
    token: formData.get("token")
  });

  if (!parsed.success) {
    redirect("/event-invitations/accept?error=Invalid%20invitation%20link.");
  }

  const token = parsed.data.token;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/event-invitations/accept?token=${encodeURIComponent(token)}`;
    redirect(`/login?eventInvite=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`);
  }

  const { data: eventId, error } = await supabase.rpc("accept_event_invitation", {
    p_token: token
  });

  if (error || !eventId) {
    redirect(`/event-invitations/accept?token=${encodeURIComponent(token)}&error=${encodeURIComponent(friendlyInviteError(error?.message))}`);
  }

  const { data: event } = await supabase
    .from("events")
    .select("church_id")
    .eq("id", eventId)
    .maybeSingle();

  if (event?.church_id) {
    const cookieStore = await cookies();
    cookieStore.set("selected_church_id", event.church_id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }

  redirect(`/events/${eventId}`);
}
