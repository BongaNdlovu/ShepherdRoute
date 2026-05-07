import Link from "next/link";
import { getChurchContext, getTeamMembers } from "@/lib/data";
import { getEventContactsPage, type EventContactsParams } from "@/lib/data-events";
import { getResolvedEventPermissions, requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { ContactBulkActions } from "@/components/app/contact-bulk-actions";
import { EventContactsFilters } from "@/components/app/event-contacts-filters";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManageContacts } from "@/lib/permissions";
import type { AppAdminRole } from "@/lib/permissions";
import type { AppRole } from "@/lib/constants";
import type { TeamRole } from "@/lib/constants";

export const metadata = {
  title: "Event Contacts"
};

export default async function EventContactsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<EventContactsParams & { error?: string; success?: string }>;
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
  const userCanManageContacts = canManageContacts(
    context.role as "admin" | "pastor" | "elder" | "bible_worker" | "health_leader" | "prayer_team" | "youth_leader" | "viewer",
    context.appRole as AppRole | null
  );
  const permissions = await getResolvedEventPermissions({
    userId: context.userId,
    eventId: id,
    appRole: context.appAdminRole as AppAdminRole | null,
    teamRole: context.role as TeamRole
  });
  const contactItems = contacts.map((contact) => ({
    id: contact.id,
    person_id: contact.person_id,
    full_name: contact.full_name,
    phone: contact.phone,
    email: contact.email,
    area: contact.area,
    language: contact.language,
    best_time_to_contact: contact.best_time_to_contact,
    status: contact.status,
    urgency: contact.urgency,
    assigned_to: contact.assigned_to,
    assigned_handling_role: contact.assigned_handling_role,
    recommended_assigned_role: contact.recommended_assigned_role,
    do_not_contact: contact.do_not_contact,
    duplicate_of_contact_id: contact.duplicate_of_contact_id,
    duplicate_match_confidence: contact.duplicate_match_confidence,
    duplicate_match_reason: contact.duplicate_match_reason,
    created_at: contact.created_at,
    event_id: id,
    event_name: "This event",
    assigned_name: contact.assigned_name,
    interests: contact.interests,
    preferred_contact_methods: contact.preferred_contact_methods,
    total_count: totalCount
  }));

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
            <EventContactsFilters
              team={team.map((member) => ({
                id: member.id,
                display_name: member.display_name,
              }))}
              status={query.status}
              urgency={query.urgency}
              assignedTo={query.assignedTo}
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {query.error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {query.error}
              </div>
            ) : null}
            {query.success ? (
              <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                {query.success}
              </div>
            ) : null}
            <ContactBulkActions
              churchName={context.churchName}
              contacts={contactItems}
              team={team}
              canManageContacts={userCanManageContacts}
              canBulkAssignContacts={userCanManageContacts || permissions.can_assign_contacts}
              returnTo={`/events/${id}/contacts`}
            />
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
