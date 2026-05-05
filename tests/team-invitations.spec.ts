import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const schema = readFileSync("supabase/schema.sql", "utf8");
const teamAction = readFileSync("app/(dashboard)/_actions/team.ts", "utf8");
const teamPage = readFileSync("app/(dashboard)/team/page.tsx", "utf8");
const authActions = readFileSync("app/(auth)/actions.ts", "utf8");
const signupPage = readFileSync("app/(auth)/signup/page.tsx", "utf8");
const eventAssignments = readFileSync("app/(dashboard)/_actions/event-assignments.ts", "utf8");
const eventInvitationModal = readFileSync("components/app/event-invitation-modal.tsx", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const deploymentDocs = readFileSync("docs/deployment.md", "utf8");
const setupDocs = readFileSync("docs/supabase-schema-setup.md", "utf8");

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

  test("workspace invite email drafts use the real invite route", () => {
    expect(teamAction).toContain("/invite/${parsed.data.token}");
    expect(teamAction).not.toContain("/team-invitations/accept");
    expect(teamPage).toContain("Open Gmail draft");
    expect(teamPage).toContain("Open email draft");
  });

  test("event email invites return draft links to the visible modal", () => {
    expect(eventAssignments).toContain("gmailUrl: gmailComposeUrl");
    expect(eventAssignments).toContain("emailUrl: mailtoUrl");
    expect(eventInvitationModal).toContain("setGmailUrl(result.gmailUrl");
    expect(eventInvitationModal).toContain("Open Gmail draft");
    expect(eventInvitationModal).toContain("Open email draft");
  });

  test("auth actions pass invite tokens through signup and login", () => {
    expect(authActions).toContain("invite_token: parsed.data.inviteToken");
    expect(authActions).toContain("accept_team_invitation");
    expect(authActions).toContain("selected_church_id");
  });

  test("normal signup requires a private platform signup code", () => {
    expect(signupPage).toContain("name=\"platformSignupCode\"");
    expect(signupPage).toContain("Signup code");
    expect(authActions).toContain("platformSignupCode: formData.get(\"platformSignupCode\")");
    expect(authActions).toContain("SHEPHERDROUTE_SIGNUP_CODE");
    expect(authActions).toContain("timingSafeEqual");
    expect(authActions).toContain("The signup code is not correct.");
  });

  test("invite signup bypasses the platform signup code", () => {
    expect(authActions).toContain("if (value.inviteToken) {");
    expect(authActions).toContain("return;");
    expect(authActions).toContain("invite_token: parsed.data.inviteToken");
    expect(signupPage).toContain("{!params.invite ? (");
  });

  test("signup code is documented as a server-only environment variable", () => {
    expect(envExample).toContain("SHEPHERDROUTE_SIGNUP_CODE=");
    expect(deploymentDocs).toContain("SHEPHERDROUTE_SIGNUP_CODE");
    expect(deploymentDocs).toContain("Do not prefix it with `NEXT_PUBLIC_`");
    expect(setupDocs).toContain("SHEPHERDROUTE_SIGNUP_CODE");
  });
});
