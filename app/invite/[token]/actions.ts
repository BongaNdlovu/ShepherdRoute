"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const acceptInviteSchema = z.object({
  token: z.string().min(20).max(200)
});

export async function acceptTeamInvitationAction(formData: FormData) {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token")
  });

  if (!parsed.success) {
    redirect("/login");
  }

  const token = parsed.data.token;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?invite=${encodeURIComponent(token)}`);
  }

  const { data: churchId, error } = await supabase.rpc("accept_team_invitation", {
    p_token: token
  });

  if (error || !churchId) {
    redirect(`/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(error?.message ?? "Could not accept this invitation.")}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("selected_church_id", churchId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  redirect("/dashboard");
}
