import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceType = "church" | "ministry";
export type WorkspaceStatus = "active" | "inactive";

export type ChurchMembershipOption = {
  churchId: string;
  churchName: string;
  role: string;
  workspaceType: WorkspaceType;
  workspaceStatus: WorkspaceStatus;
};

export type ChurchContext = {
  userId: string;
  churchId: string;
  churchName: string;
  workspaceType: WorkspaceType;
  workspaceStatus: WorkspaceStatus;
  workspaceLabel: string;
  fullName: string;
  role: string;
  memberships: ChurchMembershipOption[];
  isAppAdmin: boolean;
  appAdminRole: string | null;
  isProtectedOwner: boolean;
};

export const getChurchContext = cache(async function getChurchContext(): Promise<ChurchContext> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const selectedChurchId = cookieStore.get("selected_church_id")?.value;

  const [{ data: profile }, { data: memberships, error }, { data: appAdmin }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("church_memberships")
      .select("church_id, role, churches(name, workspace_type, workspace_status)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    supabase
      .from("app_admins")
      .select("user_id, role, is_protected_owner")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (error || !memberships?.length || !profile) {
    redirect("/login?error=Your%20church%20profile%20is%20not%20ready%20yet.");
  }

  const selectedMembership = memberships.find((membership) => membership.church_id === selectedChurchId) ?? memberships[0];
  const selectedChurch = Array.isArray(selectedMembership.churches) ? selectedMembership.churches[0] : selectedMembership.churches;
  const selectedWorkspaceType = (selectedChurch?.workspace_type === "ministry" ? "ministry" : "church") as WorkspaceType;
  const selectedWorkspaceStatus = (selectedChurch?.workspace_status === "inactive" ? "inactive" : "active") as WorkspaceStatus;
  const selectedWorkspaceLabel = selectedWorkspaceType === "ministry" ? "Ministry" : "Church";

  const membershipOptions = memberships.map((membership) => {
    const church = Array.isArray(membership.churches) ? membership.churches[0] : membership.churches;

    return {
      churchId: membership.church_id,
      churchName: church?.name ?? "Your church",
      role: membership.role,
      workspaceType: (church?.workspace_type === "ministry" ? "ministry" : "church") as WorkspaceType,
      workspaceStatus: (church?.workspace_status === "inactive" ? "inactive" : "active") as WorkspaceStatus
    };
  });

  return {
    userId: user.id,
    churchId: selectedMembership.church_id,
    churchName: selectedChurch?.name ?? "Your church",
    workspaceType: selectedWorkspaceType,
    workspaceStatus: selectedWorkspaceStatus,
    workspaceLabel: selectedWorkspaceLabel,
    fullName: profile.full_name ?? user.email ?? "Team member",
    role: selectedMembership.role,
    memberships: membershipOptions,
    isAppAdmin: Boolean(appAdmin),
    appAdminRole: appAdmin?.role ?? null,
    isProtectedOwner: appAdmin?.is_protected_owner ?? false
  };
});
