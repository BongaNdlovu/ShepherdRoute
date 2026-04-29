import type { TeamRole } from "@/lib/constants";

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
  isProtectedOwner?: boolean;
};

const churchLeaderRoles: TeamRole[] = ["admin", "pastor"];
const ministryRoles: TeamRole[] = ["pastor", "elder", "bible_worker", "health_leader", "prayer_team", "youth_leader", "viewer"];

export function canManageTeam(role: TeamRole) {
  return churchLeaderRoles.includes(role);
}

export function canDeactivateTeamMember(role: TeamRole) {
  return canManageTeam(role);
}

export function canRequestTeamDeletion(role: TeamRole) {
  return canManageTeam(role);
}

export function canHardDeleteTeamMember(actor: AppAdminPermissionContext) {
  return canManageOwnerAdmin(actor);
}

export function canChangeChurchRole(actorRole: TeamRole, targetRole: TeamRole, newRole: TeamRole) {
  if (!canManageTeam(actorRole)) {
    return false;
  }

  if (targetRole === "admin" && newRole !== "admin") {
    return false;
  }

  return ministryRoles.includes(newRole);
}

export function canInviteRole(actorRole: TeamRole, inviteRole: TeamRole) {
  if (!canManageTeam(actorRole)) {
    return false;
  }

  return ministryRoles.includes(inviteRole);
}

export function canManageEvents(role: TeamRole) {
  return ["admin", "pastor", "elder", "health_leader", "youth_leader"].includes(role);
}

export function canManageContacts(role: TeamRole) {
  return ["admin", "pastor", "elder", "bible_worker", "health_leader", "youth_leader"].includes(role);
}

export function canAssignFollowUp(role: TeamRole) {
  return ["admin", "pastor", "elder", "bible_worker", "health_leader", "youth_leader"].includes(role);
}

export function canViewPrayerRequest(role: TeamRole, visibility: PrayerVisibility) {
  if (visibility === "general_prayer" || visibility === "pastoral_prayer") {
    return ["admin", "pastor", "prayer_team"].includes(role);
  }

  if (visibility === "family_support") {
    return ["admin", "pastor", "elder"].includes(role);
  }

  if (visibility === "health_related") {
    return ["admin", "pastor", "health_leader"].includes(role);
  }

  return role === "admin" || role === "pastor";
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
