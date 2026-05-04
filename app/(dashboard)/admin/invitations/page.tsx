import Link from "next/link";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerAdminMainTabs } from "@/components/app/owner-admin-main-tabs";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { StatCard } from "@/components/app/stat-card";
import { roleLabels } from "@/lib/constants";
import { getOwnerInvitationsPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Invitations",
};

export default async function OwnerInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();

  const params = await searchParams;
  const invitationsPage = await getOwnerInvitationsPage(params);

  const pending = invitationsPage.items.filter((invitation) => invitation.status === "pending").length;
  const accepted = invitationsPage.items.filter((invitation) => invitation.status === "accepted").length;
  const expired = invitationsPage.items.filter((invitation) => invitation.status === "expired").length;

  return (
    <section className="space-y-6">
      <div className="cinematic-fade-up rounded-3xl border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Owner Admin</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Invitations</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Review team account invitations across all churches and ministries.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/admin">Back to overview</Link>
          </Button>
        </div>
      </div>

      <OwnerAdminMainTabs active="invitations" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Mail} title="Invitations found" value={invitationsPage.total} note="Matching the current search." />
        <StatCard icon={Mail} title="Pending" value={pending} note="Pending invitations on this page." />
        <StatCard icon={Mail} title="Accepted" value={accepted} note="Accepted invitations on this page." />
        <StatCard icon={Mail} title="Expired" value={expired} note="Expired invitations on this page." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team account invitations</CardTitle>
          <CardDescription>
            Invitation state across all workspaces, including accepted, revoked, and expired links.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search invitations, email, church, role..." defaultValue={params.q ?? ""} />

          <OwnerPagination
            page={invitationsPage.page}
            pageCount={invitationsPage.pageCount}
            total={invitationsPage.total}
            visibleCount={invitationsPage.items.length}
            q={params.q}
            pageSize={invitationsPage.pageSize}
          />

          <div className="grid gap-3">
            {invitationsPage.items.map((invitation) => (
              <div
                key={invitation.invitation_id}
                className="cinematic-lift grid gap-3 rounded-2xl border bg-white/20 p-4 lg:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.9fr] lg:items-center"
              >
                <div>
                  <p className="font-bold">{invitation.display_name}</p>
                  <p className="text-sm text-muted-foreground">{invitation.church_name}</p>
                </div>

                <p className="truncate text-sm font-semibold">{invitation.email}</p>

                <p className="text-sm font-semibold">
                  {roleLabels[invitation.role as keyof typeof roleLabels] ?? invitation.role}
                </p>

                <Badge variant={invitationStatusVariant(invitation.status)}>{invitation.status}</Badge>

                <div className="text-sm text-muted-foreground">
                  <p>
                    {invitation.accepted_at
                      ? `Accepted ${new Date(invitation.accepted_at).toLocaleDateString()}`
                      : `Expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
                  </p>
                  {invitation.invited_by_name ? <p>Invited by {invitation.invited_by_name}</p> : null}
                  {invitation.accepted_by_name ? <p>Accepted by {invitation.accepted_by_name}</p> : null}
                </div>
              </div>
            ))}

            {!invitationsPage.items.length ? (
              <p className="rounded-lg bg-white/10 p-4 text-sm text-muted-foreground">
                No team account invitations found.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function invitationStatusVariant(status: "pending" | "accepted" | "revoked" | "expired") {
  if (status === "accepted") return "success";
  if (status === "pending") return "warning";
  if (status === "expired") return "muted";
  return "destructive";
}
