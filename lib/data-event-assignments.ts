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
import type { TeamRole } from '@/lib/constants';

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

export async function getEventAssignments(eventId: string): Promise<EventAssignmentRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_assignments')
    .select('*')
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

  // Get membership_id from church_memberships
  const { data: membership, error: membershipError } = await supabase
    .from('church_memberships')
    .select('id')
    .eq('user_id', params.userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Failed to load membership: ${membershipError.message}`);
  }

  if (!membership?.id) return null;

  const { data, error } = await supabase
    .from('event_assignments')
    .select('*')
    .eq('event_id', params.eventId)
    .eq('team_member_id', membership.id)
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
