import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { defaultDueDate } from "@/lib/followUp";
import { generateMessage } from "@/lib/whatsapp";

const schema = readFileSync("supabase/schema.sql", "utf8");

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
});

test.describe("workflow helpers", () => {
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
