"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { roleOptions, appRoleOptions, type TeamRole } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { canInviteRole, canManageTeam } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email().max(160).optional()
);

const optionalPhoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(40).optional()
);

const teamMemberSchema = z.object({
  displayName: z.string().min(2).max(120),
  role: z.enum(roleOptions),
  appRole: z.enum(appRoleOptions).or(z.literal("")),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  inviteLogin: z.boolean()
});

export async function addTeamMemberAction(formData: FormData) {
  const context = await getChurchContext();

  if (!canManageTeam(context.role as TeamRole)) {
    redirect("/settings/team?error=Only%20admins%20and%20pastors%20can%20manage%20team%20members.");
  }

  const parsed = teamMemberSchema.safeParse({
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    appRole: formData.get("appRole") || "",
    phone: formData.get("phone"),
    email: formData.get("email"),
    inviteLogin: formData.get("inviteLogin") === "on"
  });

  if (!parsed.success) {
    redirect("/settings/team?error=Please%20add%20a%20valid%20name%2C%20role%2C%20and%20email%20when%20inviting%20login%20access.");
  }

  if (parsed.data.inviteLogin && !parsed.data.email) {
    redirect("/settings/team?error=Add%20an%20email%20address%20before%20inviting%20login%20access.");
  }

  if (!canInviteRole(context.role as TeamRole, parsed.data.role)) {
    redirect("/settings/team?error=You%20cannot%20assign%20that%20role.");
  }

  const appRole = parsed.data.appRole === "" ? null : parsed.data.role === "admin" ? "admin" : parsed.data.role === "pastor" || parsed.data.role === "elder" ? "coordinator" : "viewer";

  const supabase = await createClient();
  const { data: teamMember, error } = await supabase
    .from("team_members")
    .insert({
      church_id: context.churchId,
      display_name: parsed.data.displayName,
      role: parsed.data.role,
      app_role: appRole,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null
    })
    .select("id")
    .single();

  if (error || !teamMember) {
    redirect(`/settings/team?error=${encodeURIComponent(error?.message ?? "Could not add team member.")}`);
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "team_member",
    target_id: teamMember.id,
    action: "team_member.created",
    metadata: {
      role: parsed.data.role,
      inviteLogin: parsed.data.inviteLogin
    }
  });

  if (parsed.data.inviteLogin && parsed.data.email) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { error: invitationError } = await supabase.from("team_invitations").insert({
      church_id: context.churchId,
      team_member_id: teamMember.id,
      email: parsed.data.email,
      normalized_email: parsed.data.email.toLowerCase(),
      display_name: parsed.data.displayName,
      role: parsed.data.role,
      token_hash: tokenHash,
      invited_by: context.userId
    });

    if (invitationError) {
      redirect(`/settings/team?error=${encodeURIComponent(invitationError.message)}`);
    }

    await supabase.from("audit_logs").insert({
      church_id: context.churchId,
      actor_user_id: context.userId,
      target_type: "team_invitation",
      target_id: teamMember.id,
      action: "invitation.created",
      metadata: {
        email: parsed.data.email,
        role: parsed.data.role
      }
    });

    revalidatePath("/settings/team");
    redirect(`/settings/team?invite=${encodeURIComponent(token)}`);
  }

  revalidatePath("/settings/team");
  redirect("/settings/team");
}

export async function revokeTeamInvitationAction(formData: FormData) {
  const context = await getChurchContext();

  if (!canManageTeam(context.role as TeamRole)) {
    redirect("/settings/team?error=Only%20admins%20and%20pastors%20can%20manage%20team%20invitations.");
  }

  const parsed = z.object({ invitationId: z.string().uuid() }).safeParse({
    invitationId: formData.get("invitationId")
  });

  if (!parsed.success) {
    redirect("/settings/team?error=Could%20not%20revoke%20that%20invitation.");
  }

  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("id, email, role")
    .eq("id", parsed.data.invitationId)
    .eq("church_id", context.churchId)
    .single();
  const { error } = await supabase
    .from("team_invitations")
    .update({ status: "revoked" })
    .eq("id", parsed.data.invitationId)
    .eq("church_id", context.churchId);

  if (error) {
    redirect(`/settings/team?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "team_invitation",
    target_id: parsed.data.invitationId,
    action: "invitation.revoked",
    metadata: {
      email: invitation?.email ?? null,
      role: invitation?.role ?? null
    }
  });

  revalidatePath("/settings/team");
  redirect("/settings/team");
}
