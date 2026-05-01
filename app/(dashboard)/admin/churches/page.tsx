import Link from "next/link";
import { Church, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { StatCard } from "@/components/app/stat-card";
import { getOwnerChurchesPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";
import { updateOwnerWorkspaceStatusAction } from "@/app/(dashboard)/actions";

export const metadata = {
  title: "Owner Churches"
};

export default async function OwnerChurchesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const params = await searchParams;
  const churchesPage = await getOwnerChurchesPage(params);

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight">Churches</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and open church workspaces without loading every contact, event, and profile at once.
        </p>
      </header>

      <StatCard icon={Church} title="Churches found" value={churchesPage.total} note="Matching the current search." />

      <Card>
        <CardHeader>
          <CardTitle>Church list</CardTitle>
          <CardDescription>Open a church to view team, profiles, events, and contacts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search churches..." defaultValue={params.q ?? ""} />
          <OwnerPagination
            page={churchesPage.page}
            pageCount={churchesPage.pageCount}
            total={churchesPage.total}
            visibleCount={churchesPage.items.length}
            q={params.q}
            pageSize={churchesPage.pageSize}
          />

          <div className="grid gap-3">
            {churchesPage.items.map((church) => (
              <div key={church.church_id} className="grid gap-3 rounded-lg border bg-white p-4 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr_0.6fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{church.church_name}</p>
                    <Badge variant="info">{church.workspace_type === "ministry" ? "Ministry" : "Church"}</Badge>
                    <Badge variant={church.workspace_status === "active" ? "success" : "danger"}>
                      {church.workspace_status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Created {new Date(church.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="muted">{church.team_count} team</Badge>
                <Badge variant="muted">{church.event_count} events</Badge>
                <Badge variant="muted">{church.contact_count} contacts</Badge>
                <form action={updateOwnerWorkspaceStatusAction}>
                  <input type="hidden" name="churchId" value={church.church_id} />
                  <input type="hidden" name="workspaceStatus" value={church.workspace_status === "active" ? "inactive" : "active"} />
                  <input type="hidden" name="returnTo" value="/admin/churches" />
                  <Button type="submit" variant={church.workspace_status === "active" ? "destructive" : "outline"} size="sm">
                    {church.workspace_status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </form>
                <Button asChild variant="outline">
                  <Link href={`/admin/churches/${church.church_id}`}>
                    <Eye className="h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </div>
            ))}
            {!churchesPage.items.length ? (
              <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No churches found.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
