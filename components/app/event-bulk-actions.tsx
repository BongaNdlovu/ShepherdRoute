"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, Check, ClipboardList, Lock, QrCode, Settings2, Trash2, UsersRound, X } from "lucide-react";
import { bulkCloseEventsAction, bulkDeleteEventsAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { eventTypeLabels, type EventType } from "@/lib/constants";

type EventBulkListItem = {
  id: string;
  name: string;
  event_type: string;
  starts_on: string | null;
  location: string | null;
  slug: string;
  is_active: boolean;
  archived_at: string | null;
  contact_count: number;
};

type EventBulkActionsProps = {
  events: EventBulkListItem[];
  origin: string;
  canManageEvents: boolean;
};

export function EventBulkActions({ events, origin, canManageEvents }: EventBulkActionsProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const selectedEvents = useMemo(
    () => events.filter((event) => selectedEventIds.includes(event.id)),
    [events, selectedEventIds]
  );
  const hasSelection = selectedEventIds.length > 0;
  const allSelected = events.length > 0 && selectedEventIds.length === events.length;
  const selectedContactCount = selectedEvents.reduce((total, event) => total + event.contact_count, 0);

  function toggleEvent(eventId: string) {
    setSelectedEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId]
    );
  }

  function toggleAll() {
    setSelectedEventIds(allSelected ? [] : events.map((event) => event.id));
  }

  function confirmClose() {
    return window.confirm(`Close ${selectedEventIds.length} selected event${selectedEventIds.length === 1 ? "" : "s"}?`);
  }

  function confirmDelete() {
    const contactLine = selectedContactCount > 0
      ? ` ${selectedContactCount} attached contact${selectedContactCount === 1 ? "" : "s"} will be preserved and detached from the deleted event${selectedEventIds.length === 1 ? "" : "s"}.`
      : "";

    return window.confirm(
      `Permanently delete ${selectedEventIds.length} selected event${selectedEventIds.length === 1 ? "" : "s"}?${contactLine}`
    );
  }

  return (
    <div className="space-y-4">
      {canManageEvents ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all events"
              disabled={events.length === 0}
            />
            <div>
              <p className="text-sm font-semibold">
                {hasSelection ? `${selectedEventIds.length} selected` : "Select events"}
              </p>
              <p className="text-xs text-muted-foreground">Bulk actions apply to checked events only.</p>
            </div>
          </div>
          {hasSelection ? (
            <div className="flex flex-wrap gap-2">
              <form action={bulkCloseEventsAction} onSubmit={confirmClose}>
                {selectedEventIds.map((id) => (
                  <input key={id} type="hidden" name="eventIds" value={id} />
                ))}
                <Button type="submit" variant="outline" size="sm">
                  <Lock className="h-4 w-4" />
                  Close selected
                </Button>
              </form>
              <form action={bulkDeleteEventsAction} onSubmit={confirmDelete}>
                {selectedEventIds.map((id) => (
                  <input key={id} type="hidden" name="eventIds" value={id} />
                ))}
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Delete selected
                </Button>
              </form>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedEventIds([])}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {events.map((event) => {
          const isArchived = Boolean(event.archived_at);
          const isSelected = selectedEventIds.includes(event.id);

          return (
            <Card key={event.id} className={isSelected ? "border-amber-300 bg-amber-50/40" : undefined}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {canManageEvents ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleEvent(event.id)}
                        aria-label={`Select ${event.name}`}
                      />
                    ) : null}
                    <div className="rounded-lg bg-accent/10 p-3 text-accent">
                      <QrCode className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {isSelected ? <Check className="h-4 w-4 text-amber-600" /> : null}
                    {isArchived ? <Badge variant="warning">Archived</Badge> : null}
                    <Badge variant={event.is_active && !isArchived ? "success" : "muted"}>
                      {event.is_active && !isArchived ? "Active" : "Closed"}
                    </Badge>
                  </div>
                </div>
                <CardTitle>
                  <Link href={`/events/${event.id}`} className="underline-offset-4 hover:underline">
                    {event.name}
                  </Link>
                </CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  {eventTypeLabels[event.event_type as EventType]} {event.starts_on ? `- ${event.starts_on}` : ""} {event.location ? `- ${event.location}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Public URL</p>
                  <p className="mt-1 break-all text-sm font-medium text-foreground">{`${origin}/e/${event.slug}`}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{event.contact_count} contact{event.contact_count === 1 ? "" : "s"} captured</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}/contacts`}>
                      <UsersRound className="h-4 w-4 mr-2" />
                      Contacts
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}/follow-ups`}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Follow-ups
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}/reports`}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Reports
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}/settings`}>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
