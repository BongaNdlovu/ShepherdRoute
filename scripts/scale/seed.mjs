import { randomUUID } from "node:crypto";
import { adminClient, allowedCounts, chunk, readArgs, requireSafeEnv, runId, scaleTag } from "./common.mjs";

requireSafeEnv({ allowSeed: true });
const args = readArgs();
const count = Number(args.get("count") || 1000);
if (!allowedCounts.has(count)) {
  throw new Error("--count must be one of 1000, 10000, 50000.");
}

const supabase = adminClient();
const interests = ["prayer", "bible_study", "health", "baptism", "pastoral_visit", "youth", "cooking_class"];
const statuses = ["new", "assigned", "waiting", "interested", "contacted"];
const roles = ["pastor", "elder", "bible_worker", "health_leader", "prayer_team"];

async function insert(table, rows, size = 500) {
  for (const group of chunk(rows, size)) {
    const { error } = await supabase.from(table).insert(group);
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

async function ensureChurch() {
  if (process.env.SCALE_TEST_CHURCH_ID) {
    return process.env.SCALE_TEST_CHURCH_ID;
  }

  const { data, error } = await supabase
    .from("churches")
    .insert({ name: `[SCALE TEST] ShepherdRoute ${runId}` })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

const churchId = await ensureChurch();
const eventId = randomUUID();
const team = roles.map((role, index) => ({
  id: randomUUID(),
  church_id: churchId,
  display_name: `[scale:${runId}] ${role.replace("_", " ")} ${index + 1}`,
  role,
  is_active: true
}));

await insert("team_members", team);
await insert("events", [{
  id: eventId,
  church_id: churchId,
  name: `[scale:${runId}] Outreach`,
  event_type: "custom",
  slug: `${runId}-outreach`,
  description: JSON.stringify(scaleTag()),
  is_active: true
}]);

const contacts = [];
const contactInterests = [];
const followUps = [];
const prayerRequests = [];
const generatedMessages = [];
const now = Date.now();

for (let i = 0; i < count; i += 1) {
  const id = randomUUID();
  const assigned = team[i % team.length];
  const interest = interests[i % interests.length];
  const status = statuses[i % statuses.length];
  const dueAt = new Date(now + ((i % 21) - 10) * 24 * 60 * 60 * 1000).toISOString();
  const phone = `+27 72 ${String(i).padStart(3, "0")} ${String(i % 10000).padStart(4, "0")}`;

  contacts.push({
    id,
    church_id: churchId,
    event_id: eventId,
    full_name: `Scale Contact ${String(i + 1).padStart(5, "0")}`,
    phone,
    email: `scale-${i + 1}@example.test`,
    whatsapp_number: phone,
    area: `Area ${i % 50}`,
    language: i % 3 === 0 ? "Zulu" : "English",
    best_time_to_contact: i % 2 === 0 ? "Evening" : "Morning",
    status,
    urgency: i % 17 === 0 ? "high" : i % 5 === 0 ? "low" : "medium",
    assigned_to: assigned.id,
    consent_given: true,
    consent_at: new Date(now - i * 1000).toISOString(),
    consent_source: "scale_seed",
    consent_scope: ["follow_up", "whatsapp"],
    source: "scale_seed",
    classification_payload: {
      ...scaleTag(),
      recommended_assigned_role: assigned.role,
      recommended_next_action: "Scale test follow-up."
    },
    created_at: new Date(now - i * 1000).toISOString()
  });

  contactInterests.push({ church_id: churchId, contact_id: id, interest });
  if (i % 4 === 0) {
    contactInterests.push({ church_id: churchId, contact_id: id, interest: interests[(i + 2) % interests.length] });
  }

  followUps.push({
    church_id: churchId,
    contact_id: id,
    assigned_to: assigned.id,
    channel: "note",
    status,
    next_action: "Scale test follow-up.",
    due_at: dueAt,
    completed_at: status === "contacted" ? new Date(now - 3600000).toISOString() : null
  });

  if (i % 10 === 0) {
    prayerRequests.push({
      church_id: churchId,
      contact_id: id,
      request_text: `[scale:${runId}] Prayer request ${i + 1}`,
      visibility: "general_prayer"
    });
  }

  generatedMessages.push({
    church_id: churchId,
    contact_id: id,
    channel: "whatsapp",
    message_text: `Good day Scale Contact ${i + 1}, thank you for connecting with us.`,
    wa_link: "https://wa.me/27720000000",
    prompt_version: "scale_seed",
    purpose: "suggested_whatsapp"
  });
}

await insert("contacts", contacts);
await insert("contact_interests", contactInterests);
await insert("follow_ups", followUps);
await insert("prayer_requests", prayerRequests);
await insert("generated_messages", generatedMessages);

console.log(JSON.stringify({ runId, churchId, count }, null, 2));
