"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { roleOptions } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const teamMemberSchema = z.object({
  displayName: z.string().min(2).max(120),
  role: z.enum(roleOptions)
});

export async function addTeamMemberAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = teamMemberSchema.safeParse({
    displayName: formData.get("displayName"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    redirect("/settings/team?error=Please%20add%20a%20name%20and%20role.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({
    church_id: context.churchId,
    display_name: parsed.data.displayName,
    role: parsed.data.role
  });

  if (error) {
    redirect(`/settings/team?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/team");
  redirect("/settings/team");
}
