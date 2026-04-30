import { adminClient, readArgs, runId } from "./common.mjs";

const args = readArgs();
const targetRunId = args.get("runId") || process.env.SCALE_RUN_ID || runId;
const churchId = args.get("churchId") || process.env.SCALE_TEST_CHURCH_ID;
if (!targetRunId.startsWith("scale-")) {
  throw new Error("Refusing cleanup without a scale-* run id.");
}

const supabase = adminClient();

let contactsQuery = supabase
  .from("contacts")
  .delete()
  .eq("classification_payload->>scale_run_id", targetRunId);
if (churchId) {
  contactsQuery = contactsQuery.eq("church_id", churchId);
}
const { error: contactsError } = await contactsQuery;
if (contactsError) {
  throw new Error(contactsError.message);
}

let eventQuery = supabase
  .from("events")
  .delete()
  .like("slug", `${targetRunId}-%`);
if (churchId) {
  eventQuery = eventQuery.eq("church_id", churchId);
}
const { error: eventsError } = await eventQuery;
if (eventsError) {
  throw new Error(eventsError.message);
}

let teamQuery = supabase
  .from("team_members")
  .delete()
  .like("display_name", `[scale:${targetRunId}]%`);
if (churchId) {
  teamQuery = teamQuery.eq("church_id", churchId);
}
const { error: teamError } = await teamQuery;
if (teamError) {
  throw new Error(teamError.message);
}

const { error: churchError } = await supabase
  .from("churches")
  .delete()
  .eq("name", `[SCALE TEST] ShepherdRoute ${targetRunId}`);
if (churchError) {
  throw new Error(churchError.message);
}

console.log(`Cleaned scale run ${targetRunId}`);
