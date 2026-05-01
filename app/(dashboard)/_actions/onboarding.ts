"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function dismissOnboardingGuideAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get current church from context
  const { data: membership } = await supabase
    .from("church_memberships")
    .select("church_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership) {
    redirect("/dashboard");
  }

  // Call RPC to dismiss (bypasses RLS)
  await supabase.rpc("dismiss_onboarding_guide", { church_id: membership.church_id });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
