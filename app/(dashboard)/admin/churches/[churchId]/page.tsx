import Link from "next/link";
import { CalendarClock, ClipboardList, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminTabs } from "@/components/app/owner-admin-tabs";
import { StatCard } from "@/components/app/stat-card";
import { getOwnerChurchDetail } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Church Detail"
};

export default async function OwnerChurchDetailPage({
  params
}: {
  params: Promise<{ churchId: string }>;
}) {
  await requireOwnerAdmin();
  const { churchId } = await params;
  const church = await getOwnerChurchDetail(churchId);

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Owner church view</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">{church.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Created {new Date(church.created_at).toLocaleDateString()} · Timezone {church.timezone}
        </p>
      </header>

      <OwnerAdminTabs churchId={church.id} active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} title="Profiles" value={church.profile_count} note="Login memberships." />
        <StatCard icon={UsersRound} title="Team" value={church.team_count} note="Assignable workers." />
        <StatCard icon={CalendarClock} title="Events" value={church.event_count} note="Registration pages." />
        <StatCard icon={ClipboardList} title="Contacts" value={church.contact_count} note="Visitor records." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick access</CardTitle>
          <CardDescription>Open each area without loading unnecessary data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Button asChild variant="outline"><Link href={`/admin/churches/${church.id}/team`}>Team</Link></Button>
          <Button asChild variant="outline"><Link href={`/admin/churches/${church.id}/profiles`}>Profiles</Link></Button>
          <Button asChild variant="outline"><Link href={`/admin/churches/${church.id}/events`}>Events</Link></Button>
          <Button asChild variant="outline"><Link href={`/admin/churches/${church.id}/contacts`}>Contacts</Link></Button>
        </CardContent>
      </Card>
    </section>
  );
}
