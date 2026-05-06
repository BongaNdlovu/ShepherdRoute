import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { EmptyState } from "@/components/app/empty-state";
import { EventBulkActions } from "@/components/app/event-bulk-actions";
import { QrCard } from "@/components/app/qr-card";
import { getChurchContext, getEvents } from "@/lib/data";
import { canManageEvents } from "@/lib/permissions";
import { requestOrigin } from "@/lib/server-url";
import type { AppRole, TeamRole } from "@/lib/constants";

export const metadata = {
  title: "Events"
};

export default async function EventsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const query = await searchParams;
  const context = await getChurchContext();
  const events = await getEvents(context.churchId, { includeArchived: true });
  const origin = await requestOrigin();
  const currentEvent = events.find((event) => event.is_active && !event.archived_at);
  const canBulkManageEvents = canManageEvents(context.role as TeamRole, context.appRole as AppRole | null);
  const eventItems = events.map((event) => ({
    id: event.id,
    name: event.name,
    event_type: event.event_type,
    starts_on: event.starts_on,
    location: event.location,
    slug: event.slug,
    is_active: event.is_active,
    archived_at: event.archived_at,
    contact_count: Number(event.contacts?.[0]?.count ?? 0)
  }));

  return (
    <DashboardShell
      title="Events & QR Codes"
      description="Each event creates a unique QR code. Visitors scan it, fill out the form, and appear in your contacts."
      actions={
        <Button asChild>
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            New event
          </Link>
        </Button>
      }
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
        {query.error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{query.error}</p> : null}
        {query.success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{query.success}</p> : null}
        {events.length ? (
          <EventBulkActions events={eventItems} origin={origin} canManageEvents={canBulkManageEvents} />
      ) : (
        <EmptyState
          icon={QrCode}
          title="No events yet"
          description="Create your first event to get a QR code. Use it for visitor registration at services, expos, Bible studies, or outreach programs."
          action={{ href: "/events/new", label: "Create your first event" }}
        />
      )}

      {currentEvent ? <QrCard eventName={currentEvent.name} url={`${origin}/e/${currentEvent.slug}`} /> : null}
      </section>
      </CinematicSection>
    </DashboardShell>
  );
}
