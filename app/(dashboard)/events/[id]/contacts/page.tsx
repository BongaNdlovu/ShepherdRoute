import Link from "next/link";
import { getChurchContext, getTeamMembers } from "@/lib/data";
import { getEventContactsPage, type EventContactsParams } from "@/lib/data-events";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { statusOptions, urgencyOptions } from "@/lib/constants";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Event Contacts"
};

export default async function EventContactsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<EventContactsParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await getChurchContext();

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_view_contacts",
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
                You do not have permission to view event contacts.
              </p>
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    );
  }

  const team = await getTeamMembers(context.churchId);
  const { contacts, totalCount, page, pageSize } = await getEventContactsPage(context.churchId, id, query);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <CinematicSection className="cinematic-fade-up">
      <section className="space-y-4">
        <EventWorkspaceTabs eventId={id} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Event Contacts
            <span className="text-sm font-normal text-muted-foreground">{totalCount} total</span>
          </CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-4 mt-2">
              <select
                name="status"
                defaultValue={query.status || "all"}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value === "all") {
                    url.searchParams.delete("status");
                  } else {
                    url.searchParams.set("status", e.target.value);
                  }
                  window.location.href = url.toString();
                }}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select
                name="urgency"
                defaultValue={query.urgency || "all"}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value === "all") {
                    url.searchParams.delete("urgency");
                  } else {
                    url.searchParams.set("urgency", e.target.value);
                  }
                  window.location.href = url.toString();
                }}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Urgency</option>
                {urgencyOptions.map((urgency) => (
                  <option key={urgency} value={urgency}>{urgency.charAt(0).toUpperCase() + urgency.slice(1)}</option>
                ))}
              </select>
              <select
                name="assignedTo"
                defaultValue={query.assignedTo || "all"}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value === "all") {
                    url.searchParams.delete("assignedTo");
                  } else {
                    url.searchParams.set("assignedTo", e.target.value);
                  }
                  window.location.href = url.toString();
                }}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All Assignments</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>{member.display_name}</option>
                ))}
              </select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr] bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
              <span>Contact</span>
              <span>Interest</span>
              <span>Urgency</span>
              <span>Status</span>
              <span>Assigned</span>
              <span>Date</span>
            </div>
            <div className="divide-y">
              {contacts.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`} className="grid gap-3 px-4 py-4 hover:bg-amber-50 md:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr] md:items-center">
                  <div>
                    <p className="font-bold">{contact.full_name}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone} {contact.area ? `- ${contact.area}` : ""}</p>
                  </div>
                  <InterestPills interests={contact.interests} />
                  <UrgencyBadge urgency={contact.urgency} />
                  <StatusBadge status={contact.status} />
                  <p className="text-sm text-muted-foreground">{contact.assigned_name ?? "Unassigned"}</p>
                  <p className="text-sm text-muted-foreground">{new Date(contact.created_at).toLocaleDateString()}</p>
                </Link>
              ))}
              {!contacts.length ? (
                <div className="p-8 text-center">
                  <p className="font-bold">No contacts yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Share the public form or QR code to start capturing contacts.</p>
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
                    <Link href={`/events/${id}/contacts?page=${page - 1}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${id}/contacts?page=${page + 1}`}>
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
