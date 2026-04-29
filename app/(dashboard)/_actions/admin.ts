"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { roleOptions, type TeamRole } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { canManageOwnerAdmin, type AppAdminRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

const membershipStatusSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(["active", "invited", "disabled"])
});

const membershipRoleSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(roleOptions)
});

export async function updateOwnerMembershipStatusAction(formData: FormData) {
  const context = await getChurchContext();

  if (!canManageOwnerAdmin({ role: context.appAdminRole as AppAdminRole | null, isProtectedOwner: context.isProtectedOwner })) {
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

export async function updateOwnerMembershipRoleAction(formData: FormData) {
  const context = await getChurchContext();

  if (!canManageOwnerAdmin({ role: context.appAdminRole as AppAdminRole | null, isProtectedOwner: context.isProtectedOwner })) {
    redirect("/dashboard");
  }

  const parsed = membershipRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    redirect("/admin?error=Could%20not%20update%20membership%20role.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("owner_update_membership_role", {
    p_membership_id: parsed.data.membershipId,
    p_role: parsed.data.role as TeamRole
  });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?updated=true");
}
