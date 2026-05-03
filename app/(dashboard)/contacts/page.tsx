import Link from "next/link";
import { Download, UserPlus } from "lucide-react";
import { ContactList } from "@/components/app/contact-list";
import { ContactsFilterForm } from "@/components/app/contacts-filter-form";
import { ContactsPagination } from "@/components/app/contacts-pagination";
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
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Visitor contacts</CardTitle>
              <CardDescription>Filter, assign, message, and track visitors through the care pathway.</CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          {params.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
          <ContactsFilterForm params={params} events={events} team={team} />
          <ContactsPagination
            params={params}
            page={page}
            pageCount={pageCount}
            pageSize={contactsPage.pageSize}
            total={total}
            visibleCount={contacts.length}
          />
          <ContactList churchName={context.churchName} contacts={contacts} team={team} compactLists={preferences.compactLists} canManageContacts={userCanManageContacts} />
        </CardContent>
      </Card>

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
    </section>
  );
}
