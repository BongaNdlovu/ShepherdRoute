'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  sanitizeEventPermissions,
  type EventAssignmentPermissions,
} from '@/lib/event-permission-presets';
import { requireEventPermission } from '@/lib/data-event-assignments';
import type { AppAdminRole } from '@/lib/permissions';
import type { TeamRole } from '@/lib/constants';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createInviteToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getCurrentUserContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be signed in.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Could not load your profile.');
  }

  return {
    supabase,
    user,
    profile,
  };
}

async function getEventChurchId(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('id, church_id')
    .eq('id', eventId)
    .single();

  if (error || !data) {
    throw new Error('Event not found.');
  }

  return data.church_id as string;
}

async function getCurrentTeamRoleForChurch(params: {
  userId: string;
  churchId: string;
}) {
  const supabase = await createClient();

  // Get membership first
  const { data: membership, error: membershipError } = await supabase
    .from('church_memberships')
    .select('id')
    .eq('user_id', params.userId)
    .eq('church_id', params.churchId)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  // Then get team_member using membership_id
  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('membership_id', membership.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load team role: ${error.message}`);
  }

  return data?.role ?? null;
}

async function getAppAdminRole(userId: string): Promise<AppAdminRole | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('app_admins')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load app admin role: ${error.message}`);
  }

  return (data?.role as AppAdminRole) ?? null;
}

async function requireCanManageEventTeam(params: {
  userId: string;
  eventId: string;
}) {
  const churchId = await getEventChurchId(params.eventId);
  const teamRole = await getCurrentTeamRoleForChurch({
    userId: params.userId,
    churchId,
  });
  const appRole = await getAppAdminRole(params.userId);

  await requireEventPermission({
    userId: params.userId,
    eventId: params.eventId,
    appRole: appRole,
    teamRole: teamRole ?? 'viewer',
    permission: 'can_manage_event_team',
  });

  return { churchId, teamRole, appRole };
}

export async function assignTeamMemberToEvent(input: {
  eventId: string;
  teamMemberId: string;
  permissions: Partial<EventAssignmentPermissions>;
}) {
  const { supabase, user } = await getCurrentUserContext();
  const { churchId } = await requireCanManageEventTeam({
    userId: user.id,
    eventId: input.eventId,
  });

  const permissions = sanitizeEventPermissions(input.permissions);

  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .select('id, church_id')
    .eq('id', input.teamMemberId)
    .single();

  if (memberError || !member) {
    throw new Error('Team member not found.');
  }

  if (member.church_id !== churchId) {
    throw new Error('This team member does not belong to the event church.');
  }

  const { error } = await supabase.from('event_assignments').upsert(
    {
      church_id: churchId,
      event_id: input.eventId,
      team_member_id: input.teamMemberId,
      invitee_email: null,
      invitation_token_hash: null,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      revoked_at: null,
      revoked_by: null,
      invited_by: user.id,
      ...permissions,
    },
    {
      onConflict: 'church_id,event_id,team_member_id',
    }
  );

  if (error) {
    throw new Error(`Failed to assign team member: ${error.message}`);
  }

  revalidatePath(`/events/${input.eventId}/team`);

  return { ok: true };
}

export async function inviteToEventByEmail(input: {
  eventId: string;
  email: string;
  permissions: Partial<EventAssignmentPermissions>;
}) {
  const { supabase, user } = await getCurrentUserContext();
  const { churchId } = await requireCanManageEventTeam({
    userId: user.id,
    eventId: input.eventId,
  });

  const email = normalizeEmail(input.email);

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const rawToken = createInviteToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const permissions = sanitizeEventPermissions(input.permissions);

  const { error } = await supabase.from('event_assignments').upsert(
    {
      church_id: churchId,
      event_id: input.eventId,
      team_member_id: null,
      invitee_email: email,
      invitation_token_hash: tokenHash,
      status: 'pending',
      invitation_expires_at: expiresAt,
      invited_by: user.id,
      accepted_at: null,
      revoked_at: null,
      revoked_by: null,
      ...permissions,
    },
    {
      onConflict: 'church_id,event_id,invitee_email',
    }
  );

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  // TODO: Connect the project's existing email provider here.
  // Send invite URL: `${process.env.NEXT_PUBLIC_APP_URL}/event-invitations/accept?token=${rawToken}`
  // Never store rawToken in the database.

  revalidatePath(`/events/${input.eventId}/team`);

  return { ok: true };
}

