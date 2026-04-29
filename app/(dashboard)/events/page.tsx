import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCard } from "@/components/app/qr-card";
import { eventTypeLabels, type EventType } from "@/lib/constants";
import { getChurchContext, getEvents } from "@/lib/data";
import { requestOrigin } from "@/lib/server-url";

export const metadata = {
  title: "Events"
};

export default async function EventsPage() {
  const context = await getChurchContext();
  const events = await getEvents(context.churchId, { includeArchived: true });
  const origin = await requestOrigin();
  const currentEvent = events.find((event) => event.is_active && !event.archived_at);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Events</h2>
          <p className="mt-1 text-sm text-muted-foreground">Each event gets a public registration page and QR-ready URL.</p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            Create event
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-md bg-amber-100 p-3 text-amber-800">
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {event.archived_at ? <Badge variant="warning">Archived</Badge> : null}
                  <Badge variant={event.is_active && !event.archived_at ? "success" : "muted"}>{event.is_active && !event.archived_at ? "Active" : "Closed"}</Badge>
                </div>
              </div>
              <CardTitle>
                <Link href={`/events/${event.id}`} className="underline-offset-4 hover:underline">
                  {event.name}
                </Link>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {eventTypeLabels[event.event_type as EventType]} {event.starts_on ? `- ${event.starts_on}` : ""} {event.location ? `- ${event.location}` : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Public URL</p>
                <p className="mt-1 break-all text-sm font-semibold">{`${origin}/e/${event.slug}`}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild variant="outline">
                  <Link href={`/events/${event.id}`}>View event</Link>
                </Button>
                {!event.archived_at && event.is_active ? (
                  <Button asChild>
                    <Link href={`/e/${event.slug}`} target="_blank">Open form</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentEvent ? <QrCard eventName={currentEvent.name} url={`${origin}/e/${currentEvent.slug}`} /> : null}
    </section>
  );
}
