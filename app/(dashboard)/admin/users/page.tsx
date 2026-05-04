import Link from "next/link";
import { UsersRound } from "lucide-react";
import { updateOwnerMembershipRoleAction, updateOwnerMembershipStatusAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminMainTabs } from "@/components/app/owner-admin-main-tabs";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { StatCard } from "@/components/app/stat-card";
import { roleLabels, roleOptions } from "@/lib/constants";
import { getOwnerAccountsPage, type OwnerAccountRow } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Users",
};

export default async function OwnerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; error?: string; updated?: string }>;
}) {
  await requireOwnerAdmin();

  const params = await searchParams;
  const accountsPage = await getOwnerAccountsPage(params);

  const activeAccounts = accountsPage.items.filter((account) => account.status === "active").length;
  const disabledAccounts = accountsPage.items.filter((account) => account.status === "disabled").length;

  return (
    <section className="space-y-6">
      <div className="cinematic-fade-up rounded-3xl border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Owner Admin</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Users</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage signed-up user access, roles, and membership status across all workspaces.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/admin">Back to overview</Link>
          </Button>
        </div>
      </div>

      <OwnerAdminMainTabs active="users" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={UsersRound} title="Users found" value={accountsPage.total} note="Matching the current search." />
        <StatCard icon={UsersRound} title="Visible active users" value={activeAccounts} note="Active users on this page." />
        <StatCard icon={UsersRound} title="Visible disabled users" value={disabledAccounts} note="Disabled users on this page." />
      </div>

      {params.error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
      {params.updated ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Membership access updated.</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Signed-up users</CardTitle>
          <CardDescription>
            Disable membership for normal suspension. Use Supabase Auth ban/delete only for abuse or permanent removal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search users, email, church, role..." defaultValue={params.q ?? ""} />

          <OwnerPagination
            page={accountsPage.page}
            pageCount={accountsPage.pageCount}
            total={accountsPage.total}
            visibleCount={accountsPage.items.length}
            q={params.q}
            pageSize={accountsPage.pageSize}
          />

          <div className="overflow-hidden rounded-2xl border">
            <div className="hidden grid-cols-[1.2fr_1.1fr_1fr_0.9fr_0.7fr_1fr] bg-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground xl:grid">
              <span>User</span>
              <span>Workspace</span>
              <span>Email / ID</span>
              <span>Role</span>
              <span>Status</span>
              <span>Access</span>
            </div>

            <div className="divide-y bg-white/20">
              {accountsPage.items.map((account) => (
                <div
                  key={account.membership_id}
                  className="grid gap-3 px-4 py-4 xl:grid-cols-[1.2fr_1.1fr_1fr_0.9fr_0.7fr_1fr] xl:items-center"
                >
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

                  <div>
                    <p className="font-semibold">{account.church_name}</p>
                    <p className="text-xs text-muted-foreground">{account.church_id}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{account.email ?? "No email recorded"}</p>
                    <p className="truncate text-xs text-muted-foreground">{account.user_id}</p>
                  </div>

                  <form action={updateOwnerMembershipRoleAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="membershipId" value={account.membership_id} />
                    <input type="hidden" name="returnTo" value="/admin/users" />
                    <select
                      name="role"
                      defaultValue={account.role}
                      disabled={account.is_protected_owner}
                      className="h-9 min-w-36 rounded-md border border-input bg-background px-3 text-sm font-semibold focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
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
                      <input type="hidden" name="returnTo" value="/admin/users" />
                      <Button type="submit" size="sm" variant="outline" disabled={account.status === "active"}>
                        Activate
                      </Button>
                    </form>

                    <form action={updateOwnerMembershipStatusAction}>
                      <input type="hidden" name="membershipId" value={account.membership_id} />
                      <input type="hidden" name="status" value="disabled" />
                      <input type="hidden" name="returnTo" value="/admin/users" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="destructive"
                        disabled={account.status === "disabled" || account.is_protected_owner}
                      >
                        Deactivate
                      </Button>
                    </form>
                  </div>
                </div>
              ))}

              {!accountsPage.items.length ? (
                <p className="p-4 text-sm text-muted-foreground">No users found.</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function statusVariant(status: OwnerAccountRow["status"]) {
  if (status === "active") return "success";
  if (status === "disabled") return "destructive";
  return "warning";
}
