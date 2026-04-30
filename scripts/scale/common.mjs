import { createClient } from "@supabase/supabase-js";

export const allowedCounts = new Set([1000, 10000, 50000]);
export const runId = process.env.SCALE_RUN_ID || `scale-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;

export function readArgs() {
  const args = new Map();
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, "").split("=");
    args.set(key, value ?? true);
  }
  return args;
}

export function requireSafeEnv({ allowSeed = false } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  if (allowSeed && process.env.ALLOW_SCALE_SEED !== "true") {
    throw new Error("Set ALLOW_SCALE_SEED=true before seeding scale data.");
  }

  const productionLooking = /prod|production|shepherdroute\.app|vercel\.app/i.test(url);
  if (productionLooking && process.env.ALLOW_PRODUCTION_SCALE_SEED !== "true") {
    throw new Error("Refusing production-looking Supabase URL. Use a disposable test project or set ALLOW_PRODUCTION_SCALE_SEED=true intentionally.");
  }

  return { url, serviceKey };
}

export function adminClient() {
  const { url, serviceKey } = requireSafeEnv();
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function scaleTag(run = runId) {
  return { scale_run_id: run, generated_by: "scale-tooling" };
}
