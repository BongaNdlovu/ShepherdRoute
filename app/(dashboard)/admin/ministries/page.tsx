import Link from "next/link";
import { Church, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { StatCard } from "@/components/app/stat-card";
import { getOwnerMinistriesPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";
import { updateOwnerWorkspaceStatusAction } from "@/app/(dashboard)/actions";

export const metadata = {
  title: "Owner Ministries"
};

export default async function OwnerMinistriesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const params = await searchParams;
  const ministriesPage = await getOwnerMinistriesPage(params);

  return (
    <section className="space-y-4">
      <CinematicSection variant="dark" className="cinematic-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-300">Owner Admin</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Owner Ministries</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Manage ministry workspaces, teams, profiles, events, contacts, and workspace status.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/admin">Back to Owner Dashboard</Link>
          </Button>
        </div>
      </CinematicSection>

      <StatCard icon={Church} title="Ministries found" value={ministriesPage.total} note="Matching the current search." />

      <Card>
        <CardHeader>
          <CardTitle>Ministry list</CardTitle>
          <CardDescription>Open a ministry to view team, profiles, events, and contacts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search ministries..." defaultValue={params.q ?? ""} />
          <OwnerPagination
            page={ministriesPage.page}
            pageCount={ministriesPage.pageCount}
            total={ministriesPage.total}
            visibleCount={ministriesPage.items.length}
            q={params.q}
            pageSize={ministriesPage.pageSize}
          />

          <div className="grid gap-3">
            {ministriesPage.items.map((ministry) => (
              <div key={ministry.church_id} className="cinematic-lift grid gap-3 rounded-lg border bg-white p-4 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr_0.6fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{ministry.church_name}</p>
                    <Badge variant="accent">{ministry.workspace_type === "ministry" ? "Ministry" : "Church"}</Badge>
                    <Badge variant={ministry.workspace_status === "active" ? "success" : "destructive"}>
                      {ministry.workspace_status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Created {new Date(ministry.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="muted">{ministry.team_count} team</Badge>
                <Badge variant="muted">{ministry.event_count} events</Badge>
                <Badge variant="muted">{ministry.contact_count} contacts</Badge>
                <form action={updateOwnerWorkspaceStatusAction}>
                  <input type="hidden" name="churchId" value={ministry.church_id} />
                  <input type="hidden" name="workspaceStatus" value={ministry.workspace_status === "active" ? "inactive" : "active"} />
                  <input type="hidden" name="returnTo" value="/admin/ministries" />
                  <Button type="submit" variant={ministry.workspace_status === "active" ? "destructive" : "outline"} size="sm">
                    {ministry.workspace_status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </form>
                <Button asChild variant="outline">
                  <Link href={`/admin/ministries/${ministry.church_id}`}>
                    <Eye className="h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </div>
            ))}
            {!ministriesPage.items.length ? (
              <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No ministries found.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
