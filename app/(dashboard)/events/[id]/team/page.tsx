import { getChurchContext } from "@/lib/data";
import { getEventTeam } from "@/lib/data-events";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const team = await getEventTeam(context.churchId, id);

  return (
    <section className="space-y-4">
      <EventWorkspaceTabs eventId={id} />

      <Card>
        <CardHeader>
          <CardTitle>Event Team</CardTitle>
          <CardDescription>
            Team members with assigned contacts from this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {team.length > 0 ? (
            <div className="space-y-3">
              {team.map((member) => (
                <div key={member.teamMemberId} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{member.displayName}</p>
                      <p className="text-sm text-muted-foreground">{member.role ?? "Team member"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{member.assignedContactCount}</p>
                      <p className="text-xs text-muted-foreground">contacts</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-md bg-blue-50 p-2">
                      <p className="text-sm font-medium text-blue-700">{member.pendingCount}</p>
                      <p className="text-xs text-blue-600">Pending</p>
                    </div>
                    <div className="rounded-md bg-green-50 p-2">
                      <p className="text-sm font-medium text-green-700">{member.completedCount}</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                    <div className="rounded-md bg-rose-50 p-2">
                      <p className="text-sm font-medium text-rose-700">{member.overdueCount}</p>
                      <p className="text-xs text-rose-600">Overdue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="font-bold">No team members assigned</p>
              <p className="mt-1 text-sm text-muted-foreground">Assign contacts to team members to track follow-up progress.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
