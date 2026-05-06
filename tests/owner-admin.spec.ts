import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const schema = readFileSync("supabase/schema.sql", "utf8");
const adminActions = readFileSync("app/(dashboard)/_actions/admin.ts", "utf8");
const adminUsersPage = readFileSync("app/(dashboard)/admin/users/page.tsx", "utf8");

test.describe("owner admin account controls", () => {
  test("schema exposes owner-only account rows", () => {
    expect(schema).toContain("create or replace function public.owner_account_rows()");
    expect(schema).toContain("church_memberships.status");
    expect(schema).toContain("team_member_active");
    expect(schema).toContain("app_admin_role public.app_admin_role");
    expect(schema).toContain("is_protected_owner boolean");
    expect(schema).toContain("security definer");
    expect(schema).toContain("perform private.require_app_admin()");
  });

  test("schema exposes owner invitation visibility", () => {
    expect(schema).toContain("create or replace function public.owner_invitation_rows()");
    expect(schema).toContain("perform private.require_app_admin()");
    expect(schema).toContain("team_invitations.status");
    expect(schema).toContain("'workspace_team' as source");
    expect(schema).toContain("'event_team' as source");
    expect(schema).toContain("event_assignments.status");
    expect(schema).toContain("events.name as event_name");
  });

  test("schema exposes owner invitation and event assignment reset controls", () => {
    expect(schema).toContain("create or replace function public.owner_reset_workspace_invites");
    expect(schema).toContain("create or replace function public.owner_reset_event_invites");
    expect(schema).toContain("invitation.workspace_reset");
    expect(schema).toContain("invitation.event_reset");
    expect(schema).toContain("invitation_token_hash = null");
    expect(schema).toContain("join target_invitations on target_invitations.team_member_id = team_members.id");
    expect(schema).toContain("linked_team_members.membership_id");
    expect(schema).toContain("join target_assignments on target_assignments.team_member_id = team_members.id");
    expect(schema).toContain("target_assignments.invitee_email is not null");
    expect(schema).toContain("other_team_members.membership_id = church_memberships.id");
    expect(adminActions).toContain("resetWorkspaceInvitesAction");
    expect(adminActions).toContain("resetEventInvitesAction");
    expect(adminActions).toContain("owner_reset_workspace_invites");
    expect(adminActions).toContain("owner_reset_event_invites");
  });

  test("schema exposes safe owner team member controls", () => {
    expect(schema).toContain("create or replace function public.owner_disable_workspace_team_member");
    expect(schema).toContain("create or replace function public.owner_remove_workspace_team_member");
    expect(schema).toContain("create or replace function public.owner_delete_workspace_team_member");
    expect(schema).toContain("create or replace function public.owner_revoke_event_assignment");
    expect(schema).toContain("create or replace function public.owner_delete_event_assignment");
    expect(schema).toContain("Cannot delete team member with login access. Use disable or remove instead.");
    expect(schema).toContain("team_member.disabled");
    expect(schema).toContain("team_member.removed");
    expect(schema).toContain("team_member.deleted");
    expect(schema).toContain("event_assignment.revoked");
    expect(schema).toContain("event_assignment.deleted");
    expect(schema).toContain("if target_assignment.team_member_id is not null");
    expect(schema).toContain("linked_event_invite_member");
    expect(schema).toContain("other_assignments.id <> p_assignment_id");
    expect(adminActions).toContain("disableWorkspaceTeamMemberAction");
    expect(adminActions).toContain("removeWorkspaceTeamMemberAction");
    expect(adminActions).toContain("deleteWorkspaceTeamMemberAction");
    expect(adminActions).toContain("revokeEventAssignmentAction");
    expect(adminActions).toContain("deleteEventAssignmentAction");
  });

  test("schema exposes safe membership status updates", () => {
    expect(schema).toContain("create or replace function public.owner_update_membership_status");
    expect(schema).toContain("p_status public.membership_status");
    expect(schema).toContain("set is_active = p_status = 'active'");
    expect(schema).toContain("perform private.require_app_admin(array['owner','support_admin']");
    expect(schema).toContain("Protected owner access cannot be deactivated from the app.");
  });

  test("owner role changes are wired through schema, action, and admin UI", () => {
    expect(schema).toContain("create or replace function public.owner_update_membership_role");
    expect(schema).toContain("Protected owner church role cannot be changed from the app.");
    expect(schema).toContain("membership.role_changed");
    expect(adminActions).toContain("updateOwnerMembershipRoleAction");
    expect(adminActions).toContain("owner_update_membership_role");
    expect(adminUsersPage).toContain("updateOwnerMembershipRoleAction");
    expect(adminUsersPage).toContain("roleOptions.map");
  });

  test("schema protects platform owner records", () => {
    expect(schema).toContain("create type public.app_admin_role as enum");
    expect(schema).toContain("create or replace function private.is_app_owner()");
    expect(schema).toContain("is_protected_owner = true");
  });

  test("schema exposes lightweight owner admin overview", () => {
    expect(schema).toContain("create or replace function public.owner_admin_overview()");
    expect(schema).toContain("perform private.require_app_admin()");
    expect(schema).toContain("church_count bigint");
    expect(schema).toContain("pending_invitation_count bigint");
    expect(schema).toContain("grant execute on function public.owner_admin_overview() to authenticated");
  });
});
