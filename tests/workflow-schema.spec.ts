import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { defaultDueDate } from "@/lib/followUp";
import { canChangeChurchRole, canInviteRole, canManageMembershipStatus, canManageTeam } from "@/lib/permissions";
import { generateMessage } from "@/lib/whatsapp";

const schema = readFileSync("supabase/schema.sql", "utf8");
const dashboardPage = readFileSync("app/(dashboard)/dashboard/page.tsx", "utf8");
const eventsPage = readFileSync("app/(dashboard)/events/page.tsx", "utf8");
const eventDetailPage = readFileSync("app/(dashboard)/events/[id]/page.tsx", "utf8");
const eventActions = readFileSync("app/(dashboard)/_actions/events.ts", "utf8");
const teamActions = readFileSync("app/(dashboard)/_actions/team.ts", "utf8");
const publicEventPage = readFileSync("app/e/[slug]/page.tsx", "utf8");

test.describe("accountability and privacy workflow schema", () => {
  test("schema includes duplicate-aware people and journey storage", () => {
    expect(schema).toContain("create table if not exists public.people");
    expect(schema).toContain("create table if not exists public.contact_journey_events");
    expect(schema).toContain("duplicate_match_confidence");
    expect(schema).toContain("private.prepare_contact_identity");
  });

  test("schema includes deadline and dashboard accountability metrics", () => {
    expect(schema).toContain("private.default_follow_up_due_at");
    expect(schema).toContain("due_today_count bigint");
    expect(schema).toContain("overdue_count bigint");
    expect(schema).toContain("unassigned_count bigint");
    expect(schema).toContain("baptism_count bigint");
  });

  test("schema due-date logic includes baptism in the 2-day follow-up set", () => {
    expect(schema).toContain("array['bible_study','prayer','baptism']");
  });

  test("schema includes prayer visibility and consent workflow fields", () => {
    expect(schema).toContain("general_prayer");
    expect(schema).toContain("private_contact");
    expect(schema).toContain("consent_scope text[]");
    expect(schema).toContain("do_not_contact boolean");
  });

  test("schema includes event archive lifecycle support", () => {
    expect(schema).toContain("archived_at timestamptz");
    expect(schema).toContain("add column if not exists archived_at timestamptz");
    expect(schema).toContain("events.archived_at is null");
  });

  test("schema includes phase 1 account control guardrails", () => {
    expect(schema).toContain("create table if not exists public.audit_logs");
    expect(schema).toContain("owner_update_membership_status");
    expect(schema).toContain("owner_update_membership_role");
    expect(schema).toContain("if not private.is_app_owner() then");
    expect(schema).toContain("Only ShepardRoute app owners can update account access.");
    expect(schema).toContain("Only ShepardRoute app owners can update church roles.");
    expect(schema).toContain("Protected owner access cannot be deactivated from the app.");
    expect(schema).toContain("Every church must keep at least one active admin or pastor.");
    expect(schema).toContain("membership.status_changed");
    expect(schema).toContain("membership.role_changed");
    expect(teamActions).toContain("team_member.created");
    expect(teamActions).toContain("invitation.created");
    expect(teamActions).toContain("invitation.revoked");
    expect(schema).toContain("invitation.accepted");
  });

  test("schema removes broad direct membership and team delete paths", () => {
    expect(schema).not.toMatch(/create policy "Admins can manage memberships"[\s\S]*?for all/);
    expect(schema).not.toMatch(/create policy "Leaders can manage church team"[\s\S]*?for all/);
    expect(schema).not.toMatch(/create policy "Leaders can delete church team"/);
    expect(schema).not.toMatch(/create policy "Leaders can delete memberships"/);
    expect(schema).toContain("drop policy if exists \"Leaders can delete church team\"");
    expect(schema).toContain("drop policy if exists \"Leaders can delete church invitations\"");
    expect(schema).toContain("revoke insert, update, delete on table public.church_memberships from anon, authenticated");
    expect(schema).toContain("grant update (display_name, phone, email, role, is_active, updated_at) on table public.team_members to authenticated");
  });

  test("team invitation role restrictions are enforced in schema and actions", () => {
    expect(schema).toContain("role in ('pastor','elder','bible_worker','health_leader','prayer_team','youth_leader','viewer')");
    expect(teamActions).toContain("canInviteRole");
    expect(teamActions).toContain("audit_logs");
  });
});

