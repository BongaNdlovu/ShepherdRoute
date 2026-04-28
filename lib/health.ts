import { createClient } from "@/lib/supabase/server";
import type { ChurchContext } from "@/lib/data";

export type HealthStatus = "pass" | "warn" | "fail";

export type HealthCheck = {
  name: string;
  status: HealthStatus;
  detail: string;
  action?: string;
};

function hasUsableAnonKey(value?: string) {
  return Boolean(value && (value.startsWith("eyJ") || value.startsWith("sb_publishable_")));
}

function checkEnv(): HealthCheck[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return [
    {
      name: "Supabase project URL",
      status: supabaseUrl?.startsWith("https://") ? "pass" : "fail",
      detail: supabaseUrl ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_URL",
      action: "Set NEXT_PUBLIC_SUPABASE_URL in Vercel and local .env.local."
    },
    {
      name: "Supabase anon key",
      status: hasUsableAnonKey(anonKey) ? "pass" : "fail",
      detail: anonKey ? "Configured with a publishable/anon-shaped key" : "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY",
      action: "Use the Supabase publishable key or legacy anon key, never the service role key."
    },
    {
      name: "Production site URL",
      status: siteUrl?.startsWith("https://") || siteUrl?.startsWith("http://localhost") ? "pass" : "warn",
      detail: siteUrl ? siteUrl : "Missing NEXT_PUBLIC_SITE_URL",
      action: "Set NEXT_PUBLIC_SITE_URL to the Vercel production domain."
    }
  ];
}

async function safeCheck(name: string, action: () => Promise<{ error: unknown }>, failureAction: string): Promise<HealthCheck> {
  try {
    const result = await action();
    const error = result.error as { message?: string } | null;

    if (error) {
      return {
        name,
        status: "fail",
        detail: error.message ?? "Request failed",
        action: failureAction
      };
    }

    return {
      name,
      status: "pass",
      detail: "Healthy"
    };
  } catch (error) {
    return {
      name,
      status: "fail",
      detail: error instanceof Error ? error.message : "Request failed",
      action: failureAction
    };
  }
}

export async function getHealthChecks(context: ChurchContext): Promise<HealthCheck[]> {
  const supabase = await createClient();
  const envChecks = checkEnv();

  const [
    authCheck,
    membershipCheck,
    contactsRpcCheck,
    publicEventsCheck
  ] = await Promise.all([
    safeCheck(
      "Supabase Auth session",
      async () => {
        const { error } = await supabase.auth.getUser();
        return { error };
      },
      "Confirm Supabase Auth URL settings and environment variables."
    ),
    safeCheck(
      "Church profile data",
      async () => {
        const { error } = await supabase
          .from("church_memberships")
          .select("id")
          .eq("church_id", context.churchId)
          .eq("user_id", context.userId)
          .limit(1)
          .single();
        return { error };
      },
      "Create or repair the user's profile, church membership, and team member rows."
    ),
    safeCheck(
      "Contacts search RPC",
      async () => {
        const { error } = await supabase.rpc("search_contacts", {
          p_church_id: context.churchId,
          p_q: null,
          p_status: null,
          p_event_id: null,
          p_interest: null,
          p_assigned_to: null,
          p_unassigned: false,
          p_limit: 1,
          p_offset: 0
        });
        return { error };
      },
      "Run the latest supabase/schema.sql so search_contacts exists."
    ),
    safeCheck(
      "Public event view",
      async () => {
        const { error } = await supabase.from("public_events").select("id").limit(1);
        return { error };
      },
      "Run the latest supabase/schema.sql so public_events exists with security_invoker."
    )
  ]);

  return [...envChecks, authCheck, membershipCheck, contactsRpcCheck, publicEventsCheck];
}
