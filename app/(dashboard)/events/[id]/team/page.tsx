import { getChurchContext } from "@/lib/data";
import { getEventAssignments } from "@/lib/data-event-assignments";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventInvitationModal } from "@/components/app/event-invitation-modal";
import { Suspense } from "react";

export const metadata = {
  title: "Event Team"
};

function TeamAssignmentManager({ eventId }: { eventId: string }) {
  return (
    <div className="flex justify-end mb-4">
      <EventInvitationModal
        eventId={eventId}
        onSuccess={() => window.location.reload()}
        onClose={() => {}}
      />
    </div>
  );
}

export default async function EventTeamPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getChurchContext();
  const assignments = await getEventAssignments(id);

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_manage_event_team",
    });
  } catch {
    return (
      <section className="space-y-4">
        <EventWorkspaceTabs eventId={id} />
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold">Access restricted</h1>
            <p className="text-sm text-muted-foreground">
              You do not have permission to manage this event team.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <EventWorkspaceTabs eventId={id} />

      <Suspense fallback={<div>Loading...</div>}>
        <TeamAssignmentManager eventId={id} />
      </Suspense>

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
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">
                        {assignment.team_member_id ? `Team Member: ${assignment.team_member_id}` : `Invited: ${assignment.invitee_email}`}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={assignment.status === 'accepted' ? 'default' : 'secondary'}>
                          {assignment.status}
                        </Badge>
                        {assignment.revoked_at && <Badge variant="destructive">Revoked</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Invited: {new Date(assignment.invited_at).toLocaleDateString()}
                      </p>
                    </div>
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
              ))}
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
  );
}
