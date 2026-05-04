import { redirect } from "next/navigation";
import { canManageEvents } from "@/lib/permissions";
import type { AppRole, TeamRole } from "@/lib/constants";
import type { getChurchContext } from "@/lib/data";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireEventManager(context: Awaited<ReturnType<typeof getChurchContext>>, supabase: SupabaseClient, fallbackPath = "/events") {
  if (!canManageEvents(context.role as TeamRole, context.appRole as AppRole | null)) {
    redirect(`${fallbackPath}?error=You%20do%20not%20have%20permission%20to%20manage%20events.`);
  }
}
