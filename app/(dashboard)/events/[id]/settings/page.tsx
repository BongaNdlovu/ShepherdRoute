import { Archive, Lock, QrCode, Trash2, Undo2, Unlock } from "lucide-react";
import { deleteEventAction, updateEventArchiveAction, updateEventStatusAction, updateEventAction } from "@/app/(dashboard)/_actions/events";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getChurchContext, getEvent } from "@/lib/data";
import { absoluteRequestUrl } from "@/lib/server-url";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";

export const metadata = {
  title: "Event Settings"
};

export default async function EventSettingsPage({
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
      permission: "can_edit_event_settings",
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
                You do not have permission to edit event settings.
              </p>
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    );
  }

  const { event } = await getEvent(context.churchId, id);
  const publicUrl = await absoluteRequestUrl(`/e/${event.slug}`);
  const isArchived = Boolean(event.archived_at);

  return (
    <CinematicSection className="cinematic-fade-up">
      <section className="space-y-4">
        <EventWorkspaceTabs eventId={event.id} />

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
          <CardDescription>Edit the basic information for this event.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateEventAction} className="grid gap-4">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="grid gap-2">
              <Label htmlFor="name">Event name</Label>
              <Input id="name" name="name" defaultValue={event.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={event.description || ""} rows={3} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startsOn">Start date</Label>
                <Input id="startsOn" name="startsOn" type="date" defaultValue={event.starts_on ? event.starts_on.split("T")[0] : ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={event.location || ""} />
              </div>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event status</CardTitle>
          <CardDescription>Control whether this event is open for registrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-semibold">Active status</p>
              <p className="text-sm text-muted-foreground">
                {event.is_active && !isArchived
                  ? "Event is open and accepting registrations"
                  : "Event is closed to new registrations"}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={updateEventStatusAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="isActive" value={event.is_active ? "false" : "true"} />
                <Button type="submit" variant="outline" disabled={isArchived}>
                  {event.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {event.is_active ? "Close event" : "Reopen event"}
                </Button>
              </form>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-semibold">Archive status</p>
              <p className="text-sm text-muted-foreground">
                {isArchived
                  ? "Archived events are hidden from active workflows"
                  : "Active events appear in your event list"}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={updateEventArchiveAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="archived" value={isArchived ? "false" : "true"} />
                <Button type="submit" variant="outline">
                  {isArchived ? <Undo2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  {isArchived ? "Restore event" : "Archive event"}
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public form link</CardTitle>
          <CardDescription>The URL visitors use to access this event&apos;s registration form.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Public URL</p>
            <p className="mt-1 break-all text-sm font-semibold">{publicUrl}</p>
          </div>
          {event.is_active && !isArchived ? (
            <Button asChild className="mt-4">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <QrCode className="h-4 w-4 mr-2" />
                Open public form
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-rose-200">
        <CardHeader>
          <CardTitle className="text-rose-700">Delete event</CardTitle>
          <CardDescription>
            Only empty test events can be deleted. Events with contacts must be archived or closed so registration history and reports remain safe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteEventAction} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="eventName" value={event.name} />
            <div className="grid gap-2">
              <label htmlFor="confirmation" className="text-sm font-bold">
                Type the event name to delete
              </label>
              <input
                id="confirmation"
                name="confirmation"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring"
                placeholder={event.name}
              />
            </div>
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete event
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
    </CinematicSection>
  );
}
