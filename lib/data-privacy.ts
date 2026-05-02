import { createClient } from "@/lib/supabase/server";

export type DataRequest = {
  id: string;
  church_id: string;
  related_contact_id: string | null;
  request_type: "correction" | "deletion" | "export" | "restriction";
  requester_name: string;
  requester_contact: string | null;
  status: "open" | "in_review" | "completed" | "declined";
  notes: string | null;
  created_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getDataRequests(churchId: string): Promise<DataRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("data_requests")
    .select("*")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DataRequest[];
}

export async function getOpenDataRequestCount(churchId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("data_requests")
    .select("id", { count: "exact", head: true })
    .eq("church_id", churchId)
    .eq("status", "open");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
