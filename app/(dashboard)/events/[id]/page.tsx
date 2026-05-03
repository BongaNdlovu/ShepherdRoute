import Link from "next/link";
import { Archive, CalendarDays, Heart, Lock, MapPin, QrCode, Undo2, Unlock, UsersRound, BookOpen, Droplets } from "lucide-react";
import { updateEventArchiveAction, updateEventStatusAction } from "@/app/(dashboard)/actions";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { InterestPills } from "@/components/app/interest-pills";
import { QrCard } from "@/components/app/qr-card";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eventTypeLabels, type EventType, type Interest, type FollowUpStatus } from "@/lib/constants";
import { getChurchContext, getEventWorkspaceSummary } from "@/lib/data";
import { absoluteRequestUrl } from "@/lib/server-url";

export const metadata = {
  title: "Event"
};

export default async function EventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await getChurchContext();
  const { event, summary, recentContacts, dueFollowUps, teamSnapshot } = await getEventWorkspaceSummary(context.churchId, id);
  const publicUrl = await absoluteRequestUrl(`/e/${event.slug}`);
  const isArchived = Boolean(event.archived_at);

  return (
    <section className="space-y-4">
      <EventWorkspaceTabs eventId={event.id} />

      <Card>
        <CardHeader>
          {query.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{query.error}</p> : null}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isArchived ? <Badge variant="warning">Archived</Badge> : null}
                <Badge variant={event.is_active && !isArchived ? "success" : "muted"}>{event.is_active && !isArchived ? "Active" : "Closed"}</Badge>
                <Badge variant="secondary">{eventTypeLabels[event.event_type as EventType]}</Badge>
              </div>
              <CardTitle className="mt-3 text-2xl">{event.name}</CardTitle>
              <CardDescription>{event.description ?? "QR registration and team follow-up for this outreach event."}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/events/${event.id}/customize`}>Customize form</Link>
              </Button>
              <form action={updateEventStatusAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="isActive" value={event.is_active ? "false" : "true"} />
                <Button type="submit" variant="outline" disabled={isArchived}>
                  {event.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {event.is_active ? "Close event" : "Reopen event"}
                </Button>
              </form>
              <form action={updateEventArchiveAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="archived" value={isArchived ? "false" : "true"} />
                <Button type="submit" variant="outline">
                  {isArchived ? <Undo2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  {isArchived ? "Restore event" : "Archive event"}
                </Button>
              </form>
              <Button asChild variant="outline">
                <Link href={`/events/${event.id}/reports`}>View report</Link>
              </Button>
              {event.is_active && !isArchived ? (
                <Button asChild>
                  <a href={publicUrl} target="_blank" rel="noreferrer">Open public form</a>
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-muted p-4">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Date</p>
              <p className="font-bold">{event.starts_on ?? "Not scheduled"}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Location</p>
              <p className="font-bold">{event.location ?? "Not provided"}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <UsersRound className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Contacts captured</p>
              <p className="font-bold">{summary.totalContacts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalContacts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.pendingFollowUps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.completedFollowUps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">{summary.overdueFollowUps}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Urgency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.highUrgencyContacts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prayer Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              {summary.prayerRequests}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bible Study</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              {summary.bibleStudyInterests}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Health Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-green-500" />
              {summary.healthInterests}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Due Follow-ups</CardTitle>
            <CardDescription>Follow-ups that need attention now.</CardDescription>
          </CardHeader>
          <CardContent>
            {dueFollowUps.length > 0 ? (
              <div className="space-y-2">
                {dueFollowUps.map((followUp) => (
                  <div key={followUp.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{followUp.contact_name}</p>
                      <p className="text-sm text-muted-foreground">{followUp.contact_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{followUp.assigned_name ?? "Unassigned"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(followUp.due_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No due follow-ups</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Snapshot</CardTitle>
            <CardDescription>Team members with assigned contacts.</CardDescription>
          </CardHeader>
          <CardContent>
            {teamSnapshot.length > 0 ? (
              <div className="space-y-2">
                {teamSnapshot.map((member) => (
                  <div key={member.teamMemberId} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{member.displayName}</p>
                      <p className="text-sm text-muted-foreground">{member.role ?? "Team member"}</p>
                    </div>
                    <p className="text-sm font-semibold">{member.assignedContactCount} contacts</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No team members assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
            <CardDescription>
              Latest people captured from this event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <div className="hidden grid-cols-[1.1fr_1fr_0.7fr_0.7fr] bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
                <span>Contact</span>
                <span>Interest</span>
                <span>Urgency</span>
                <span>Status</span>
              </div>
              <div className="divide-y">
                {recentContacts.map((contact: { id: string; full_name: string; phone: string; area: string | null; contact_interests: Array<{ interest: Interest }>; status: FollowUpStatus; urgency: "low" | "medium" | "high" }) => (
                  <Link key={contact.id} href={`/contacts/${contact.id}`} className="grid gap-3 px-4 py-4 hover:bg-amber-50 md:grid-cols-[1.1fr_1fr_0.7fr_0.7fr] md:items-center">
                    <div>
                      <p className="font-bold">{contact.full_name}</p>
                      <p className="text-sm text-muted-foreground">{contact.phone} {contact.area ? `- ${contact.area}` : ""}</p>
                    </div>
                    <InterestPills interests={contact.contact_interests ?? []} />
                    <UrgencyBadge urgency={contact.urgency} />
                    <StatusBadge status={contact.status} />
                  </Link>
                ))}
                {!recentContacts.length ? (
                  <div className="p-8 text-center">
                    <QrCode className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 font-bold">No visitors yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Share the public form or QR code to start capturing contacts.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {event.is_active && !isArchived ? (
          <QrCard eventName={event.name} url={publicUrl} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{isArchived ? "Event archived" : "Registration closed"}</CardTitle>
              <CardDescription>{isArchived ? "Archived events are hidden from active workflows. Restore the event to reuse its QR form." : "The public registration page is disabled. Reopen the event to restore the QR form."}</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </section>
  );
}
