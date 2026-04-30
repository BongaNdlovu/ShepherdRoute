import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { defaultDueDate } from "@/lib/followUp";
import { canChangeChurchRole, canInviteRole, canManageMembershipStatus, canManageTeam } from "@/lib/permissions";
import { generateMessage } from "@/lib/whatsapp";

const schema = readFileSync("supabase/schema.sql", "utf8");
const dashboardLayout = readFileSync("app/(dashboard)/layout.tsx", "utf8");
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
    expect(schema).toContain("Only ShepherdRoute app owners can update account access.");
    expect(schema).toContain("Only ShepherdRoute app owners can update church roles.");
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

  test("WhatsApp messages do not append robotic STOP copy", () => {
    const message = generateMessage({
      name: "Thandi M.",
      phone: "+27820000000",
      interests: ["bible_study"],
      churchName: "Pinetown SDA"
    });

    expect(message).not.toContain("Reply STOP");
    expect(message).not.toContain("no longer wish");
  });

  test("do-not-contact messages stay message-only", () => {
    const message = generateMessage({
      name: "Thandi M.",
      phone: "+27820000000",
      interests: ["bible_study"]
    });

    expect(message).not.toContain("Reply STOP");
  });

  test("WhatsApp baptism message includes baptismal preparation wording", () => {
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
    expect(message).not.toContain("Reply STOP");
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

  test("dashboard sidebar keeps logout visible below scrollable content", () => {
    expect(dashboardLayout).toContain("flex flex-col");
    expect(dashboardLayout).toContain("overflow-y-auto");
    expect(dashboardLayout).toContain("aria-label=\"Log out\"");
    expect(dashboardLayout).toContain("action={logoutAction}");
  });

  test("manual due-date fallback matches database due-date priorities", () => {
    const high = defaultDueDate("high").getTime();
    const pastor = defaultDueDate("medium", "pastor").getTime();
    const bibleStudy = defaultDueDate("low", "bible_worker", ["bible_study"]).getTime();
    const general = defaultDueDate("low", "elder", ["general_visit"]).getTime();

    expect(high).toBeLessThan(pastor);
    expect(pastor).toBeLessThan(bibleStudy);
    expect(bibleStudy).toBeLessThan(general);
    expect(schema).toContain("else now() + interval '5 days'");
  });

  test("schema includes purpose, approved_at, opened_at columns for suggested WhatsApp workflow", () => {
    expect(schema).toContain("purpose text not null default 'manual'");
    expect(schema).toContain("approved_at timestamptz");
    expect(schema).toContain("opened_at timestamptz");
  });

  test("schema includes unique partial index for one suggested WhatsApp per contact", () => {
    expect(schema).toContain("generated_messages_one_suggestion_per_contact_idx");
    expect(schema).toContain("where purpose = 'suggested_whatsapp'");
  });

  test("generated message schema is migration-safe and supports timestamp updates", () => {
    expect(schema).toContain("add column if not exists purpose text not null default 'manual'");
    expect(schema).toContain("add column if not exists approved_at timestamptz");
    expect(schema).toContain("add column if not exists opened_at timestamptz");
    expect(schema).toContain("Members can update generated messages");
  });

  test("contact workflow helper avoids partial-index upsert and records suggested purpose", () => {
    const contactWorkflow = readFileSync("lib/contactWorkflow.ts", "utf8");
    expect(contactWorkflow).toContain("chooseWorkflowOwner");
    expect(contactWorkflow).toContain("saveSuggestedWhatsappMessage");
    expect(contactWorkflow).toContain("maybeSingle");
    expect(contactWorkflow).not.toContain("onConflict: \"contact_id\"");
    expect(contactWorkflow).toContain("purpose: \"suggested_whatsapp\"");
  });

  test("manual contact creation assigns owner and saves suggested WhatsApp with generator", () => {
    const contactsActions = readFileSync("app/(dashboard)/_actions/contacts.ts", "utf8");
    expect(contactsActions).toContain("chooseWorkflowOwner");
    expect(contactsActions).toContain("saveSuggestedWhatsappMessage");
    expect(contactsActions).toContain("assigned_to: assignedTo");
    expect(contactsActions).toContain("status: assignedTo ? \"assigned\" : \"new\"");
    expect(contactsActions).toContain("generatedBy: context.userId");
  });

  test("public registration delegates owner assignment and suggested WhatsApp persistence to RPC", () => {
    const publicActions = readFileSync("app/e/[slug]/actions.ts", "utf8");
    expect(publicActions).toContain("submit_event_registration");
    expect(publicActions).not.toContain("chooseWorkflowOwner");
    expect(publicActions).not.toContain("saveSuggestedWhatsappMessage");
    expect(publicActions).not.toContain(".from(\"contacts\")");
    expect(schema).toContain("assigned_owner_id");
    expect(schema).toContain("suggested_message");
    expect(schema).toContain("purpose\n  )\n  values");
  });

  test("today's follow-ups query exists and returns suggested messages", () => {
    const dataReports = readFileSync("lib/data-reports.ts", "utf8");
    expect(dataReports).toContain("getTodayFollowUps");
    expect(dataReports).toContain("TodayFollowUpItem");
    expect(dataReports).toContain("suggested_message");
    expect(dataReports).toContain("purpose === \"suggested_whatsapp\"");
  });

  test("dashboard includes today's follow-ups card", () => {
    expect(dashboardPage).toContain("TodaysFollowUpsCard");
    expect(dashboardPage).toContain("todayFollowUps");
    const todaysFollowUpsCard = readFileSync("components/app/todays-follow-ups-card.tsx", "utf8");
    expect(todaysFollowUpsCard).toContain("openSuggestedWhatsappAction");
    expect(todaysFollowUpsCard).toContain("markFollowUpContactedAction");
  });

  test("opening suggested WhatsApp validates follow-up and updates approval timestamps", () => {
    const messagesActions = readFileSync("app/(dashboard)/_actions/messages.ts", "utf8");
    expect(messagesActions).toContain("openSuggestedWhatsappAction");
    expect(messagesActions).toContain(".from(\"follow_ups\")");
    expect(messagesActions).toContain(".eq(\"purpose\", \"suggested_whatsapp\")");
    expect(messagesActions).toContain("approved_at: now");
    expect(messagesActions).toContain("opened_at: now");
    expect(messagesActions).toContain("updateError");
  });

  test("mark contacted action validates open follow-up before updating contact", () => {
    const contactsActions = readFileSync("app/(dashboard)/_actions/contacts.ts", "utf8");
    expect(contactsActions).toContain("markFollowUpContactedAction");
    expect(contactsActions).toContain("Open%20follow-up%20task%20not%20found");
    expect(contactsActions).toContain("status: \"contacted\"");
    expect(contactsActions).toContain("completed_at: now");
  });

  test("new actions are exported from dashboard actions barrel", () => {
    const dashboardActions = readFileSync("app/(dashboard)/actions.ts", "utf8");
    expect(dashboardActions).toContain("openSuggestedWhatsappAction");
    expect(dashboardActions).toContain("markFollowUpContactedAction");
  });

  test("contact detail page prefers saved suggested message over live generation", () => {
    const contactDetailPage = readFileSync("app/(dashboard)/contacts/[id]/page.tsx", "utf8");
    expect(contactDetailPage).toContain("item.purpose === \"suggested_whatsapp\"");
    expect(contactDetailPage).toContain("suggestedMessage ?? generateMessage");
  });

  test("generated message select includes new purpose and timestamp columns", () => {
    const dataContacts = readFileSync("lib/data-contacts.ts", "utf8");
    expect(dataContacts).toContain("purpose");
    expect(dataContacts).toContain("approved_at");
    expect(dataContacts).toContain("opened_at");
  });

  test("follow-up queue route and RPC exist with pagination filters", () => {
    const followUpsPage = readFileSync("app/(dashboard)/follow-ups/page.tsx", "utf8");
    const dataFollowUps = readFileSync("lib/data-follow-ups.ts", "utf8");
    expect(schema).toContain("create or replace function public.search_follow_ups");
    expect(schema).toContain("limit greatest(1, least(coalesce(p_limit, 25), 100))");
    expect(dataFollowUps).toContain("getFollowUpsPage");
    expect(dataFollowUps).toContain("p_due_state");
    expect(dataFollowUps).toContain("pageSize = Math.min(100");
    expect(followUpsPage).toContain("FollowUpsQueueList");
    expect(followUpsPage).toContain("FollowUpsPagination");
  });

  test("dashboard follow-up card links to dedicated queue", () => {
    const card = readFileSync("components/app/todays-follow-ups-card.tsx", "utf8");
    expect(card).toContain("/follow-ups");
    expect(card).not.toContain("/contacts?status=assigned");
  });

  test("contacts and event report exports stream CSV instead of building all rows", () => {
    const contactsExport = readFileSync("app/(dashboard)/contacts/export/route.ts", "utf8");
    const eventExport = readFileSync("app/(dashboard)/events/[id]/report/export/route.ts", "utf8");
    const csv = readFileSync("lib/csv.ts", "utf8");
    expect(csv).toContain("streamCsvResponse");
    expect(csv).toContain("ReadableStream");
    expect(contactsExport).toContain("streamCsvResponse");
    expect(contactsExport).toContain("getContactsPage");
    expect(contactsExport).not.toContain("getContacts(");
    expect(eventExport).toContain("streamCsvResponse");
    expect(eventExport).toContain("getEventReportContactsPage");
  });

  test("CSV escaping protects spreadsheet formula-like values", () => {
    const csv = readFileSync("lib/csv.ts", "utf8");
    expect(csv).toContain("escapeCsvValue");
    expect(csv).toContain("/^[=+\\-@]/");
    expect(csv).toContain("text = `'${text}`");
  });

  test("scale scripts and package commands exist with seed guardrails", () => {
    const pkg = readFileSync("package.json", "utf8");
    const common = readFileSync("scripts/scale/common.mjs", "utf8");
    const seed = readFileSync("scripts/scale/seed.mjs", "utf8");
    expect(pkg).toContain("scale:seed");
    expect(pkg).toContain("scale:check");
    expect(pkg).toContain("scale:cleanup");
    expect(common).toContain("ALLOW_SCALE_SEED");
    expect(common).toContain("ALLOW_PRODUCTION_SCALE_SEED");
    expect(seed).toContain("allowedCounts");
    expect(seed).toContain("generated_messages");
    expect(seed).toContain("follow_ups");
  });
});