test.describe("workflow helpers", () => {
  test("pastors and admins have matching church-level team permissions", () => {
    expect(canManageTeam("admin")).toBe(true);
    expect(canManageTeam("pastor")).toBe(true);
    expect(canInviteRole("admin", "elder")).toBe(true);
    expect(canInviteRole("pastor", "elder")).toBe(true);
    expect(canInviteRole("admin", "admin")).toBe(false);
    expect(canInviteRole("pastor", "admin")).toBe(false);
    expect(canChangeChurchRole("admin", "elder", "pastor")).toBe(true);
    expect(canChangeChurchRole("pastor", "elder", "pastor")).toBe(true);
  });

  test("protected owner membership management is blocked by helpers", () => {
    expect(canManageMembershipStatus({ role: "owner", isProtectedOwner: false }, { role: "admin" })).toBe(true);
    expect(canManageMembershipStatus({ role: "owner", isProtectedOwner: false }, { role: "admin", isProtectedOwner: true })).toBe(false);
  });

  test("event lifecycle actions expose close, archive, restore, and delete workflows", () => {
    expect(eventActions).toContain("updateEventStatusAction");
    expect(eventActions).toContain("updateEventArchiveAction");
    expect(eventActions).toContain("deleteEventAction");
    expect(eventActions).toContain(".delete()");
    expect(eventDetailPage).toContain("Archive event");
    expect(eventDetailPage).toContain("Restore event");
    expect(eventDetailPage).toContain("Delete event");
    expect(eventDetailPage).toContain("Type the event name to delete");
  });

  test("QR public URLs use the request origin instead of a stale deployment URL", () => {
    expect(dashboardPage).toContain("absoluteRequestUrl");
    expect(eventsPage).toContain("requestOrigin");
    expect(eventDetailPage).toContain("absoluteRequestUrl");
    expect(dashboardPage).not.toContain("absoluteUrl(`/e/");
    expect(eventsPage).not.toContain("absoluteUrl(`/e/");
    expect(eventDetailPage).not.toContain("absoluteUrl(`/e/");
  });

  test("best time options do not include channel-only preferences", () => {
    expect(publicEventPage).toContain("Best time to contact");
    expect(publicEventPage).not.toContain("WhatsApp first");
  });

  test("high urgency deadline is sooner than medium urgency", () => {
    const high = defaultDueDate("high").getTime();
    const medium = defaultDueDate("medium").getTime();

    expect(high).toBeLessThan(medium);
  });

  test("WhatsApp messages include a gentle opt-out line", () => {
    const message = generateMessage({
      name: "Thandi M.",
      phone: "+27820000000",
      interests: ["bible_study"],
      churchName: "Pinetown SDA"
    });

    expect(message).toContain("Reply STOP");
  });

  test("do-not-contact messages do not add opt-out copy", () => {
    const message = generateMessage({
      name: "Thandi M.",
      phone: "+27820000000",
      interests: ["bible_study"],
      doNotContact: true
    });

    expect(message).not.toContain("Reply STOP");
  });

  test("WhatsApp baptism message includes baptismal preparation wording and opt-out", () => {
    const message = generateMessage({
      name: "Thandi M.",
      phone: "+27820000000",
      interests: ["baptism"],
      churchName: "Pinetown SDA"
    });

    expect(message).toContain("Thank you for sharing your baptismal request");
    expect(message).toContain("Bible worker");
    expect(message).toContain("preparation");
    expect(message).toContain("Bible study");
    expect(message).toContain("Reply STOP");
  });

  test("report RPC type definitions match report summary table returns", () => {
    const dbTypes = readFileSync("lib/supabase/database.types.ts", "utf8");

    expect(dbTypes).toMatch(
      /outreach_report_summary:\s*\{[\s\S]*?Returns: Array<\{[\s\S]*?baptism_count: number;[\s\S]*?waiting_reply_count: number;[\s\S]*?no_consent_count: number;[\s\S]*?events: Json;[\s\S]*?\}>;/
    );
    expect(dbTypes).toMatch(
      /event_report_summary:\s*\{[\s\S]*?Returns: Array<\{[\s\S]*?baptism_count: number;[\s\S]*?follow_up_count: number;[\s\S]*?status_counts: Json;[\s\S]*?interest_counts: Json;[\s\S]*?\}>;/
    );
  });
});
