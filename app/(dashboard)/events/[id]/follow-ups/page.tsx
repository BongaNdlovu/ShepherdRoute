import Link from "next/link";
import { getChurchContext } from "@/lib/data";
import { getEventFollowUpsPage, type EventFollowUpsParams } from "@/lib/data-events";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Event Follow-ups"
};

export default async function EventFollowUpsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<EventFollowUpsParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await getChurchContext();
  const { followUps, totalCount, page, pageSize } = await getEventFollowUpsPage(context.churchId, id, query);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <section className="space-y-4">
      <EventWorkspaceTabs eventId={id} />

      <Card>
        <CardHeader>
          <CardTitle>Event Follow-ups</CardTitle>
          <CardDescription>
            All follow-up tasks for contacts from this event ({totalCount} total).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
              <span>Contact</span>
              <span>Status</span>
              <span>Channel</span>
              <span>Due Date</span>
              <span>Assigned</span>
              <span>Contact Status</span>
            </div>
            <div className="divide-y">
              {followUps.map((followUp) => (
                <Link key={followUp.id} href={`/contacts/${followUp.contact_id}`} className="grid gap-3 px-4 py-4 hover:bg-amber-50 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] md:items-center">
                  <div>
                    <p className="font-bold">{followUp.contact_name}</p>
                    <p className="text-sm text-muted-foreground">{followUp.contact_phone}</p>
                  </div>
                  <StatusBadge status={followUp.status} />
                  <p className="text-sm text-muted-foreground">{followUp.channel ?? "None"}</p>
                  <p className="text-sm">
                    {followUp.due_at ? new Date(followUp.due_at).toLocaleDateString() : "Not set"}
                  </p>
                  <p className="text-sm text-muted-foreground">{followUp.assigned_name ?? "Unassigned"}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={followUp.contact_status} />
                    <UrgencyBadge urgency={followUp.contact_urgency} />
                  </div>
                </Link>
              ))}
              {!followUps.length ? (
                <div className="p-8 text-center">
                  <p className="font-bold">No follow-ups yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Follow-ups will appear here as contacts are assigned.</p>
                </div>
              ) : null}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${id}/follow-ups?page=${page - 1}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${id}/follow-ups?page=${page + 1}`}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
