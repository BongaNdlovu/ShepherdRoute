import Link from "next/link";
import { getChurchContext, getTeamMembers } from "@/lib/data";
import { getEventFollowUpsPage, type EventFollowUpsParams } from "@/lib/data-events";
import type { FollowUpQueueItem } from "@/lib/data-follow-ups";
import type { FollowUpChannel } from "@/lib/constants";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { EventFollowUpFilters } from "@/components/app/event-follow-up-filters";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { FollowUpsQueueList } from "@/components/app/follow-ups-queue-list";
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

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_view_contacts"
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
                You do not have permission to view this event follow-up queue.
              </p>
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    );
  }

  const team = await getTeamMembers(context.churchId);
  const { followUps, totalCount, page, pageSize } = await getEventFollowUpsPage(context.churchId, id, query);
  const followUpItems = followUps.map((followUp) => ({
    id: followUp.id,
    contact_id: followUp.contact_id,
    assigned_to: followUp.assigned_to,
    status: followUp.status,
    channel: (followUp.channel ?? "note") as FollowUpChannel,
    next_action: followUp.next_action,
    notes: null,
    due_at: followUp.due_at,
    completed_at: followUp.completed_at,
    created_at: followUp.created_at,
    contact: {
      full_name: followUp.contact_name,
      phone: followUp.contact_phone,
      email: followUp.contact_email,
      area: null,
      status: followUp.contact_status,
      urgency: followUp.contact_urgency,
      do_not_contact: followUp.contact_do_not_contact,
      interests: followUp.interests,
      event_id: id,
      event_name: "This event"
    },
    assigned_name: followUp.assigned_name,
    suggested_message: followUp.suggested_message_id
      ? {
        id: followUp.suggested_message_id,
        message_text: followUp.suggested_message_text ?? "",
        wa_link: followUp.suggested_wa_link,
        opened_at: followUp.suggested_opened_at
      }
      : null,
    total_count: totalCount
  })) satisfies FollowUpQueueItem[];

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <CinematicSection className="cinematic-fade-up">
      <section className="space-y-4">
        <EventWorkspaceTabs eventId={id} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Event Follow-ups
            <span className="text-sm font-normal text-muted-foreground">{totalCount} total</span>
          </CardTitle>
          <CardDescription>
            <EventFollowUpFilters
              team={team.map((member) => ({
                id: member.id,
                display_name: member.display_name,
              }))}
              status={query.status}
              assignedTo={query.assignedTo}
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FollowUpsQueueList items={followUpItems} returnTo={`/events/${id}/follow-ups`} />

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
    </CinematicSection>
  );
}
