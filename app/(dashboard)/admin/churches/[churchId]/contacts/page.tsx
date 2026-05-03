import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminTabs } from "@/components/app/owner-admin-tabs";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { getOwnerChurchDetail, getOwnerChurchContactsPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Church Contacts"
};

export default async function OwnerChurchContactsPage({
  params,
  searchParams
}: {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const { churchId } = await params;
  const paramsQuery = await searchParams;
  const [church, contactsPage] = await Promise.all([
    getOwnerChurchDetail(churchId),
    getOwnerChurchContactsPage(churchId, paramsQuery)
  ]);

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Owner church view</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">{church.name} - Contacts</h2>
      </header>

      <OwnerAdminTabs churchId={church.id} active="contacts" />

      <Card>
        <CardHeader>
          <CardTitle>Visitor contacts</CardTitle>
          <CardDescription>Operational records - prayer request text is not exposed in owner view.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search contacts..." defaultValue={paramsQuery.q ?? ""} />
          <OwnerPagination
            page={contactsPage.page}
            pageCount={contactsPage.pageCount}
            total={contactsPage.total}
            visibleCount={contactsPage.items.length}
            q={paramsQuery.q}
            pageSize={contactsPage.pageSize}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-semibold">Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Phone</th>
                  <th className="px-4 py-2 text-left font-semibold">Email</th>
                  <th className="px-4 py-2 text-left font-semibold">Area</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Urgency</th>
                  <th className="px-4 py-2 text-left font-semibold">Event</th>
                  <th className="px-4 py-2 text-left font-semibold">Assigned to</th>
                  <th className="px-4 py-2 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {contactsPage.items.map((contact) => (
                  <tr key={contact.id} className="border-b">
                    <td className="px-4 py-3 font-semibold">{contact.full_name}</td>
                    <td className="px-4 py-3">{contact.phone}</td>
                    <td className="px-4 py-3">{contact.email ?? "-"}</td>
                    <td className="px-4 py-3">{contact.area ?? "-"}</td>
                    <td className="px-4 py-3">{contact.status}</td>
                    <td className="px-4 py-3">
                      <Badge variant={contact.urgency === "high" ? "destructive" : contact.urgency === "medium" ? "warning" : "default"}>
                        {contact.urgency}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{contact.event_name ?? "-"}</td>
                    <td className="px-4 py-3">{contact.assigned_name ?? "-"}</td>
                    <td className="px-4 py-3">{new Date(contact.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!contactsPage.items.length ? (
            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No contacts found.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
