import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Church, ClipboardList, KeyRound, Mail, UserRoundX, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminMainTabs } from "@/components/app/owner-admin-main-tabs";
import { StatCard } from "@/components/app/stat-card";
import { getChurchContext, getOwnerAccountRows, getOwnerChurchSummaries, getOwnerInvitationRows } from "@/lib/data";

export const metadata = {
  title: "Owner Admin"
};

export default async function OwnerAdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();

  if (!context.isAppAdmin) {
    notFound();
  }

  const [churches, accounts, invitations] = await Promise.all([
    getOwnerChurchSummaries(),
    getOwnerAccountRows(),
    getOwnerInvitationRows()
  ]);
  const totalEvents = churches.reduce((sum, church) => sum + Number(church.event_count), 0);
  const totalContacts = churches.reduce((sum, church) => sum + Number(church.contact_count), 0);
  const totalTeam = churches.reduce((sum, church) => sum + Number(church.team_count), 0);
  const activeAccounts = accounts.filter((account) => account.status === "active").length;
  const disabledAccounts = accounts.filter((account) => account.status === "disabled").length;
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending").length;

  return (
    <section className="space-y-6">
      <div className="cinematic-fade-up">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">ShepherdRoute owner admin</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              SaaS-level workspace and account controls without exposing prayer request contents.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/churches">Manage Churches</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/ministries">Manage Ministries</Link>
            </Button>
          </div>
        </div>
      </div>

      <OwnerAdminMainTabs active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Church} title="Churches" value={churches.length} note="Registered church workspaces." />
        <StatCard icon={UsersRound} title="Active accounts" value={activeAccounts} note="Users with dashboard access." />
        <StatCard icon={UserRoundX} title="Disabled accounts" value={disabledAccounts} note="Users blocked at membership level." />
        <StatCard icon={Building2} title="Team members" value={totalTeam} note="Assignable ministry workers." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} title="Events" value={totalEvents} note="Events created across all churches." />
        <StatCard icon={UsersRound} title="Contacts" value={totalContacts} note="Aggregate visitor registrations." />
        <StatCard icon={KeyRound} title="Memberships" value={accounts.length} note="Signed-up user access rows." />
        <StatCard icon={Mail} title="Pending invites" value={pendingInvitations} note="Team account invitations awaiting acceptance." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Owner admin areas</CardTitle>
          <CardDescription>Choose the area you want to manage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Button asChild variant="outline"><Link href="/admin/churches">Manage Churches</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/ministries">Manage Ministries</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/users">Manage Users</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/invitations">View Invitations</Link></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team member accounts</CardTitle>
          <CardDescription>How team assignment and login access work today.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-3">
          <p className="rounded-lg bg-white/10 p-4">
            Adding someone on the Team page makes them assignable for follow-up. It does not create a Supabase Auth login.
          </p>
          <p className="rounded-lg bg-white/10 p-4">
            To let a team member log in, they need an auth account plus an active `church_memberships` row for the church.
          </p>
          <p className="rounded-lg bg-white/10 p-4">
            If a person serves another church, send an invite from that church. Once accepted, the sidebar church switcher lets them move between active memberships.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

