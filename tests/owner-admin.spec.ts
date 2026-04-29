import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const schema = readFileSync("supabase/schema.sql", "utf8");
const adminActions = readFileSync("app/(dashboard)/_actions/admin.ts", "utf8");
const adminPage = readFileSync("app/(dashboard)/admin/page.tsx", "utf8");

test.describe("owner admin account controls", () => {
  test("schema exposes owner-only account rows", () => {
    expect(schema).toContain("create or replace function public.owner_account_rows()");
    expect(schema).toContain("church_memberships.status");
    expect(schema).toContain("team_member_active");
    expect(schema).toContain("app_admin_role public.app_admin_role");
    expect(schema).toContain("is_protected_owner boolean");
    expect(schema).toContain("security definer");
    expect(schema).toContain("Only ShepardRoute app admins can view account rows.");
  });

  test("schema exposes owner invitation visibility", () => {
    expect(schema).toContain("create or replace function public.owner_invitation_rows()");
    expect(schema).toContain("Only ShepardRoute app admins can view invitation rows.");
    expect(schema).toContain("team_invitations.status");
  });

  test("schema exposes safe membership status updates", () => {
    expect(schema).toContain("create or replace function public.owner_update_membership_status");
    expect(schema).toContain("p_status public.membership_status");
    expect(schema).toContain("set is_active = p_status = 'active'");
    expect(schema).toContain("Protected owner access cannot be deactivated from the app.");
    expect(schema).toContain("Only ShepardRoute app owners can update account access.");
  });

  test("owner role changes are wired through schema, action, and admin UI", () => {
    expect(schema).toContain("create or replace function public.owner_update_membership_role");
    expect(schema).toContain("Protected owner church role cannot be changed from the app.");
    expect(schema).toContain("membership.role_changed");
    expect(adminActions).toContain("updateOwnerMembershipRoleAction");
    expect(adminActions).toContain("owner_update_membership_role");
    expect(adminPage).toContain("updateOwnerMembershipRoleAction");
    expect(adminPage).toContain("roleOptions.map");
  });

  test("schema protects platform owner records", () => {
    expect(schema).toContain("create type public.app_admin_role as enum");
    expect(schema).toContain("create or replace function private.is_app_owner()");
    expect(schema).toContain("is_protected_owner = true");
  });
});
