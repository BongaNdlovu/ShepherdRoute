import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminTabs } from "@/components/app/owner-admin-tabs";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { getOwnerChurchDetail, getOwnerChurchEventsPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Church Events"
};

export default async function OwnerChurchEventsPage({
  params,
  searchParams
}: {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const { churchId } = await params;
  const paramsQuery = await searchParams;
  const [church, eventsPage] = await Promise.all([
    getOwnerChurchDetail(churchId),
    getOwnerChurchEventsPage(churchId, paramsQuery)
  ]);

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Owner church view</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">{church.name} - Events</h2>
      </header>

      <OwnerAdminTabs churchId={church.id} active="events" />

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Registration pages and QR codes for this church.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search events..." defaultValue={paramsQuery.q ?? ""} />
          <OwnerPagination
            page={eventsPage.page}
            pageCount={eventsPage.pageCount}
            total={eventsPage.total}
            visibleCount={eventsPage.items.length}
            q={paramsQuery.q}
            pageSize={eventsPage.pageSize}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-semibold">Event name</th>
                  <th className="px-4 py-2 text-left font-semibold">Type</th>
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Location</th>
                  <th className="px-4 py-2 text-left font-semibold">Active/Archived</th>
                  <th className="px-4 py-2 text-left font-semibold">Contact count</th>
                  <th className="px-4 py-2 text-left font-semibold">Public link</th>
                  <th className="px-4 py-2 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {eventsPage.items.map((event) => (
                  <tr key={event.id} className="border-b">
                    <td className="px-4 py-3 font-semibold">{event.name}</td>
                    <td className="px-4 py-3">{event.event_type}</td>
                    <td className="px-4 py-3">{event.starts_on ? new Date(event.starts_on).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">{event.location ?? "-"}</td>
                    <td className="px-4 py-3">
                      {event.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : event.archived_at ? (
                        <Badge variant="danger">Archived</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{event.contact_count}</td>
                    <td className="px-4 py-3">
                      <Link href={`/e/${event.slug}`} className="text-blue-600 underline" target="_blank">
                        /e/{event.slug}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{new Date(event.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!eventsPage.items.length ? (
            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No events found.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
