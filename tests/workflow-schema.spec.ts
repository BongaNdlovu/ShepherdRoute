import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { defaultDueDate } from "@/lib/followUp";
import { generateMessage } from "@/lib/whatsapp";

const schema = readFileSync("supabase/schema.sql", "utf8");
const dashboardPage = readFileSync("app/(dashboard)/dashboard/page.tsx", "utf8");
const eventsPage = readFileSync("app/(dashboard)/events/page.tsx", "utf8");
const eventDetailPage = readFileSync("app/(dashboard)/events/[id]/page.tsx", "utf8");
const eventActions = readFileSync("app/(dashboard)/_actions/events.ts", "utf8");
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
});

test.describe("workflow helpers", () => {
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
});
