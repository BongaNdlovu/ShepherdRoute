"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function dismissOnboardingGuideAction() {
  const context = await getChurchContext();
  const supabase = await createClient();

  const { error } = await supabase.rpc("dismiss_onboarding_guide", {
    church_id: context.churchId
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
