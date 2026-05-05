import { createClient } from "@/lib/supabase/server";

export async function getAuditLogs(churchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, target_type, target_id, metadata, created_at, actor_user_id")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}
