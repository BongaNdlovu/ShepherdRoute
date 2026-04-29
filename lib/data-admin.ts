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
  app_admin_role: "owner" | "support_admin" | "billing_admin" | null;
  is_protected_owner: boolean;
  event_count: number;
  contact_count: number;
};

export type OwnerInvitationRow = {
  church_id: string;
  church_name: string;
  invitation_id: string;
  team_member_id: string | null;
  display_name: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  invited_by_name: string | null;
  accepted_by_name: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export async function getOwnerChurchSummaries() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_church_summaries");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerChurchSummary[];
}

export async function getOwnerInvitationRows() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_invitation_rows");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerInvitationRow[];
}

export async function getOwnerAccountRows() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_account_rows");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerAccountRow[];
}
