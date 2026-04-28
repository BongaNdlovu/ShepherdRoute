import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, MessageCircle, Search, UserPlus } from "lucide-react";
import { addQuickContactAction, updateContactAction } from "@/app/(dashboard)/actions";
import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { interestLabels, interestOptions, statusLabels, statusOptions } from "@/lib/constants";
import { getChurchContext, getContactsPage, getEvents, getTeamMembers } from "@/lib/data";
import { generateMessage, waLink } from "@/lib/whatsapp";

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
  const pageHref = (targetPage: number) => {
    const search = new URLSearchParams();

    for (const key of ["q", "status", "interest", "event", "assignedTo", "pageSize"] as const) {
      const value = params[key];
      if (value && value !== "all") {
        search.set(key, value);
      }
    }

    search.set("page", String(targetPage));
    return `/contacts?${search.toString()}`;
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
          <form className="grid gap-3 lg:grid-cols-[1fr_170px_170px_190px_190px_auto]">
            <Label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={params.q} placeholder="Search name, phone, area..." className="pl-9" />
            </Label>
            <input type="hidden" name="page" value="1" />
            <select name="status" defaultValue={params.status ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
            <select name="interest" defaultValue={params.interest ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="all">All interests</option>
              {interestOptions.map((interest) => (
                <option key={interest} value={interest}>{interestLabels[interest]}</option>
              ))}
            </select>
            <select name="event" defaultValue={params.event ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="all">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
            <select name="assignedTo" defaultValue={params.assignedTo ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="all">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>{member.display_name}</option>
              ))}
            </select>
            <Button type="submit">Apply</Button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {contacts.length ? (page - 1) * contactsPage.pageSize + 1 : 0}-{Math.min(page * contactsPage.pageSize, total)} of {total} contacts
            </p>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" aria-disabled={page <= 1}>
                <Link href={pageHref(Math.max(1, page - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              </Button>
              <span className="min-w-20 text-center text-xs font-semibold">Page {page} of {pageCount}</span>
              <Button asChild size="sm" variant="outline" aria-disabled={page >= pageCount}>
                <Link href={pageHref(Math.min(pageCount, page + 1))}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border">
            <div className="hidden grid-cols-[1.15fr_1fr_1.1fr_1.2fr] bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground xl:grid">
              <span>Contact</span>
              <span>Interest</span>
              <span>Pathway</span>
              <span>Quick actions</span>
            </div>
            <div className="divide-y">
              {contacts.map((contact) => {
                const message = generateMessage({
                  name: contact.full_name,
                  phone: contact.phone,
                  interests: contact.interests,
                  churchName: context.churchName,
                  eventName: contact.event_name
                });

                return (
                  <div
                    key={contact.id}
                    className="grid gap-4 px-4 py-4 transition hover:bg-amber-50 xl:grid-cols-[1.15fr_1fr_1.1fr_1.2fr] xl:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/contacts/${contact.id}`} className="font-bold underline-offset-4 hover:underline">
                          {contact.full_name}
                        </Link>
                        <UrgencyBadge urgency={contact.urgency} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{contact.phone} {contact.area ? `- ${contact.area}` : ""}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {contact.event_name ?? "Manual contact"}
                        {contact.best_time_to_contact ? ` - ${contact.best_time_to_contact}` : ""}
                      </p>
                    </div>
                    <InterestPills interests={contact.interests} />
                    <div className="space-y-2">
                      <StatusBadge status={contact.status} />
                      <p className="text-sm font-semibold text-slate-600">{contact.assigned_name ?? "Unassigned"}</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <form action={updateContactAction} className="flex gap-2">
                          <input type="hidden" name="contactId" value={contact.id} />
                          <input type="hidden" name="status" value={contact.status} />
                          <select name="assignedTo" defaultValue={contact.assigned_to ?? "unassigned"} className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-ring">
                            <option value="unassigned">Unassigned</option>
                            {team.map((member) => (
                              <option key={member.id} value={member.id}>{member.display_name}</option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline">Assign</Button>
                        </form>
                        <form action={updateContactAction} className="flex gap-2">
                          <input type="hidden" name="contactId" value={contact.id} />
                          <input type="hidden" name="assignedTo" value={contact.assigned_to ?? "unassigned"} />
                          <select name="status" defaultValue={contact.status} className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-ring">
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>{statusLabels[status]}</option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline">Save</Button>
                        </form>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/contacts/${contact.id}`}>Open detail</Link>
                        </Button>
                        <Button asChild size="sm" variant="success">
                          <a href={waLink(contact.phone, message)} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!contacts.length ? <p className="p-8 text-center text-sm text-muted-foreground">No contacts match this view yet.</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="add-contact" className="xl:sticky xl:top-6 xl:self-start">
        <CardHeader>
          <CardTitle>Manual intake</CardTitle>
          <CardDescription>Add someone who connected outside a QR form.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addQuickContactAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Name</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone / WhatsApp</Label>
              <Input id="phone" name="phone" placeholder="+27..." required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area">Area</Label>
              <Input id="area" name="area" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="eventId">Event</Label>
              <select id="eventId" name="eventId" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                <option value="">No event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Interest tags</Label>
              <div className="grid gap-2">
                {interestOptions.map((interest) => (
                  <label key={interest} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold">
                    <input type="checkbox" name="interests" value={interest} className="h-4 w-4" />
                    {interestLabels[interest]}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prayerRequest">Prayer request or note</Label>
              <Textarea id="prayerRequest" name="prayerRequest" />
              <p className="text-xs text-muted-foreground">Prayer text is saved in the separate prayer request table.</p>
            </div>
            <Button type="submit">Add contact</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
