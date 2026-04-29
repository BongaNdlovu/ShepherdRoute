import Link from "next/link";
import { Download, UserPlus } from "lucide-react";
import { ContactList } from "@/components/app/contact-list";
import { ContactsFilterForm } from "@/components/app/contacts-filter-form";
import { ContactsPagination } from "@/components/app/contacts-pagination";
import { QuickContactForm } from "@/components/app/quick-contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChurchContext, getContactsPage, getEvents, getTeamMembers } from "@/lib/data";

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
  const [contactsPage, events, team] = await Promise.all([
    getContactsPage(context.churchId, params),
    getEvents(context.churchId),
    getTeamMembers(context.churchId)
  ]);
  const { contacts, total, page, pageCount } = contactsPage;
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
              <CardTitle>Follow-up contacts</CardTitle>
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
          <ContactList churchName={context.churchName} contacts={contacts} team={team} />
        </CardContent>
      </Card>

      <QuickContactForm events={events} />
    </section>
  );
}
