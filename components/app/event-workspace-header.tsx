import Link from "next/link";
import { ArrowLeft, CalendarDays, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventWorkspaceSummary } from "@/lib/data-events";
import { getChurchContext } from "@/lib/data-context";

export async function EventWorkspaceHeader({ eventId }: { eventId: string }) {
  const context = await getChurchContext();
  const { event } = await getEventWorkspaceSummary(context.churchId, eventId);

  if (!event) {
    return null;
  }

  const isArchived = event.archived_at !== null;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/events">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isArchived ? "secondary" : "default"} className="gap-1">
              {isArchived ? <Archive className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
              {isArchived ? "Archived" : "Active"}
            </Badge>
            {event.event_type && (
              <Badge variant="outline">{event.event_type.replace(/_/g, " ")}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
