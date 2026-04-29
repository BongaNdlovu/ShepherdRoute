"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const membershipStatusSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(["active", "invited", "disabled"])
});

export async function updateOwnerMembershipStatusAction(formData: FormData) {
  const context = await getChurchContext();

  if (!context.isAppAdmin) {
    redirect("/dashboard");
  }

  const parsed = membershipStatusSchema.safeParse({
    membershipId: formData.get("membershipId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    redirect("/admin?error=Could%20not%20update%20membership.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("owner_update_membership_status", {
    p_membership_id: parsed.data.membershipId,
    p_status: parsed.data.status
  });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?updated=true");
}
