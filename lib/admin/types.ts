export type OwnerAdminOverview = {
  churchCount: number;
  ministryCount: number;
  activeAccountCount: number;
  disabledAccountCount: number;
  pendingInvitationCount: number;
  teamMemberCount: number;
  eventCount: number;
  contactCount: number;
};

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

export type OwnerPaginationParams = {
  q?: string;
  page?: string;
  pageSize?: string;
};

export type OwnerWorkspaceType = 'church' | 'ministry';

export type OwnerPaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type OwnerChurchListItem = {
  church_id: string;
  church_name: string;
  created_at: string;
  team_count: number;
  profile_count: number;
  event_count: number;
  contact_count: number;
  new_contact_count: number;
  workspace_type: "church" | "ministry";
  workspace_status: "active" | "inactive";
  status_changed_at: string | null;
  status_change_reason: string | null;
};

export type OwnerChurchDetail = {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  team_count: number;
  profile_count: number;
  event_count: number;
  contact_count: number;
  new_contact_count: number;
  workspace_type: "church" | "ministry";
  workspace_status: "active" | "inactive";
  status_changed_at: string | null;
  status_change_reason: string | null;
};

export type OwnerChurchTeamRow = {
  id: string;
  display_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  membership_id: string | null;
  created_at: string;
};

export type OwnerChurchProfileRow = {
  membership_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: "active" | "invited" | "disabled";
  membership_created_at: string;
  app_admin_role: "owner" | "support_admin" | "billing_admin" | null;
  is_protected_owner: boolean;
};

export type OwnerChurchEventRow = {
  id: string;
  name: string;
  event_type: string;
  starts_on: string | null;
  location: string | null;
  slug: string;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  contact_count: number;
};

export type OwnerChurchContactRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  area: string | null;
  status: string;
  urgency: "low" | "medium" | "high";
  event_id: string | null;
  event_name: string | null;
  assigned_name: string | null;
  created_at: string;
};
