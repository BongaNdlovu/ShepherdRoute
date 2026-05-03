import type { TeamRole, AppRole } from "@/lib/constants";

export type AppAdminRole = "owner" | "support_admin" | "billing_admin";
export type PrayerVisibility =
  | "general_prayer"
  | "pastor_only"
  | "private_contact"
  | "family_support"
  | "sensitive"
  | "health_related"
  | "pastoral_prayer"
  | "pastors_only";

export type AppAdminPermissionContext = {
  role: AppAdminRole | null;
  isProtectedOwner: boolean;
};

export type MembershipPermissionContext = {
  role: TeamRole;
  appRole?: AppRole | null;
  isProtectedOwner?: boolean;
};

const churchLeaderRoles: TeamRole[] = ["admin", "pastor"];
const ministryRoles: TeamRole[] = ["pastor", "elder", "bible_worker", "health_leader", "prayer_team", "youth_leader", "viewer"];

function getEffectiveRole(role: TeamRole, appRole: AppRole | null | undefined): TeamRole {
  if (appRole === "admin") return "admin";
  if (appRole === "coordinator") return "pastor";
  if (appRole === "viewer") return "viewer";
  return role;
}

export function canManageTeam(role: TeamRole, appRole?: AppRole | null) {
  const effectiveRole = getEffectiveRole(role, appRole);
  return churchLeaderRoles.includes(effectiveRole);
}

export function canDeactivateTeamMember(role: TeamRole, appRole?: AppRole | null) {
  return canManageTeam(role, appRole);
}

export function canRequestTeamDeletion(role: TeamRole, appRole?: AppRole | null) {
  return canManageTeam(role, appRole);
}

export function canHardDeleteTeamMember(actor: AppAdminPermissionContext) {
  return canManageOwnerAdmin(actor);
}

export function canChangeChurchRole(actorRole: TeamRole, targetRole: TeamRole, newRole: TeamRole, actorAppRole?: AppRole | null) {
  if (!canManageTeam(actorRole, actorAppRole)) {
    return false;
  }

  if (targetRole === "admin" && newRole !== "admin") {
    return false;
  }

  return ministryRoles.includes(newRole);
}

export function canInviteRole(actorRole: TeamRole, inviteRole: TeamRole, actorAppRole?: AppRole | null) {
  if (!canManageTeam(actorRole, actorAppRole)) {
    return false;
  }

  return ministryRoles.includes(inviteRole);
}

export function canManageEvents(role: TeamRole, appRole?: AppRole | null) {
  const effectiveRole = getEffectiveRole(role, appRole);
  return ["admin", "pastor", "elder", "health_leader", "youth_leader"].includes(effectiveRole);
}

export function canManageContacts(role: TeamRole, appRole?: AppRole | null) {
  const effectiveRole = getEffectiveRole(role, appRole);
  return ["admin", "pastor", "elder", "bible_worker", "health_leader", "youth_leader"].includes(effectiveRole);
}

export function canAssignFollowUp(role: TeamRole, appRole?: AppRole | null) {
  const effectiveRole = getEffectiveRole(role, appRole);
  return ["admin", "pastor", "elder", "bible_worker", "health_leader", "youth_leader"].includes(effectiveRole);
}

export function canViewPrayerRequest(role: TeamRole, visibility: PrayerVisibility, appRole?: AppRole | null) {
  const effectiveRole = getEffectiveRole(role, appRole);

  if (visibility === "general_prayer" || visibility === "pastoral_prayer") {
    return ["admin", "pastor", "prayer_team"].includes(effectiveRole);
  }

  if (visibility === "family_support") {
    return ["admin", "pastor", "elder"].includes(effectiveRole);
  }

  if (visibility === "health_related") {
    return ["admin", "pastor", "health_leader"].includes(effectiveRole);
  }

  return effectiveRole === "admin" || effectiveRole === "pastor";
}

export function canManageOwnerAdmin(actor: AppAdminPermissionContext) {
  return actor.isProtectedOwner || actor.role === "owner";
}

export function canManageMembershipStatus(
  actor: AppAdminPermissionContext,
  target: MembershipPermissionContext
) {
  if (!canManageOwnerAdmin(actor)) {
    return false;
  }

  return target.isProtectedOwner !== true;
}

export function canDeactivateMembership(
  actor: AppAdminPermissionContext,
  target: MembershipPermissionContext
) {
  return canManageMembershipStatus(actor, target);
}
