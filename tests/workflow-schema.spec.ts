import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { defaultDueDate } from "@/lib/followUp";
import { canChangeChurchRole, canInviteRole, canManageMembershipStatus, canManageTeam } from "@/lib/permissions";
import { createWhatsappLink, generateMessage, normalizeWhatsappPhone } from "@/lib/whatsapp";

const schema = readFileSync("supabase/schema.sql", "utf8");
const dashboardLayout = readFileSync("app/(dashboard)/layout.tsx", "utf8");
const dashboardPage = readFileSync("app/(dashboard)/dashboard/page.tsx", "utf8");
const eventsPage = readFileSync("app/(dashboard)/events/page.tsx", "utf8");
const eventDetailPage = readFileSync("app/(dashboard)/events/[id]/page.tsx", "utf8");
const eventActions = readFileSync("app/(dashboard)/_actions/events.ts", "utf8");
const teamActions = readFileSync("app/(dashboard)/_actions/team.ts", "utf8");
const publicEventPage = readFileSync("app/e/[slug]/page.tsx", "utf8");
const authActions = readFileSync("app/(auth)/actions.ts", "utf8");

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
    expect(schema).toContain("perform private.require_app_admin(array['owner','support_admin']");
    expect(schema).toContain("Owner/admin access required.");
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
    expect(todaysFollowUpsCard).toContain("MarkContactedConfirmForm");
  });

  test("opening suggested WhatsApp validates follow-up and records opening without approval", () => {
    const messagesActions = readFileSync("app/(dashboard)/_actions/messages.ts", "utf8");

    expect(messagesActions).toContain("openSuggestedWhatsappAction");
    expect(messagesActions).toContain(".from(\"follow_ups\")");
    expect(messagesActions).toContain(".eq(\"purpose\", \"suggested_whatsapp\")");
    expect(messagesActions).toContain("createWhatsappLink");
    expect(messagesActions).toContain("opened_at: now");
    expect(messagesActions).not.toContain("approved_at: now");
    expect(messagesActions).toContain("Add%20a%20valid%20WhatsApp%20number");
  });

  test("mark contacted action validates open follow-up before updating contact", () => {
    const contactsActions = readFileSync("app/(dashboard)/_actions/contacts.ts", "utf8");
    expect(contactsActions).toContain("markFollowUpContactedAction");
    expect(contactsActions).toContain("Open%20follow-up%20task%20not%20found");
    expect(contactsActions).toContain("status: \"contacted\"");
    expect(contactsActions).toContain("completed_at: now");
  });

  test("follow-up WhatsApp buttons do not present opening WhatsApp as approval", () => {
    const queueList = readFileSync("components/app/follow-ups-queue-list.tsx", "utf8");
    const todaysCard = readFileSync("components/app/todays-follow-ups-card.tsx", "utf8");

    expect(queueList).not.toContain("Approve & open WhatsApp");
    expect(todaysCard).not.toContain("Approve & open WhatsApp");
    expect(queueList).toContain("Open WhatsApp");
    expect(todaysCard).toContain("Open WhatsApp");
  });

  test("mark contacted requires explicit confirmation in the UI", () => {
    const confirmForm = readFileSync("components/app/mark-contacted-confirm-form.tsx", "utf8");

    expect(confirmForm).toContain("window.confirm");
    expect(confirmForm).toContain("Only continue if you actually contacted");
    expect(confirmForm).toContain("markFollowUpContactedAction");
  });

  test("WhatsApp phone helper rejects invalid numbers", () => {
    expect(normalizeWhatsappPhone("abc")).toBeNull();
    expect(normalizeWhatsappPhone("123")).toBeNull();
    expect(createWhatsappLink("abc", "Hello")).toBeNull();
  });

  test("WhatsApp phone helper normalizes South African local numbers", () => {
    expect(normalizeWhatsappPhone("082 000 0000")).toBe("27820000000");
    expect(createWhatsappLink("082 000 0000", "Hello")).toContain("https://wa.me/27820000000");
  });

  test("WhatsApp link helper supports blank chats", () => {
    expect(createWhatsappLink("082 000 0000")).toBe("https://wa.me/27820000000");
  });

  test("follow-up queue allows opening WhatsApp without a generated message", () => {
    const queueList = readFileSync("components/app/follow-ups-queue-list.tsx", "utf8");
    const messagesActions = readFileSync("app/(dashboard)/_actions/messages.ts", "utf8");

    expect(queueList).not.toContain("disabled={!item.suggested_message");
    expect(queueList).toContain("disabled={item.contact.do_not_contact}");
    expect(messagesActions).toContain("messageId: formData.get(\"messageId\") || undefined");
    expect(messagesActions).toContain("messageText = \"\"");
  });

  test("mark contacted returns to the calling queue instead of dashboard", () => {
    const contactsActions = readFileSync("app/(dashboard)/_actions/contacts.ts", "utf8");
    const confirmForm = readFileSync("components/app/mark-contacted-confirm-form.tsx", "utf8");

    expect(contactsActions).toContain("returnTo");
    expect(contactsActions).toContain("redirect(returnTo)");
    expect(contactsActions).not.toContain("redirect(\"/dashboard\")");
    expect(confirmForm).toContain('name="returnTo"');
  });

  test("conversation ongoing sets waiting without completing the follow-up", () => {
    const contactsActions = readFileSync("app/(dashboard)/_actions/contacts.ts", "utf8");
    const queueList = readFileSync("components/app/follow-ups-queue-list.tsx", "utf8");

    expect(contactsActions).toContain("markFollowUpWaitingAction");
    expect(contactsActions).toContain("status: \"waiting\"");
    expect(contactsActions).not.toMatch(/markFollowUpWaitingAction[\s\S]*completed_at: now/);
    expect(queueList).toContain("ConversationOngoingConfirmForm");
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

  test("contacts export uses collect-first approach, event report export uses streaming", () => {
    const contactsExport = readFileSync("app/(dashboard)/contacts/export/route.ts", "utf8");
    const eventExport = readFileSync("app/(dashboard)/events/[id]/report/export/route.ts", "utf8");
    const csv = readFileSync("lib/csv.ts", "utf8");
    expect(csv).toContain("streamCsvResponse");
    expect(csv).toContain("ReadableStream");
    expect(contactsExport).toContain("csvResponse");
    expect(contactsExport).toContain("toCsv");
    expect(contactsExport).toContain("collectContactRows");
    expect(contactsExport).not.toContain("streamCsvResponse");
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

  test("profile and settings schema supports user phone and preferences", () => {
    expect(schema).toContain("add column if not exists phone text");
    expect(schema).toContain("add column if not exists preferences jsonb not null default '{}'::jsonb");
    expect(schema).toContain("Users can update own profile");
  });

  test("profile page updates only the logged-in user's profile", () => {
    const profilePage = readFileSync("app/(dashboard)/profile/page.tsx", "utf8");
    const profileActions = readFileSync("app/(dashboard)/_actions/profile.ts", "utf8");
    expect(profilePage).toContain("updateProfileAction");
    expect(profilePage).toContain("readOnly");
    expect(profileActions).toContain(".eq(\"id\", context.userId)");
    expect(profileActions).toContain("profiles");
    expect(profileActions).toContain("team_members");
  });

  test("settings page stores only operational profile preferences", () => {
    const settingsPage = readFileSync("app/(dashboard)/settings/page.tsx", "utf8");
    const profileActions = readFileSync("app/(dashboard)/_actions/profile.ts", "utf8");

    expect(settingsPage).toContain("updateAccountSettingsAction");
    expect(settingsPage).toContain("normalizeAccountPreferences");
    expect(settingsPage).not.toContain('name="emailNotifications"');
    expect(settingsPage).not.toContain('name="whatsappReminders"');
    expect(profileActions).toContain("defaultDashboardView");
    expect(profileActions).toContain("compactLists");
    expect(profileActions).not.toContain("emailNotifications: z.boolean()");
    expect(profileActions).not.toContain("whatsappReminders: z.boolean()");
  });

  test("dashboard navigation exposes profile and settings pages", () => {
    const layout = readFileSync("app/(dashboard)/layout.tsx", "utf8");
    expect(layout).toContain("/profile");
    expect(layout).toContain("/settings");
  });

  test("schema allows non-leaders to update own linked team profile with narrow constraints", () => {
    expect(schema).toContain('drop policy if exists "Users can update own linked team profile" on public.team_members');
    expect(schema).toContain('create policy "Users can update own linked team profile"');
    expect(schema).toContain("church_memberships.user_id = auth.uid()");
    expect(schema).toContain("church_memberships.status = 'active'");
    expect(schema).toContain("church_memberships.church_id = team_members.church_id");
    expect(schema).toContain("team_members.role = church_memberships.role");
    expect(schema).toContain("team_members.email is not distinct from profiles.email");
    expect(schema).toContain("team_members.is_active = true");
  });

  test("profile action surfaces team sync failures instead of silent success", () => {
    const profileActions = readFileSync("app/(dashboard)/_actions/profile.ts", "utf8");
    expect(profileActions).toContain("error: teamError");
    expect(profileActions).toContain("Profile saved, but team sync failed");
    expect(profileActions).toContain("team_members");
  });

  test("login redirects to the saved default working area", () => {
    expect(authActions).toContain("getPreferredDashboardPathForUser");
    expect(authActions).toContain("data.user?.id");
    expect(authActions).toContain("redirect(await getPreferredDashboardPathForUser");
  });

  test("preference helper constrains dashboard routes and defaults safely", () => {
    const dataProfile = readFileSync("lib/data-profile.ts", "utf8");

    expect(dataProfile).toContain("defaultDashboardViewOptions");
    expect(dataProfile).toContain("dashboardViewRoutes");
    expect(dataProfile).toContain("normalizeAccountPreferences");
    expect(dataProfile).toContain('return "/dashboard"');
    expect(dataProfile).toContain('"follow-ups": "/follow-ups"');
  });

  test("compact list preference is passed into contacts and follow-up lists", () => {
    const contactsPage = readFileSync("app/(dashboard)/contacts/page.tsx", "utf8");
    const followUpsPage = readFileSync("app/(dashboard)/follow-ups/page.tsx", "utf8");
    const contactList = readFileSync("components/app/contact-list.tsx", "utf8");
    const followUpsList = readFileSync("components/app/follow-ups-queue-list.tsx", "utf8");

    expect(contactsPage).toContain("getUserAccountPreferences");
    expect(contactsPage).toContain("compactLists={preferences.compactLists}");
    expect(followUpsPage).toContain("getUserAccountPreferences");
    expect(followUpsPage).toContain("compactLists={preferences.compactLists}");
    expect(contactList).toContain("compactLists = false");
    expect(followUpsList).toContain("compactLists = false");
  });
});
