import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminTabs } from "@/components/app/owner-admin-tabs";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { getOwnerChurchDetail, getOwnerChurchContactsPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Owner Ministry Contacts"
};

export default async function OwnerMinistryContactsPage({
  params,
  searchParams
}: {
  params: Promise<{ ministryId: string }>;
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const { ministryId } = await params;
  const paramsQuery = await searchParams;
  const [ministry, contactsPage] = await Promise.all([
    getOwnerChurchDetail(ministryId),
    getOwnerChurchContactsPage(ministryId, paramsQuery)
  ]);

  if (!ministry) {
    notFound();
  }

  if (ministry.workspace_type !== 'ministry') {
    notFound();
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Owner ministry view</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">{ministry.name} - Contacts</h2>
      </header>

      <OwnerAdminTabs workspaceId={ministry.id} basePath="/admin/ministries" active="contacts" />

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>Visitor records for this ministry.</CardDescription>
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
                    <td className="px-4 py-3">{contact.urgency}</td>
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
