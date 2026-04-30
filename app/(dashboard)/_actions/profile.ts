"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { defaultDashboardViewOptions } from "@/lib/data-profile";

const optionalPhoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(40).optional()
);

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: optionalPhoneSchema
});

const settingsSchema = z.object({
  defaultDashboardView: z.enum(defaultDashboardViewOptions),
  compactLists: z.boolean()
});

function actionError(error: unknown, fallback: string) {
  return encodeURIComponent(error instanceof Error ? error.message : fallback);
}

export async function updateProfileAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone")
  });

  if (!parsed.success) {
    redirect("/profile?error=Please%20enter%20a%20valid%20name%20and%20phone%20number.");
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ?? null
    })
    .eq("id", context.userId);

  if (profileError) {
    redirect(`/profile?error=${actionError(profileError, "Could not update your profile.")}`);
  }

  const { data: membership } = await supabase
    .from("church_memberships")
    .select("id")
    .eq("church_id", context.churchId)
    .eq("user_id", context.userId)
    .eq("status", "active")
    .maybeSingle();

  if (membership) {
    const { error: teamError } = await supabase
      .from("team_members")
      .update({
        display_name: parsed.data.fullName,
        phone: parsed.data.phone ?? null
      })
      .eq("church_id", context.churchId)
      .eq("membership_id", membership.id);

    if (teamError) {
      redirect(`/profile?error=${actionError(teamError, "Profile saved, but team sync failed. Contact your church admin if this persists.")}`);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  redirect("/profile?updated=1");
}

export async function updateAccountSettingsAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = settingsSchema.safeParse({
    defaultDashboardView: formData.get("defaultDashboardView"),
    compactLists: formData.get("compactLists") === "on"
  });

  if (!parsed.success) {
    redirect("/settings?error=Please%20check%20your%20settings.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ preferences: parsed.data })
    .eq("id", context.userId);

  if (error) {
    redirect(`/settings?error=${actionError(error, "Could not update your settings.")}`);
  }

  revalidatePath("/settings");
  redirect("/settings?updated=1");
}
