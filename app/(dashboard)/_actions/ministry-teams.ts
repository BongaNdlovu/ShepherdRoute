"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { followUpCategoryOptions } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { canManageMinistryTeams } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, TeamRole } from "@/lib/constants";

const teamSchema = z.object({
  teamId: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  followUpCategories: z.array(z.enum(followUpCategoryOptions)).default([]),
  isActive: z.boolean().default(true)
});

const personSchema = z.object({
  personId: z.string().uuid().optional(),
  fullName: z.string().min(2).max(160),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().default(true)
});

const membershipSchema = z.object({
  membershipId: z.string().uuid().optional(),
  teamId: z.string().uuid(),
  personId: z.string().uuid(),
  positionTitle: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().default(true)
});

async function requireMinistryTeamManager(context: Awaited<ReturnType<typeof getChurchContext>>, supabase: Awaited<ReturnType<typeof createClient>>) {
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/ministry-teams?error=This%20workspace%20is%20inactive.");
  }

  const { data: currentUserTeamMember } = await supabase
    .from("team_members")
    .select("app_role")
    .eq("church_id", context.churchId)
    .eq("membership_id", context.membershipId)
    .maybeSingle();

  if (!canManageMinistryTeams(context.role as TeamRole, currentUserTeamMember?.app_role as AppRole | null)) {
    redirect("/ministry-teams?error=You%20do%20not%20have%20permission%20to%20manage%20ministry%20teams.");
  }
}

export async function createMinistryTeamAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    followUpCategories: formData.getAll("followUpCategories").filter((v): v is string => typeof v === "string"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    redirect("/ministry-teams?error=Please%20provide%20a%20valid%20team%20name.");
  }

  const { data: team, error } = await supabase
    .from("ministry_teams")
    .insert({
      church_id: context.churchId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      follow_up_categories: parsed.data.followUpCategories,
      is_active: parsed.data.isActive
    })
    .select("id")
    .single();

  if (error || !team) {
    console.error("[createMinistryTeamAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20create%20team.%20Name%20may%20already%20exist.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_team",
    target_id: team.id,
    action: "ministry_team.created",
    metadata: { name: parsed.data.name }
  });

  revalidatePath("/ministry-teams");
  redirect(`/ministry-teams?team=${team.id}&success=Team%20created.`);
}

export async function updateMinistryTeamAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const parsed = teamSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    description: formData.get("description"),
    followUpCategories: formData.getAll("followUpCategories").filter((v): v is string => typeof v === "string"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success || !parsed.data.teamId) {
    redirect("/ministry-teams?error=Invalid%20team%20data.");
  }

  const { error } = await supabase
    .from("ministry_teams")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      follow_up_categories: parsed.data.followUpCategories,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.teamId)
    .eq("church_id", context.churchId)
    .is("deleted_at", null);

  if (error) {
    console.error("[updateMinistryTeamAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20update%20team.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_team",
    target_id: parsed.data.teamId,
    action: "ministry_team.updated",
    metadata: { name: parsed.data.name }
  });

  revalidatePath("/ministry-teams");
  redirect(`/ministry-teams?team=${parsed.data.teamId}&success=Team%20updated.`);
}

export async function archiveMinistryTeamAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const teamId = formData.get("teamId");
  if (!teamId || typeof teamId !== "string") {
    redirect("/ministry-teams?error=Invalid%20team%20ID.");
  }

  const { error } = await supabase
    .from("ministry_teams")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", teamId)
    .eq("church_id", context.churchId);

  if (error) {
    console.error("[archiveMinistryTeamAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20archive%20team.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_team",
    target_id: teamId,
    action: "ministry_team.archived",
    metadata: {}
  });

  revalidatePath("/ministry-teams");
  redirect("/ministry-teams?success=Team%20archived.");
}

