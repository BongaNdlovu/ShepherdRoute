import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const defaultDashboardViewOptions = ["dashboard", "follow-ups", "contacts", "reports"] as const;

export type DefaultDashboardView = (typeof defaultDashboardViewOptions)[number];

export type AccountPreferences = {
  defaultDashboardView: DefaultDashboardView;
  compactLists: boolean;
};

export const dashboardViewRoutes: Record<DefaultDashboardView, string> = {
  dashboard: "/dashboard",
  "follow-ups": "/follow-ups",
  contacts: "/contacts",
  reports: "/reports"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeAccountPreferences(preferences: Json | null | undefined): AccountPreferences {
  const value = isRecord(preferences) ? preferences : {};
  const defaultDashboardView = defaultDashboardViewOptions.includes(value.defaultDashboardView as DefaultDashboardView)
    ? (value.defaultDashboardView as DefaultDashboardView)
    : "dashboard";

  return {
    defaultDashboardView,
    compactLists: value.compactLists === true
  };
}

export async function getUserAccountPreferences(userId: string): Promise<AccountPreferences> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  return normalizeAccountPreferences(data?.preferences);
}

export async function getPreferredDashboardPathForUser(userId: string | null | undefined): Promise<string> {
  if (!userId) return "/dashboard";

  const preferences = await getUserAccountPreferences(userId);
  return dashboardViewRoutes[preferences.defaultDashboardView] ?? "/dashboard";
}

export type UserProfileSettings = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  preferences: Json;
  memberships: Array<{
    id: string;
    church_id: string;
    church_name: string;
    role: string;
    status: string;
    team_member_id: string | null;
    team_display_name: string | null;
    team_phone: string | null;
    team_email: string | null;
  }>;
};

export async function getUserProfileSettings(userId: string): Promise<UserProfileSettings | null> {
  const supabase = await createClient();

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, preferences")
      .eq("id", userId)
      .single(),
    supabase
      .from("church_memberships")
      .select("id, church_id, role, status, churches(name), team_members(id, display_name, phone, email)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
  ]);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    preferences: profile.preferences,
    memberships: (memberships ?? []).map((membership) => {
      const church = Array.isArray(membership.churches) ? membership.churches[0] : membership.churches;
      const teamMember = Array.isArray(membership.team_members) ? membership.team_members[0] : membership.team_members;

      return {
        id: membership.id,
        church_id: membership.church_id,
        church_name: church?.name ?? "Your church",
        role: membership.role,
        status: membership.status,
        team_member_id: teamMember?.id ?? null,
        team_display_name: teamMember?.display_name ?? null,
        team_phone: teamMember?.phone ?? null,
        team_email: teamMember?.email ?? null
      };
    })
  };
}
