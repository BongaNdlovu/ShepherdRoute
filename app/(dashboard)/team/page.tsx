import { CheckCircle2, Mail, UserPlus, XCircle } from "lucide-react";
import { addTeamMemberAction, revokeTeamInvitationAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabels, roleOptions } from "@/lib/constants";
import { getChurchContext, getTeamInvitations, getTeamMembers } from "@/lib/data";
import { absoluteUrl, initials } from "@/lib/utils";

export const metadata = {
  title: "Team"
};

export default async function TeamPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const [team, invitations] = await Promise.all([
    getTeamMembers(context.churchId),
    getTeamInvitations(context.churchId)
  ]);
  const inviteUrl = params.invite ? absoluteUrl(`/invite/${params.invite}`) : null;
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Church team</CardTitle>
            <CardDescription>Add assignable workers now, then invite login access only when they need to use the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {team.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted font-black text-slate-700">
                      {initials(member.display_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{member.display_name}</p>
                      <p className="text-sm text-muted-foreground">{roleLabels[member.role as keyof typeof roleLabels]}</p>
                      {member.email || member.phone ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {[member.email, member.phone].filter(Boolean).join(" - ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid justify-items-end gap-2">
                    <Badge variant={member.is_active ? "success" : "muted"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {member.membership_id ? <Badge variant="info">Login</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending account invites
            </CardTitle>
            <CardDescription>Invite links are single-use, expire after 14 days, and connect the user to this church when accepted.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-bold">{invitation.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {invitation.email} - {roleLabels[invitation.role as keyof typeof roleLabels]} - Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <form action={revokeTeamInvitationAction}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <Button type="submit" size="sm" variant="outline">
                    <XCircle className="h-4 w-4" />
                    Revoke
                  </Button>
                </form>
              </div>
            ))}
            {!pendingInvitations.length ? (
              <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No pending account invitations.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="xl:sticky xl:top-6 xl:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add team member
          </CardTitle>
          <CardDescription>Leave login access off for volunteers who only need to be assigned follow-up tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {params.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
          {inviteUrl ? (
            <div className="mb-4 grid gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-bold text-emerald-800">Invite link ready</p>
              <Input readOnly value={inviteUrl} className="bg-white font-mono text-xs" />
            </div>
          ) : null}
          <form action={addTeamMemberAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" name="displayName" placeholder="Bible Worker Rachel" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" name="role" defaultValue="bible_worker" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{roleLabels[role]}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="+27 72 000 0000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="rachel@example.com" />
            </div>
            <label className="flex items-start gap-3 rounded-lg border bg-muted p-3 text-sm font-semibold">
              <input name="inviteLogin" type="checkbox" className="mt-1 h-4 w-4 rounded border-input" />
              <span>Invite to create a login account</span>
            </label>
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4" />
              Add to team
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