export async function createMinistryPersonAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const parsed = personSchema.safeParse({
    fullName: formData.get("fullName"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    redirect("/ministry-teams?error=Please%20provide%20a%20valid%20full%20name.");
  }

  const { data: person, error } = await supabase
    .from("ministry_people")
    .insert({
      church_id: context.churchId,
      full_name: parsed.data.fullName,
      notes: parsed.data.notes ?? null,
      is_active: parsed.data.isActive
    })
    .select("id")
    .single();

  if (error || !person) {
    console.error("[createMinistryPersonAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20create%20person.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_person",
    target_id: person.id,
    action: "ministry_person.created",
    metadata: { full_name: parsed.data.fullName }
  });

  revalidatePath("/ministry-teams");
  redirect(`/ministry-teams?tab=people&success=Person%20created.`);
}

export async function updateMinistryPersonAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const parsed = personSchema.safeParse({
    personId: formData.get("personId"),
    fullName: formData.get("fullName"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success || !parsed.data.personId) {
    redirect("/ministry-teams?error=Invalid%20person%20data.");
  }

  const { error } = await supabase
    .from("ministry_people")
    .update({
      full_name: parsed.data.fullName,
      notes: parsed.data.notes ?? null,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.personId)
    .eq("church_id", context.churchId)
    .is("deleted_at", null);

  if (error) {
    console.error("[updateMinistryPersonAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20update%20person.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_person",
    target_id: parsed.data.personId,
    action: "ministry_person.updated",
    metadata: { full_name: parsed.data.fullName }
  });

  revalidatePath("/ministry-teams");
  redirect(`/ministry-teams?tab=people&success=Person%20updated.`);
}

export async function archiveMinistryPersonAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const personId = formData.get("personId");
  if (!personId || typeof personId !== "string") {
    redirect("/ministry-teams?error=Invalid%20person%20ID.");
  }

  const { error } = await supabase
    .from("ministry_people")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", personId)
    .eq("church_id", context.churchId);

  if (error) {
    console.error("[archiveMinistryPersonAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20archive%20person.");
  }

  await supabase.from("ministry_team_memberships")
    .update({ deleted_at: new Date().toISOString() })
    .eq("person_id", personId)
    .eq("church_id", context.churchId);

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_person",
    target_id: personId,
    action: "ministry_person.archived",
    metadata: {}
  });

  revalidatePath("/ministry-teams");
  redirect("/ministry-teams?tab=people&success=Person%20archived.");
}

export async function addMinistryTeamMembershipAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const parsed = membershipSchema.safeParse({
    teamId: formData.get("teamId"),
    personId: formData.get("personId"),
    positionTitle: formData.get("positionTitle"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) {
    redirect("/ministry-teams?error=Invalid%20membership%20data.");
  }

  const { data: existing } = await supabase
    .from("ministry_team_memberships")
    .select("id")
    .eq("church_id", context.churchId)
    .eq("team_id", parsed.data.teamId)
    .eq("person_id", parsed.data.personId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    redirect("/ministry-teams?error=This%20person%20is%20already%20on%20the%20team.");
  }

  const { data: membership, error } = await supabase
    .from("ministry_team_memberships")
    .insert({
      church_id: context.churchId,
      team_id: parsed.data.teamId,
      person_id: parsed.data.personId,
      position_title: parsed.data.positionTitle ?? null,
      notes: parsed.data.notes ?? null,
      is_active: parsed.data.isActive
    })
    .select("id")
    .single();

  if (error || !membership) {
    console.error("[addMinistryTeamMembershipAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20add%20person%20to%20team.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_team_membership",
    target_id: membership.id,
    action: "ministry_team_membership.created",
    metadata: { team_id: parsed.data.teamId, person_id: parsed.data.personId }
  });

  revalidatePath("/ministry-teams");
  redirect(`/ministry-teams?team=${parsed.data.teamId}&success=Person%20added%20to%20team.`);
}

export async function updateMinistryTeamMembershipAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const parsed = membershipSchema.safeParse({
    membershipId: formData.get("membershipId"),
    teamId: formData.get("teamId"),
    personId: formData.get("personId"),
    positionTitle: formData.get("positionTitle"),
    notes: formData.get("notes"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success || !parsed.data.membershipId) {
    redirect("/ministry-teams?error=Invalid%20membership%20data.");
  }

  const { error } = await supabase
    .from("ministry_team_memberships")
    .update({
      position_title: parsed.data.positionTitle ?? null,
      notes: parsed.data.notes ?? null,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.membershipId)
    .eq("church_id", context.churchId)
    .is("deleted_at", null);

  if (error) {
    console.error("[updateMinistryTeamMembershipAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20update%20membership.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_team_membership",
    target_id: parsed.data.membershipId,
    action: "ministry_team_membership.updated",
    metadata: {}
  });

  revalidatePath("/ministry-teams");
  redirect(`/ministry-teams?team=${parsed.data.teamId}&success=Membership%20updated.`);
}

export async function archiveMinistryTeamMembershipAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  await requireMinistryTeamManager(context, supabase);

  const membershipId = formData.get("membershipId");
  const teamId = formData.get("teamId");
  if (!membershipId || typeof membershipId !== "string" || !teamId || typeof teamId !== "string") {
    redirect("/ministry-teams?error=Invalid%20membership%20data.");
  }

  const { error } = await supabase
    .from("ministry_team_memberships")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", membershipId)
    .eq("church_id", context.churchId);

  if (error) {
    console.error("[archiveMinistryTeamMembershipAction] error:", error);
    redirect("/ministry-teams?error=Could%20not%20remove%20person%20from%20team.");
  }

  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "ministry_team_membership",
    target_id: membershipId,
    action: "ministry_team_membership.archived",
    metadata: { team_id: teamId }
  });

  revalidatePath("/ministry-teams");
  redirect(`/ministry-teams?team=${teamId}&success=Person%20removed%20from%20team.`);
}
