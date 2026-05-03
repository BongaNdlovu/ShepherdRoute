import Link from "next/link";
import { Download, UserPlus } from "lucide-react";
import { ContactList } from "@/components/app/contact-list";
import { ContactsFilterForm } from "@/components/app/contacts-filter-form";
import { ContactsPagination } from "@/components/app/contacts-pagination";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { InlineHelp } from "@/components/app/inline-help";
import { QuickContactForm } from "@/components/app/quick-contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChurchContext, getContactsPage, getEvents, getTeamMembers, getUserAccountPreferences } from "@/lib/data";
import { canManageContacts } from "@/lib/permissions";

export const metadata = {
  title: "Contacts"
};

export default async function ContactsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; interest?: string; event?: string; assignedTo?: string; page?: string; pageSize?: string; error?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const [contactsPage, events, team, preferences] = await Promise.all([
    getContactsPage(context.churchId, params),
    getEvents(context.churchId),
    getTeamMembers(context.churchId),
    getUserAccountPreferences(context.userId)
  ]);
  const { contacts, total, page, pageCount } = contactsPage;
  const userCanManageContacts = canManageContacts(context.role as "admin" | "pastor" | "elder" | "bible_worker" | "health_leader" | "prayer_team" | "youth_leader" | "viewer");
  const exportHref = () => {
    const search = new URLSearchParams();

    for (const key of ["q", "status", "interest", "event", "assignedTo"] as const) {
      const value = params[key];
      if (value && value !== "all") {
        search.set(key, value);
      }
    }

    const suffix = search.toString();
    return suffix ? `/contacts/export?${suffix}` : "/contacts/export";
  };

  return (
    <DashboardShell
      title="Visitor contacts"
      description="Filter, assign, message, and track visitors through the care pathway."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="#add-contact">
              <UserPlus className="h-4 w-4" />
              Add contact
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={exportHref()}>
              <Download className="h-4 w-4" />
              Export CSV
            </Link>
          </Button>
        </div>
      }
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
          <div className="rounded-3xl border border-white/55 bg-white/35 p-4 shadow-sm backdrop-blur-md">
            <ContactsFilterForm events={events} params={params} team={team} />
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200/75 bg-white/90 shadow-sm backdrop-blur">
            <div className="p-6 space-y-4">
              <ContactList churchName={context.churchName} contacts={contacts} team={team} compactLists={preferences.compactLists} canManageContacts={userCanManageContacts} />
              <ContactsPagination
                page={page}
                pageCount={pageCount}
                pageSize={contactsPage.pageSize}
                total={total}
                visibleCount={contacts.length}
                params={params}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Understanding contact status</CardTitle>
                <CardDescription>These labels help your team know where each visitor is in the follow-up pathway.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InlineHelp>
                  <strong>New:</strong> First-time visitor who has not been contacted yet. Needs an initial call or message.
                </InlineHelp>
                <InlineHelp>
                  <strong>Contacted:</strong> You have reached out. Now follow their interest and continue the conversation.
                </InlineHelp>
                <InlineHelp>
                  <strong>In Progress:</strong> Active follow-up happening. Bible studies, prayer support, or ministry engagement underway.
                </InlineHelp>
                <InlineHelp>
                  <strong>Discipling:</strong> Regular contact. Attending church, joining small groups, or preparing for baptism.
                </InlineHelp>
                <InlineHelp>
                  <strong>Completed:</strong> Follow-up journey finished. They are now integrated into church life.
                </InlineHelp>
              </CardContent>
            </Card>

            <QuickContactForm events={events} />
          </div>
        </section>
      </CinematicSection>
    </DashboardShell>
  );
}