export async function updateEventAssignmentPermissions(input: {
  assignmentId: string;
  eventId: string;
  permissions: Partial<EventAssignmentPermissions>;
}) {
  const { supabase, user } = await getCurrentUserContext();

  await requireCanManageEventTeam({
    userId: user.id,
    eventId: input.eventId,
  });

  const permissions = sanitizeEventPermissions(input.permissions);

  const { error } = await supabase
    .from('event_assignments')
    .update(permissions)
    .eq('id', input.assignmentId)
    .eq('event_id', input.eventId);

  if (error) {
    throw new Error(`Failed to update permissions: ${error.message}`);
  }

  revalidatePath(`/events/${input.eventId}/team`);

  return { ok: true };
}

export async function revokeEventAssignment(input: {
  assignmentId: string;
  eventId: string;
}) {
  const { supabase, user } = await getCurrentUserContext();

  await requireCanManageEventTeam({
    userId: user.id,
    eventId: input.eventId,
  });

  const { error } = await supabase
    .from('event_assignments')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
    })
    .eq('id', input.assignmentId)
    .eq('event_id', input.eventId);

  if (error) {
    throw new Error(`Failed to revoke assignment: ${error.message}`);
  }

  revalidatePath(`/events/${input.eventId}/team`);

  return { ok: true };
}

export async function acceptEventInvitation(input: {
  token: string;
}) {
  const { supabase, user } = await getCurrentUserContext();

  const tokenHash = hashToken(input.token);

  const { data: assignment, error } = await supabase
    .from('event_assignments')
    .select('*')
    .eq('invitation_token_hash', tokenHash)
    .eq('status', 'pending')
    .maybeSingle();

  if (error || !assignment) {
    throw new Error('Invitation not found or already used.');
  }

  if (assignment.revoked_at) {
    throw new Error('This invitation has been revoked.');
  }

  if (assignment.invitation_expires_at && new Date(assignment.invitation_expires_at).getTime() < Date.now()) {
    await supabase
      .from('event_assignments')
      .update({ status: 'expired' })
      .eq('id', assignment.id);

    throw new Error('This invitation has expired.');
  }

  const userEmail = normalizeEmail(user.email ?? '');

  if (!assignment.invitee_email || normalizeEmail(assignment.invitee_email) !== userEmail) {
    throw new Error('This invitation was sent to a different email address.');
  }

  const { data: existingMember, error: memberError } = await supabase
    .from('church_memberships')
    .select('id, church_id')
    .eq('user_id', user.id)
    .eq('church_id', assignment.church_id)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Could not check church membership: ${memberError.message}`);
  }

  if (!existingMember) {
    throw new Error('Your account is not yet a member of this church. Ask an admin to add you to the church team first.');
  }

  const { data: teamMember, error: teamMemberError } = await supabase
    .from('team_members')
    .select('id')
    .eq('membership_id', existingMember.id)
    .maybeSingle();

  if (!teamMember) {
    throw new Error('No team member record found. Ask an admin to create a team member record for you.');
  }

  const { error: updateError } = await supabase
    .from('event_assignments')
    .update({
      team_member_id: teamMember.id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      invitation_token_hash: null,
    })
    .eq('id', assignment.id);

  if (updateError) {
    throw new Error(`Failed to accept invitation: ${updateError.message}`);
  }

  revalidatePath(`/events/${assignment.event_id}/team`);

  return { ok: true, eventId: assignment.event_id };
}
