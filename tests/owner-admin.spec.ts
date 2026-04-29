import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const schema = readFileSync("supabase/schema.sql", "utf8");

test.describe("owner admin account controls", () => {
  test("schema exposes owner-only account rows", () => {
    expect(schema).toContain("create or replace function public.owner_account_rows()");
    expect(schema).toContain("church_memberships.status");
    expect(schema).toContain("team_member_active");
    expect(schema).toContain("Only ShepardRoute app admins can view account rows.");
  });

  test("schema exposes safe membership status updates", () => {
    expect(schema).toContain("create or replace function public.owner_update_membership_status");
    expect(schema).toContain("p_status public.membership_status");
    expect(schema).toContain("set is_active = p_status = 'active'");
    expect(schema).toContain("Only ShepardRoute app admins can update account access.");
  });
});
