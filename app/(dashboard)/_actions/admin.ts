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

const ownerWorkspaceStatusSchema = z.object({
  churchId: z.string().uuid(),
  workspaceStatus: z.enum(["active", "inactive"]),
  reason: z.string().max(500).optional(),
  returnTo: z.string().optional()
});

const ownerWorkspaceTypeSchema = z.object({
  churchId: z.string().uuid(),
  workspaceType: z.enum(["church", "ministry"]),
  returnTo: z.string().optional()
});

function safeOwnerReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/admin")) {
    return "/admin/churches";
  }
  return value;
}

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

export async function updateOwnerWorkspaceStatusAction(formData: FormData) {
  const context = await getChurchContext();

  if (!context.isProtectedOwner || context.appAdminRole !== "owner") {
    redirect("/dashboard");
  }

  const parsed = ownerWorkspaceStatusSchema.safeParse({
    churchId: formData.get("churchId"),
    workspaceStatus: formData.get("workspaceStatus"),
    reason: formData.get("reason") || undefined,
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    redirect("/admin/churches?error=Could%20not%20update%20workspace%20status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("churches")
    .update({
      workspace_status: parsed.data.workspaceStatus,
      status_changed_at: new Date().toISOString(),
      status_changed_by: context.userId,
      status_change_reason: parsed.data.reason ?? null
    })
    .eq("id", parsed.data.churchId);

  if (error) {
    redirect(`${safeOwnerReturnTo(parsed.data.returnTo)}?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    church_id: parsed.data.churchId,
    actor_user_id: context.userId,
    target_type: "workspace",
    target_id: parsed.data.churchId,
    action: `workspace.${parsed.data.workspaceStatus}`,
    metadata: {
      workspaceStatus: parsed.data.workspaceStatus,
      reason: parsed.data.reason ?? null
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/churches");
  revalidatePath(`/admin/churches/${parsed.data.churchId}`);
  redirect(`${safeOwnerReturnTo(parsed.data.returnTo)}?updated=true`);
}

export async function updateOwnerWorkspaceTypeAction(formData: FormData) {
  const context = await getChurchContext();

  if (!context.isProtectedOwner || context.appAdminRole !== "owner") {
    redirect("/dashboard");
  }

  const parsed = ownerWorkspaceTypeSchema.safeParse({
    churchId: formData.get("churchId"),
    workspaceType: formData.get("workspaceType"),
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    redirect("/admin/churches?error=Could%20not%20update%20workspace%20type.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("churches")
    .update({
      workspace_type: parsed.data.workspaceType,
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.churchId);

  if (error) {
    redirect(`${safeOwnerReturnTo(parsed.data.returnTo)}?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    church_id: parsed.data.churchId,
    actor_user_id: context.userId,
    target_type: "workspace",
    target_id: parsed.data.churchId,
    action: "workspace.type_updated",
    metadata: {
      workspaceType: parsed.data.workspaceType
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/churches");
  revalidatePath(`/admin/churches/${parsed.data.churchId}`);
  redirect(`${safeOwnerReturnTo(parsed.data.returnTo)}?updated=true`);
}
