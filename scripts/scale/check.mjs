import { adminClient, readArgs } from "./common.mjs";

const args = readArgs();
const churchId = args.get("churchId") || process.env.SCALE_TEST_CHURCH_ID;
if (!churchId) {
  throw new Error("Set SCALE_TEST_CHURCH_ID or pass --churchId=<uuid>.");
}

const supabase = adminClient();

async function time(label, fn) {
  const started = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - started);
  console.log(`${label}: ${ms}ms`);
  return result;
}

await time("outreach_report_summary", async () => supabase.rpc("outreach_report_summary", { p_church_id: churchId }));
await time("contacts page 1", async () => supabase.rpc("search_contacts", { p_church_id: churchId, p_limit: 25, p_offset: 0 }));
await time("contacts page 100", async () => supabase.rpc("search_contacts", { p_church_id: churchId, p_limit: 25, p_offset: 2475 }));
await time("follow-up queue page 1", async () => supabase.rpc("search_follow_ups", { p_church_id: churchId, p_due_state: "open_due", p_limit: 25, p_offset: 0 }));
await time("follow-up queue page 100", async () => supabase.rpc("search_follow_ups", { p_church_id: churchId, p_due_state: "all", p_limit: 25, p_offset: 2475 }));

if (process.env.SCALE_APP_BASE_URL && process.env.SCALE_AUTH_COOKIE) {
  await time("contacts export response startup", async () => {
    const response = await fetch(`${process.env.SCALE_APP_BASE_URL}/contacts/export`, {
      headers: { cookie: process.env.SCALE_AUTH_COOKIE }
    });
    if (!response.ok || !response.body) {
      throw new Error(`Export failed: ${response.status}`);
    }
    await response.body.getReader().read();
  });
} else {
  console.log("Skipped HTTP export startup check. Set SCALE_APP_BASE_URL and SCALE_AUTH_COOKIE to include it.");
}
