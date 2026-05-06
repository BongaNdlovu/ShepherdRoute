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
import { gmailComposeUrl, mailtoUrl, eventInviteTemplate } from '@/lib/invite-email';
import { friendlyInviteError } from '@/lib/app-errors';

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

  // Then get team_member using membership_id and church_id
  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('membership_id', membership.id)
    .eq('church_id', params.churchId)
    .maybeSingle();

  if (error) {
    console.error('Could not load team role:', error);
    throw new Error('Could not check your event team permissions.');
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
    console.error('Could not load app admin role:', error);
    throw new Error('Could not check your event team permissions.');
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
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("churches")
    .select("workspace_status")
    .eq("id", churchId)
    .maybeSingle();

  if (workspace?.workspace_status === "inactive" && !appRole) {
    throw new Error("This workspace is inactive.");
  }

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

  const assignmentPayload = {
    church_id: churchId,
    event_id: input.eventId,
    team_member_id: input.teamMemberId,
    invitee_email: null,
    invitation_token_hash: null,
    status: 'accepted' as const,
    accepted_at: new Date().toISOString(),
    revoked_at: null,
    revoked_by: null,
    invited_by: user.id,
    ...permissions,
  };

  const { data: existingAssignments, error: existingError } = await supabase
    .from('event_assignments')
    .select('id')
    .eq('church_id', churchId)
    .eq('event_id', input.eventId)
    .eq('team_member_id', input.teamMemberId)
    .limit(1);

  if (existingError) {
    console.error('Event assignment lookup error:', existingError);
    throw new Error('Could not check the existing event assignment.');
  }

  const existingAssignmentId = existingAssignments?.[0]?.id;
  const { error } = existingAssignmentId
    ? await supabase
        .from('event_assignments')
        .update(assignmentPayload)
        .eq('id', existingAssignmentId)
    : await supabase.from('event_assignments').insert(assignmentPayload);

  if (error) {
    console.error('Event assignment write error:', error);
    throw new Error('Could not assign this team member to the event.');
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

  const assignmentPayload = {
    church_id: churchId,
    event_id: input.eventId,
    team_member_id: null,
    invitee_email: email,
    invitation_token_hash: tokenHash,
    status: 'pending' as const,
    invitation_expires_at: expiresAt,
    invited_by: user.id,
    accepted_at: null,
    revoked_at: null,
    revoked_by: null,
    ...permissions,
  };

  const { data: existingAssignments, error: existingError } = await supabase
    .from('event_assignments')
    .select('id, status, team_member_id')
    .eq('church_id', churchId)
    .eq('event_id', input.eventId)
    .eq('invitee_email', email)
    .limit(1);

  if (existingError) {
    console.error('Event invitation lookup error:', existingError);
    throw new Error('Could not check the existing event invitation.');
  }

  const existingAssignmentId = existingAssignments?.[0]?.id;
  if (existingAssignments?.[0]?.status === 'accepted' && existingAssignments[0].team_member_id) {
    throw new Error('That email address is already on this event team.');
  }

  const { error } = existingAssignmentId
    ? await supabase
        .from('event_assignments')
        .update(assignmentPayload)
        .eq('id', existingAssignmentId)
    : await supabase.from('event_assignments').insert(assignmentPayload);

  if (error) {
    console.error('Event invitation write error:', {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      churchId,
      eventId: input.eventId,
      email
    });
    throw new Error('Could not create this event invitation.');
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/event-invitations/accept?token=${rawToken}`;
  const { data: eventDetails } = await supabase
    .from('events')
    .select('name, churches(name)')
    .eq('id', input.eventId)
    .single();
  const churches = eventDetails?.churches as { name: string }[] | null | undefined;
  const workspaceName = churches?.[0]?.name;
  const { subject, body } = eventInviteTemplate({
    eventName: eventDetails?.name ?? 'this event',
    workspaceName: workspaceName ?? 'your workspace',
    inviterName: user.user_metadata?.full_name || user.email || 'A team member',
    inviteLink
  });

  revalidatePath(`/events/${input.eventId}/team`);

  return {
    ok: true,
    token: rawToken,
    inviteUrl: inviteLink,
    gmailUrl: gmailComposeUrl({ to: email, subject, body }),
    emailUrl: mailtoUrl({ to: email, subject, body })
  };
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
    console.error('Event assignment permissions update error:', error);
    throw new Error('Could not update event team permissions.');
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
    console.error('Event assignment revoke error:', error);
    throw new Error('Could not revoke this event assignment.');
  }

  revalidatePath(`/events/${input.eventId}/team`);

  return { ok: true };
}

export async function acceptEventInvitation(input: {
  token: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be signed in.');
  }

  const { data: eventId, error } = await supabase.rpc('accept_event_invitation', {
    p_token: input.token,
  });

  if (error || !eventId) {
    throw new Error(friendlyInviteError(error?.message));
  }

  revalidatePath(`/events/${eventId}/team`);

  return { ok: true, eventId };
}

export async function getEventInviteGmailUrlAction(formData: FormData) {
  const { supabase, user } = await getCurrentUserContext();

  const parsed = {
    token: String(formData.get("token") || ""),
    eventId: String(formData.get("eventId") || "")
  };

  if (!parsed.token || !parsed.eventId) {
    return { error: "Invalid request" };
  }

  const { data: assignment } = await supabase
    .from("event_assignments")
    .select("*, events(name), churches(name)")
    .eq("invitation_token_hash", hashToken(parsed.token))
    .eq("event_id", parsed.eventId)
    .single();

  if (!assignment) {
    return { error: "Invitation not found" };
  }

  try {
    await requireCanManageEventTeam({
      userId: user.id,
      eventId: parsed.eventId
    });
  } catch {
    return { error: "You do not have permission to manage this event invitation." };
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/event-invitations/accept?token=${parsed.token}`;
  const { subject, body } = eventInviteTemplate({
    eventName: assignment.events.name,
    workspaceName: assignment.churches.name,
    inviterName: user.user_metadata?.full_name || "A team member",
    inviteLink
  });

  const gmailUrl = gmailComposeUrl({
    to: assignment.invitee_email,
    subject,
    body
  });

  const emailUrl = mailtoUrl({
    to: assignment.invitee_email,
    subject,
    body
  });

  return { gmailUrl, emailUrl };
}
