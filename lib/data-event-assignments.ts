import { createClient } from '@/lib/supabase/server';
import {
  type EventAssignmentPermissions,
  type EventPermissionKey,
} from '@/lib/event-permission-presets';
import {
  resolveEventPermissions,
  hasResolvedEventPermission,
  type AppAdminRole,
} from '@/lib/permissions';
import { roleOptions, type TeamRole } from '@/lib/constants';

export type EventAssignmentRow = {
  id: string;
  church_id: string;
  event_id: string;
  team_member_id: string | null;
  invitee_email: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invitation_expires_at: string | null;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  can_view_contacts: boolean;
  can_assign_contacts: boolean;
  can_view_reports: boolean;
  can_export_reports: boolean;
  can_edit_event_settings: boolean;
  can_manage_event_team: boolean;
  can_view_prayer_requests: boolean;
  can_delete_event: boolean;
};

const APP_ADMIN_ROLES = ['owner', 'support_admin', 'billing_admin'] as const satisfies readonly AppAdminRole[];

function toAppAdminRole(role: unknown): AppAdminRole | null {
  return typeof role === 'string' && (APP_ADMIN_ROLES as readonly string[]).includes(role)
    ? (role as AppAdminRole)
    : null;
}

function toTeamRole(role: unknown): TeamRole {
  return typeof role === 'string' && (roleOptions as readonly string[]).includes(role)
    ? (role as TeamRole)
    : 'viewer';
}

export function assignmentIsActive(row: Pick<EventAssignmentRow, 'status' | 'revoked_at' | 'invitation_expires_at'>): boolean {
  if (row.status !== 'accepted') return false;
  if (row.revoked_at) return false;

  if (row.invitation_expires_at) {
    const expiresAt = new Date(row.invitation_expires_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) return false;
  }

  return true;
}

export function permissionsFromAssignment(row: EventAssignmentRow): EventAssignmentPermissions {
  return {
    can_view_contacts: row.can_view_contacts,
    can_assign_contacts: row.can_assign_contacts,
    can_view_reports: row.can_view_reports,
    can_export_reports: row.can_export_reports,
    can_edit_event_settings: row.can_edit_event_settings,
    can_manage_event_team: row.can_manage_event_team,
    can_view_prayer_requests: row.can_view_prayer_requests,
    can_delete_event: row.can_delete_event,
  };
}

export async function getEventAssignments(
  churchId: string,
  eventId: string
): Promise<EventAssignmentRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_assignments')
    .select('*')
    .eq('church_id', churchId)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load event assignments: ${error.message}`);
  }

  return data ?? [];
}

export async function getCurrentUserEventAssignment(params: {
  userId: string;
  eventId: string;
}): Promise<EventAssignmentRow | null> {
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('church_id')
    .eq('id', params.eventId)
    .single();

  if (eventError || !event) {
    throw new Error(`Failed to load event: ${eventError?.message ?? 'Event not found.'}`);
  }

  const { data: membership, error: membershipError } = await supabase
    .from('church_memberships')
    .select('id')
    .eq('user_id', params.userId)
    .eq('church_id', event.church_id)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Failed to load membership: ${membershipError.message}`);
  }

  if (!membership?.id) return null;

  const { data: teamMember, error: teamMemberError } = await supabase
    .from('team_members')
    .select('id')
    .eq('membership_id', membership.id)
    .eq('church_id', event.church_id)
    .eq('is_active', true)
    .maybeSingle();

  if (teamMemberError) {
    throw new Error(`Failed to load team member: ${teamMemberError.message}`);
  }

  if (!teamMember?.id) return null;

  const { data, error } = await supabase
    .from('event_assignments')
    .select('*')
    .eq('event_id', params.eventId)
    .eq('team_member_id', teamMember.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load event assignment: ${error.message}`);
  }

  return data ?? null;
}

export async function getResolvedEventPermissions(params: {
  userId: string;
  eventId: string;
  appRole: AppAdminRole | null;
  teamRole: TeamRole;
}) {
  const assignment = await getCurrentUserEventAssignment({
    userId: params.userId,
    eventId: params.eventId,
  });

  return resolveEventPermissions({
    appRole: params.appRole,
    teamRole: params.teamRole,
    eventAssignmentPermissions: assignment ? permissionsFromAssignment(assignment) : null,
    assignmentIsActive: assignment ? assignmentIsActive(assignment) : false,
  });
}

export async function requireEventPermission(params: {
  userId: string;
  eventId: string;
  appRole: AppAdminRole | null;
  teamRole: TeamRole;
  permission: EventPermissionKey;
}) {
  const permissions = await getResolvedEventPermissions({
    userId: params.userId,
    eventId: params.eventId,
    appRole: params.appRole,
    teamRole: params.teamRole,
  });

  if (!hasResolvedEventPermission({ permissions, permission: params.permission })) {
    throw new Error('You do not have permission to perform this event action.');
  }

  return permissions;
}

export async function requireCurrentUserEventPermission(params: {
  churchId: string;
  eventId: string;
  permission: EventPermissionKey;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be signed in.');
  }

  const { data: appAdmin } = await supabase
    .from('app_admins')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from('church_memberships')
    .select('id, role')
    .eq('user_id', user.id)
    .eq('church_id', params.churchId)
    .eq('status', 'active')
    .maybeSingle();

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('membership_id', membership?.id)
    .maybeSingle();

  return requireEventPermission({
    userId: user.id,
    eventId: params.eventId,
    appRole: toAppAdminRole(appAdmin?.role),
    teamRole: toTeamRole(teamMember?.role),
    permission: params.permission,
  });
}
