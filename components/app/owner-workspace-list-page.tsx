import Link from "next/link";
import { Church, Eye } from "lucide-react";
import { updateOwnerWorkspaceStatusAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { StatCard } from "@/components/app/stat-card";
import type { OwnerChurchListItem, OwnerPaginatedResult, OwnerPaginationParams } from "@/lib/admin/types";

type OwnerWorkspaceListPageProps = {
  params: OwnerPaginationParams;
  page: OwnerPaginatedResult<OwnerChurchListItem>;
  workspaceLabel: "Church" | "Ministry";
  workspaceLabelPlural: "Churches" | "Ministries";
  routeBase: "/admin/churches" | "/admin/ministries";
  heroDescription: string;
};

export function OwnerWorkspaceListPage({
  params,
  page,
  workspaceLabel,
  workspaceLabelPlural,
  routeBase,
  heroDescription
}: OwnerWorkspaceListPageProps) {
  const lowerPlural = workspaceLabelPlural.toLowerCase();

  return (
    <section className="space-y-4">
      <CinematicSection variant="dark" className="cinematic-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-300">Owner Admin</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Owner {workspaceLabelPlural}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{heroDescription}</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/admin">Back to Owner Dashboard</Link>
          </Button>
        </div>
      </CinematicSection>

      <StatCard icon={Church} title={`${workspaceLabelPlural} found`} value={page.total} note="Matching the current search." />

      <Card>
        <CardHeader>
          <CardTitle>{workspaceLabel} list</CardTitle>
          <CardDescription>Open a {workspaceLabel.toLowerCase()} to view team, profiles, events, and contacts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder={`Search ${lowerPlural}...`} defaultValue={params.q ?? ""} />
          <OwnerPagination
            page={page.page}
            pageCount={page.pageCount}
            total={page.total}
            visibleCount={page.items.length}
            q={params.q}
            pageSize={page.pageSize}
          />

          <div className="grid gap-3">
            {page.items.map((workspace) => (
              <div key={workspace.church_id} className="cinematic-lift grid gap-3 rounded-lg border bg-white/10 p-4 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr_0.6fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{workspace.church_name}</p>
                    <Badge variant="accent">{workspace.workspace_type === "ministry" ? "Ministry" : "Church"}</Badge>
                    <Badge variant={workspace.workspace_status === "active" ? "success" : "destructive"}>
                      {workspace.workspace_status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Created {new Date(workspace.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant="muted">{workspace.team_count} team</Badge>
                <Badge variant="muted">{workspace.event_count} events</Badge>
                <Badge variant="muted">{workspace.contact_count} contacts</Badge>
                <form action={updateOwnerWorkspaceStatusAction}>
                  <input type="hidden" name="churchId" value={workspace.church_id} />
                  <input type="hidden" name="workspaceStatus" value={workspace.workspace_status === "active" ? "inactive" : "active"} />
                  <input type="hidden" name="returnTo" value={routeBase} />
                  <Button type="submit" variant={workspace.workspace_status === "active" ? "destructive" : "outline"} size="sm">
                    {workspace.workspace_status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </form>
                <Button asChild variant="outline">
                  <Link href={`${routeBase}/${workspace.church_id}`}>
                    <Eye className="h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </div>
            ))}
            {!page.items.length ? (
              <p className="rounded-lg bg-white/10 p-4 text-sm text-muted-foreground">No {lowerPlural} found.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
