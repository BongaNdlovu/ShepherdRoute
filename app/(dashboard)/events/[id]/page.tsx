import Link from "next/link";
import { Archive, CalendarDays, Lock, MapPin, QrCode, Trash2, Undo2, Unlock, UsersRound } from "lucide-react";
import { deleteEventAction, updateEventArchiveAction, updateEventStatusAction } from "@/app/(dashboard)/actions";
import { InterestPills } from "@/components/app/interest-pills";
import { QrCard } from "@/components/app/qr-card";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eventTypeLabels, type EventType } from "@/lib/constants";
import { getChurchContext, getEvent } from "@/lib/data";
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
  const { event, contacts, contactsLimit, contactsTotal } = await getEvent(context.churchId, id);
  const publicUrl = await absoluteRequestUrl(`/e/${event.slug}`);
  const isArchived = Boolean(event.archived_at);

  return (
    <section className="space-y-4">
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
                <Link href={`/events/${event.id}/report`}>View report</Link>
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
              <p className="font-bold">{contactsTotal}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Event contacts</CardTitle>
            <CardDescription>
              People captured from this registration page.
              {contactsTotal > contacts.length ? ` Showing latest ${contactsLimit}.` : ""}
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
                {contacts.map((contact) => (
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
                {!contacts.length ? (
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

      <Card className="border-rose-200">
        <CardHeader>
          <CardTitle className="text-rose-700">Delete event</CardTitle>
          <CardDescription>Use this for test events or permanent cleanup. Contacts captured from this event will remain, but their event link will be cleared by the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteEventAction} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="eventName" value={event.name} />
            <div className="grid gap-2">
              <label htmlFor="confirmation" className="text-sm font-bold">Type the event name to delete</label>
              <input id="confirmation" name="confirmation" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring" placeholder={event.name} />
            </div>
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete event
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
