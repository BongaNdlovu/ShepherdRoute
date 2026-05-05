import { getChurchContext, getTeamMembers } from "@/lib/data";
import { getEventAssignments } from "@/lib/data-event-assignments";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import type { EventAssignmentRow } from "@/lib/data-event-assignments";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventInvitationModal } from "@/components/app/event-invitation-modal";
import { EventAssignmentActions } from "@/components/app/event-assignment-actions";
import type { EventAssignmentPermissions } from "@/lib/event-permission-presets";

function permissionsFromAssignment(assignment: EventAssignmentRow): Partial<EventAssignmentPermissions> {
  return {
    can_view_contacts: assignment.can_view_contacts,
    can_assign_contacts: assignment.can_assign_contacts,
    can_view_reports: assignment.can_view_reports,
    can_export_reports: assignment.can_export_reports,
    can_edit_event_settings: assignment.can_edit_event_settings,
    can_manage_event_team: assignment.can_manage_event_team,
    can_view_prayer_requests: assignment.can_view_prayer_requests,
    can_delete_event: assignment.can_delete_event,
  };
}

export const metadata = {
  title: "Event Team"
};

export default async function EventTeamPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getChurchContext();

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_manage_event_team",
    });
  } catch {
    return (
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-4">
          <EventWorkspaceTabs eventId={id} />
          <Card>
            <CardContent className="p-6">
              <h1 className="text-lg font-semibold">Access restricted</h1>
              <p className="text-sm text-muted-foreground">
                You do not have permission to manage event team.
              </p>
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    );
  }

  const [assignments, teamMembers] = await Promise.all([
    getEventAssignments(context.churchId, id).catch((error) => {
      console.error("Error fetching event assignments:", error);
      return [];
    }),
    getTeamMembers(context.churchId).catch((error) => {
      console.error("Error fetching team members:", error);
      return [];
    }),
  ]);

  return (
    <CinematicSection className="cinematic-fade-up">
      <section className="space-y-4">
        <EventWorkspaceTabs eventId={id} />

        <div className="mb-4 flex justify-end">
          <EventInvitationModal
            eventId={id}
            teamMembers={teamMembers.map((member) => ({
              id: member.id,
              display_name: member.display_name,
              role: member.role,
            }))}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Team</CardTitle>
            <CardDescription>
              Team members assigned to this event with specific permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const teamMember = Array.isArray(assignment.team_members)
                    ? assignment.team_members[0] ?? null
                    : assignment.team_members;

                  return (
                    <div key={assignment.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">
                            {teamMember
                              ? teamMember.display_name ?? teamMember.email ?? "Assigned team member"
                              : `Invited: ${assignment.invitee_email}`}
                          </p>
                          {teamMember ? (
                            <p className="text-sm text-muted-foreground">
                              {[teamMember.email, teamMember.role?.replace(/_/g, " ")].filter(Boolean).join(" - ")}
                            </p>
                          ) : null}
                          <div className="flex gap-2 mt-2">
                            <Badge variant={assignment.status === 'accepted' ? 'default' : 'secondary'}>
                              {assignment.status}
                            </Badge>
                            {assignment.revoked_at && <Badge variant="destructive">Revoked</Badge>}
                          </div>
                        </div>
                        <EventAssignmentActions
                          assignmentId={assignment.id}
                          eventId={id}
                          initialPermissions={permissionsFromAssignment(assignment)}
                          revoked={Boolean(assignment.revoked_at)}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {assignment.can_view_contacts && <Badge>View contacts</Badge>}
                        {assignment.can_assign_contacts && <Badge>Assign contacts</Badge>}
                        {assignment.can_view_reports && <Badge>View reports</Badge>}
                        {assignment.can_export_reports && <Badge>Export reports</Badge>}
                        {assignment.can_edit_event_settings && <Badge>Edit settings</Badge>}
                        {assignment.can_manage_event_team && <Badge>Manage team</Badge>}
                        {assignment.can_view_prayer_requests && <Badge>View prayers</Badge>}
                        {assignment.can_delete_event && <Badge>Delete event</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="font-bold">No team members assigned</p>
                <p className="mt-1 text-sm text-muted-foreground">Invite or assign team members to manage this event.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </CinematicSection>
  );
}
