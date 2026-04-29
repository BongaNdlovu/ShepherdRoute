import Link from "next/link";
import { CalendarDays, Lock, MapPin, QrCode, Unlock, UsersRound } from "lucide-react";
import { updateEventStatusAction } from "@/app/(dashboard)/actions";
import { InterestPills } from "@/components/app/interest-pills";
import { QrCard } from "@/components/app/qr-card";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eventTypeLabels, type EventType } from "@/lib/constants";
import { getChurchContext, getEvent } from "@/lib/data";
import { absoluteUrl } from "@/lib/utils";

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
  const publicUrl = absoluteUrl(`/e/${event.slug}`);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          {query.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{query.error}</p> : null}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={event.is_active ? "success" : "muted"}>{event.is_active ? "Active" : "Closed"}</Badge>
                <Badge variant="secondary">{eventTypeLabels[event.event_type as EventType]}</Badge>
              </div>
              <CardTitle className="mt-3 text-2xl">{event.name}</CardTitle>
              <CardDescription>{event.description ?? "QR registration and team follow-up for this outreach event."}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={updateEventStatusAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="isActive" value={event.is_active ? "false" : "true"} />
                <Button type="submit" variant="outline">
                  {event.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {event.is_active ? "Close event" : "Reopen event"}
                </Button>
              </form>
              <Button asChild variant="outline">
                <Link href={`/events/${event.id}/report`}>View report</Link>
              </Button>
              {event.is_active ? (
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

        {event.is_active ? (
          <QrCard eventName={event.name} url={publicUrl} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Registration closed</CardTitle>
              <CardDescription>The public registration page is disabled. Reopen the event to restore the QR form.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </section>
  );
}
