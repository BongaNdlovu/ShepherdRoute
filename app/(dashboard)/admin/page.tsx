import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Church, ClipboardList, KeyRound, Mail, UserRoundX, UsersRound } from "lucide-react";
import { updateOwnerMembershipRoleAction, updateOwnerMembershipStatusAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { roleLabels, roleOptions } from "@/lib/constants";
import { getChurchContext, getOwnerAccountRows, getOwnerChurchSummaries, getOwnerInvitationRows, type OwnerAccountRow } from "@/lib/data";

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
  const accountsByChurch = groupAccountsByChurch(accounts);

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">ShepherdRoute owner admin</h2>
            <p className="mt-1 text-sm text-muted-foreground">SaaS-level workspace and account controls without exposing prayer request contents.</p>
          </div>
          <Button asChild>
            <Link href="/admin/churches">Manage Churches</Link>
          </Button>
        </div>
      </header>

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

      {params.error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
      {params.updated ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Membership access updated.</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Signed-up churches and users</CardTitle>
          <CardDescription>Disable membership for normal suspension. Use Supabase Auth ban/delete only for abuse or permanent removal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {churches.map((church) => {
            const churchAccounts = accountsByChurch.get(church.church_id) ?? [];

            return (
              <div key={church.church_id} className="overflow-hidden rounded-lg border">
                <div className="grid gap-3 bg-muted px-4 py-4 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr_0.6fr] lg:items-center">
                  <div>
                    <p className="font-bold">{church.church_name}</p>
                    <p className="text-sm text-muted-foreground">Created {new Date(church.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-semibold">{church.team_count}</p>
                  <p className="font-semibold">{church.event_count}</p>
                  <p className="font-semibold">{church.contact_count}</p>
                  <p className="font-semibold">{church.new_contact_count}</p>
                </div>

                <div className="hidden grid-cols-[1.2fr_1.2fr_0.9fr_0.7fr_1fr] bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground xl:grid">
                  <span>User</span>
                  <span>Email / ID</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Access</span>
                </div>
                <div className="divide-y bg-white">
                  {churchAccounts.map((account) => (
                    <div key={account.membership_id} className="grid gap-3 px-4 py-4 xl:grid-cols-[1.2fr_1.2fr_0.9fr_0.7fr_1fr] xl:items-center">
                      <div>
                        <p className="font-bold">{account.full_name ?? account.team_member_name ?? "Unnamed user"}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(account.membership_created_at).toLocaleDateString()}
                          {account.team_member_name ? ` - Team: ${account.team_member_name}` : ""}
                        </p>
                        {account.is_protected_owner ? (
                          <Badge variant="success" className="mt-2">Protected owner</Badge>
                        ) : account.app_admin_role ? (
                          <Badge variant="warning" className="mt-2">{account.app_admin_role.replace("_", " ")}</Badge>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{account.email ?? "No email recorded"}</p>
                        <p className="truncate text-xs text-muted-foreground">{account.user_id}</p>
                      </div>
                      <form action={updateOwnerMembershipRoleAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="membershipId" value={account.membership_id} />
                        <select
                          name="role"
                          defaultValue={account.role}
                          disabled={account.is_protected_owner}
                          className="h-9 min-w-36 rounded-md border border-input bg-background px-3 text-sm font-semibold focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>{roleLabels[role]}</option>
                          ))}
                        </select>
                        <Button type="submit" size="sm" variant="outline" disabled={account.is_protected_owner}>
                          Save
                        </Button>
                      </form>
                      <div>
                        <Badge variant={statusVariant(account.status)}>{account.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <form action={updateOwnerMembershipStatusAction}>
                          <input type="hidden" name="membershipId" value={account.membership_id} />
                          <input type="hidden" name="status" value="active" />
                          <Button type="submit" size="sm" variant="outline" disabled={account.status === "active"}>Activate</Button>
                        </form>
                        <form action={updateOwnerMembershipStatusAction}>
                          <input type="hidden" name="membershipId" value={account.membership_id} />
                          <input type="hidden" name="status" value="disabled" />
                          <Button type="submit" size="sm" variant="destructive" disabled={account.status === "disabled" || account.is_protected_owner}>Deactivate</Button>
                        </form>
                      </div>
                    </div>
                  ))}
                  {!churchAccounts.length ? <p className="p-4 text-sm text-muted-foreground">No signed-up users attached to this church.</p> : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team account invitations</CardTitle>
          <CardDescription>Invitation state across all churches, including accepted and expired links.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {invitations.map((invitation) => (
            <div key={invitation.invitation_id} className="grid gap-3 rounded-lg border bg-white p-4 lg:grid-cols-[1.2fr_1fr_0.6fr_0.6fr_0.8fr] lg:items-center">
              <div>
                <p className="font-bold">{invitation.display_name}</p>
                <p className="text-sm text-muted-foreground">{invitation.church_name}</p>
              </div>
              <p className="truncate text-sm font-semibold">{invitation.email}</p>
              <p className="text-sm font-semibold">{roleLabels[invitation.role as keyof typeof roleLabels] ?? invitation.role}</p>
              <Badge variant={invitationStatusVariant(invitation.status)}>{invitation.status}</Badge>
              <p className="text-sm text-muted-foreground">
                {invitation.accepted_at
                  ? `Accepted ${new Date(invitation.accepted_at).toLocaleDateString()}`
                  : `Expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
              </p>
            </div>
          ))}
          {!invitations.length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No team account invitations yet.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team member accounts</CardTitle>
          <CardDescription>How team assignment and login access work today.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-3">
          <p className="rounded-lg bg-muted p-4">
            Adding someone on the Team page makes them assignable for follow-up. It does not create a Supabase Auth login.
          </p>
          <p className="rounded-lg bg-muted p-4">
            To let a team member log in, they need an auth account plus an active `church_memberships` row for the church.
          </p>
          <p className="rounded-lg bg-muted p-4">
            If a person serves another church, send an invite from that church. Once accepted, the sidebar church switcher lets them move between active memberships.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function groupAccountsByChurch(accounts: OwnerAccountRow[]) {
  const grouped = new Map<string, OwnerAccountRow[]>();

  for (const account of accounts) {
    const rows = grouped.get(account.church_id) ?? [];
    rows.push(account);
    grouped.set(account.church_id, rows);
  }

  return grouped;
}

function statusVariant(status: OwnerAccountRow["status"]) {
  if (status === "active") return "success";
  if (status === "disabled") return "destructive";
  return "warning";
}

function invitationStatusVariant(status: "pending" | "accepted" | "revoked" | "expired") {
  if (status === "accepted") return "success";
  if (status === "pending") return "warning";
  if (status === "expired") return "muted";
  return "destructive";
}
