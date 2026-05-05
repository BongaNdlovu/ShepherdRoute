"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { roleOptions, type TeamRole } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { canManageOwnerAdmin, type AppAdminRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

type OwnerActionContext = Awaited<ReturnType<typeof getChurchContext>>;
type OwnerRpcValue = string | number | boolean | null | undefined;
type OwnerRpcArgs = Record<string, OwnerRpcValue>;

const membershipStatusSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(["active", "invited", "disabled"]),
  returnTo: z.string().optional()
});

const membershipRoleSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(roleOptions),
  returnTo: z.string().optional()
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

async function requireOwnerAdminContext(): Promise<OwnerActionContext> {
  const context = await getChurchContext();

  if (!canManageOwnerAdmin({ role: context.appAdminRole as AppAdminRole | null, isProtectedOwner: context.isProtectedOwner })) {
    redirect("/dashboard");
  }

  return context;
}

async function requireProtectedOwnerContext(): Promise<OwnerActionContext> {
  const context = await getChurchContext();

  if (!context.isProtectedOwner || context.appAdminRole !== "owner") {
    redirect("/dashboard");
  }

  return context;
}

function parseOwnerAction<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
  errorRedirect: string
): z.infer<TSchema> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    redirect(errorRedirect);
  }

  return parsed.data;
}

async function runOwnerRpcAction(options: {
  rpc: string;
  args: OwnerRpcArgs;
  errorRedirect: string;
  revalidate: string[];
  successRedirect: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(options.rpc, options.args);

  if (error) {
    redirect(`${options.errorRedirect}?error=${encodeURIComponent(error.message)}`);
  }

  options.revalidate.forEach((path) => revalidatePath(path));
  redirect(options.successRedirect);
}

export async function updateOwnerMembershipStatusAction(formData: FormData) {
  await requireOwnerAdminContext();

  const parsed = membershipStatusSchema.safeParse({
    membershipId: formData.get("membershipId"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo") || undefined
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
    redirect(`${safeOwnerReturnTo(parsed.data?.returnTo)}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect(`${safeOwnerReturnTo(parsed.data?.returnTo)}?updated=true`);
}

export async function updateOwnerMembershipRoleAction(formData: FormData) {
  await requireOwnerAdminContext();

  const parsed = membershipRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
    returnTo: formData.get("returnTo") || undefined
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
    redirect(`${safeOwnerReturnTo(parsed.data?.returnTo)}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect(`${safeOwnerReturnTo(parsed.data?.returnTo)}?updated=true`);
}

export async function updateOwnerWorkspaceStatusAction(formData: FormData) {
  const context = await requireProtectedOwnerContext();

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
  const context = await requireProtectedOwnerContext();

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

export async function resetWorkspaceInvitesAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    churchId: z.string().uuid(),
    reason: z.string().max(500).optional()
  }), {
    churchId: formData.get("churchId"),
    reason: formData.get("reason") || undefined
  }, "/admin/invitations?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_reset_workspace_invites",
    args: { p_church_id: parsed.churchId, p_reason: parsed.reason },
    errorRedirect: "/admin/invitations",
    revalidate: ["/admin/invitations"],
    successRedirect: "/admin/invitations?success=Workspace%20invites%20reset"
  });
}

export async function resetEventInvitesAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    churchId: z.string().uuid(),
    eventId: z.string().uuid().optional(),
    reason: z.string().max(500).optional()
  }), {
    churchId: formData.get("churchId"),
    eventId: formData.get("eventId") || undefined,
    reason: formData.get("reason") || undefined
  }, "/admin/invitations?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_reset_event_invites",
    args: { p_church_id: parsed.churchId, p_event_id: parsed.eventId, p_reason: parsed.reason },
    errorRedirect: "/admin/invitations",
    revalidate: ["/admin/invitations"],
    successRedirect: "/admin/invitations?success=Event%20invites%20reset"
  });
}

export async function disableWorkspaceTeamMemberAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    teamMemberId: z.string().uuid(),
    reason: z.string().max(500).optional()
  }), {
    teamMemberId: formData.get("teamMemberId"),
    reason: formData.get("reason") || undefined
  }, "/admin/users?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_disable_workspace_team_member",
    args: { p_team_member_id: parsed.teamMemberId, p_reason: parsed.reason },
    errorRedirect: "/admin/users",
    revalidate: ["/admin/users"],
    successRedirect: "/admin/users?success=Team%20member%20disabled"
  });
}

export async function removeWorkspaceTeamMemberAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    teamMemberId: z.string().uuid(),
    reason: z.string().max(500).optional()
  }), {
    teamMemberId: formData.get("teamMemberId"),
    reason: formData.get("reason") || undefined
  }, "/admin/users?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_remove_workspace_team_member",
    args: { p_team_member_id: parsed.teamMemberId, p_reason: parsed.reason },
    errorRedirect: "/admin/users",
    revalidate: ["/admin/users"],
    successRedirect: "/admin/users?success=Team%20member%20removed"
  });
}

export async function deleteWorkspaceTeamMemberAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    teamMemberId: z.string().uuid(),
    reason: z.string().max(500).optional()
  }), {
    teamMemberId: formData.get("teamMemberId"),
    reason: formData.get("reason") || undefined
  }, "/admin/users?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_delete_workspace_team_member",
    args: { p_team_member_id: parsed.teamMemberId, p_reason: parsed.reason },
    errorRedirect: "/admin/users",
    revalidate: ["/admin/users"],
    successRedirect: "/admin/users?success=Team%20member%20deleted"
  });
}

export async function revokeEventAssignmentAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    assignmentId: z.string().uuid(),
    reason: z.string().max(500).optional()
  }), {
    assignmentId: formData.get("assignmentId"),
    reason: formData.get("reason") || undefined
  }, "/admin/invitations?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_revoke_event_assignment",
    args: { p_assignment_id: parsed.assignmentId, p_reason: parsed.reason },
    errorRedirect: "/admin/invitations",
    revalidate: ["/admin/invitations"],
    successRedirect: "/admin/invitations?success=Event%20assignment%20revoked"
  });
}

export async function deleteEventAssignmentAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    assignmentId: z.string().uuid(),
    reason: z.string().max(500).optional()
  }), {
    assignmentId: formData.get("assignmentId"),
    reason: formData.get("reason") || undefined
  }, "/admin/invitations?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_delete_event_assignment",
    args: { p_assignment_id: parsed.assignmentId, p_reason: parsed.reason },
    errorRedirect: "/admin/invitations",
    revalidate: ["/admin/invitations"],
    successRedirect: "/admin/invitations?success=Event%20assignment%20deleted"
  });
}

export async function clearRevokedWorkspaceInvitationsAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    churchId: z.string().uuid().optional(),
    reason: z.string().max(500).optional()
  }), {
    churchId: formData.get("churchId") || undefined,
    reason: formData.get("reason") || undefined
  }, "/admin/invitations?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_clear_revoked_workspace_invitations",
    args: { p_church_id: parsed.churchId ?? null, p_reason: parsed.reason },
    errorRedirect: "/admin/invitations",
    revalidate: ["/admin/invitations"],
    successRedirect: "/admin/invitations?success=Revoked%20workspace%20invitations%20cleared"
  });
}

export async function clearRevokedEventInvitationsAction(formData: FormData) {
  await requireOwnerAdminContext();
  const parsed = parseOwnerAction(z.object({
    churchId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    reason: z.string().max(500).optional()
  }), {
    churchId: formData.get("churchId") || undefined,
    eventId: formData.get("eventId") || undefined,
    reason: formData.get("reason") || undefined
  }, "/admin/invitations?error=Invalid%20request");

  await runOwnerRpcAction({
    rpc: "owner_clear_revoked_event_invitations",
    args: { p_church_id: parsed.churchId ?? null, p_event_id: parsed.eventId ?? null, p_reason: parsed.reason },
    errorRedirect: "/admin/invitations",
    revalidate: ["/admin/invitations"],
    successRedirect: "/admin/invitations?success=Revoked%20event%20invitations%20cleared"
  });
}
