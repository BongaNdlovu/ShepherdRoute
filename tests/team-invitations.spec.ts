import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const schema = readFileSync("supabase/schema.sql", "utf8");
const teamAction = readFileSync("app/(dashboard)/_actions/team.ts", "utf8");
const authActions = readFileSync("app/(auth)/actions.ts", "utf8");

test.describe("team invitation workflow", () => {
  test("schema stores hashed expiring invitations", () => {
    expect(schema).toContain("create type public.team_invitation_status as enum");
    expect(schema).toContain("create table if not exists public.team_invitations");
    expect(schema).toContain("set search_path = public, extensions");
    expect(schema).toContain("token_hash text not null unique");
    expect(schema).toContain("expires_at timestamptz not null default now() + interval '14 days'");
  });

  test("schema accepts invitations without creating duplicate churches", () => {
    expect(schema).toContain("create or replace function private.accept_team_invitation_for_user");
    expect(schema).toContain("perform private.accept_team_invitation_for_user(invite_token, new.id, new.email);");
    expect(schema).toContain("return new;");
    expect(schema).toContain("insert into public.church_memberships");
  });

  test("team action creates hashed invite tokens", () => {
    expect(teamAction).toContain("randomBytes(32)");
    expect(teamAction).toContain("createHash(\"sha256\")");
    expect(teamAction).toContain("team_invitations");
    expect(teamAction).toContain("redirect(`/settings/team?invite=");
  });

  test("auth actions pass invite tokens through signup and login", () => {
    expect(authActions).toContain("invite_token: parsed.data.inviteToken");
    expect(authActions).toContain("accept_team_invitation");
    expect(authActions).toContain("selected_church_id");
  });
});
