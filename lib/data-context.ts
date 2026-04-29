import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ChurchContext = {
  userId: string;
  churchId: string;
  churchName: string;
  fullName: string;
  role: string;
  isAppAdmin: boolean;
};

export const getChurchContext = cache(async function getChurchContext(): Promise<ChurchContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: membership, error }, { data: appAdmin }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("church_memberships")
      .select("church_id, role, churches(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (error || !membership || !profile) {
    redirect("/login?error=Your%20church%20profile%20is%20not%20ready%20yet.");
  }

  const church = Array.isArray(membership.churches) ? membership.churches[0] : membership.churches;

  return {
    userId: user.id,
    churchId: membership.church_id,
    churchName: church?.name ?? "Your church",
    fullName: profile.full_name ?? user.email ?? "Team member",
    role: membership.role,
    isAppAdmin: Boolean(appAdmin)
  };
});
