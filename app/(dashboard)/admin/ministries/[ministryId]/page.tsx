import Link from "next/link";
import { CalendarClock, ClipboardList, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminTabs } from "@/components/app/owner-admin-tabs";
import { StatCard } from "@/components/app/stat-card";
import { getOwnerChurchDetail } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";
import { updateOwnerWorkspaceStatusAction, updateOwnerWorkspaceTypeAction } from "@/app/(dashboard)/actions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Owner Ministry Detail"
};

export default async function OwnerMinistryDetailPage({
  params
}: {
  params: Promise<{ ministryId: string }>;
}) {
  await requireOwnerAdmin();
  const { ministryId } = await params;
  const ministry = await getOwnerChurchDetail(ministryId);

  if (!ministry) {
    notFound();
  }

  if (ministry.workspace_type !== 'ministry') {
    notFound();
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white/10 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Owner ministry view</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">{ministry.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ministry.workspace_type === "ministry" ? "Ministry" : "Church"} · {ministry.workspace_status === "active" ? "Active" : "Inactive"} · Created {new Date(ministry.created_at).toLocaleDateString()} · Timezone {ministry.timezone}
            </p>
            {ministry.status_change_reason ? (
              <p className="mt-1 text-sm text-muted-foreground">Reason: {ministry.status_change_reason}</p>
            ) : null}
          </div>
          <form action={updateOwnerWorkspaceTypeAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="churchId" value={ministry.id} />
            <input type="hidden" name="returnTo" value={`/admin/ministries/${ministry.id}`} />
            <select name="workspaceType" defaultValue={ministry.workspace_type} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="church">Church</option>
              <option value="ministry">Ministry</option>
            </select>
            <Button type="submit" variant="outline">Update type</Button>
          </form>
        </div>
      </header>

      <OwnerAdminTabs workspaceId={ministry.id} basePath="/admin/ministries" active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} title="Profiles" value={ministry.profile_count} note="Login memberships." />
        <StatCard icon={UsersRound} title="Team" value={ministry.team_count} note="Assignable workers." />
        <StatCard icon={CalendarClock} title="Events" value={ministry.event_count} note="Registration pages." />
        <StatCard icon={ClipboardList} title="Contacts" value={ministry.contact_count} note="Visitor records." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace status</CardTitle>
          <CardDescription>Activate or deactivate this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateOwnerWorkspaceStatusAction} className="grid gap-2 surface-panel rounded-2xl p-3">
            <input type="hidden" name="churchId" value={ministry.id} />
            <input type="hidden" name="workspaceStatus" value={ministry.workspace_status === "active" ? "inactive" : "active"} />
            <input type="hidden" name="returnTo" value={`/admin/ministries/${ministry.id}`} />
            <textarea
              name="reason"
              placeholder="Optional reason for this status change"
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm focus-ring"
            />
            <Button type="submit" variant={ministry.workspace_status === "active" ? "destructive" : "outline"}>
              {ministry.workspace_status === "active" ? "Deactivate workspace" : "Activate workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick access</CardTitle>
          <CardDescription>Open each area without loading unnecessary data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Button asChild variant="outline"><Link href={`/admin/ministries/${ministry.id}/team`}>Team</Link></Button>
          <Button asChild variant="outline"><Link href={`/admin/ministries/${ministry.id}/profiles`}>Profiles</Link></Button>
          <Button asChild variant="outline"><Link href={`/admin/ministries/${ministry.id}/events`}>Events</Link></Button>
          <Button asChild variant="outline"><Link href={`/admin/ministries/${ministry.id}/contacts`}>Contacts</Link></Button>
        </CardContent>
      </Card>
    </section>
  );
}
