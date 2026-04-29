import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OwnerChurchSummary = {
  church_id: string;
  church_name: string;
  created_at: string;
  team_count: number;
  event_count: number;
  contact_count: number;
  new_contact_count: number;
};

export type OwnerAccountRow = {
  church_id: string;
  church_name: string;
  church_created_at: string;
  membership_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: "active" | "invited" | "disabled";
  membership_created_at: string;
  team_member_id: string | null;
  team_member_name: string | null;
  team_member_active: boolean;
  event_count: number;
  contact_count: number;
};

export async function getOwnerChurchSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_church_summaries");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerChurchSummary[];
}

export async function getOwnerAccountRows() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_account_rows");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerAccountRow[];
}
