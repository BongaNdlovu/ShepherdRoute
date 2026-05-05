import { createHash } from "node:crypto";
import { CheckCircle2, Mail, UserPlus, XCircle } from "lucide-react";
import { addTeamMemberAction, revokeTeamInvitationAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { InlineHelp } from "@/components/app/inline-help";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabels, roleOptions, appRoleLabels, appRoleOptions, type AppRole, type TeamRole } from "@/lib/constants";
import { getChurchContext, getTeamInvitations, getTeamMembers } from "@/lib/data";
import { gmailComposeUrl, mailtoUrl, workspaceInviteTemplate } from "@/lib/invite-email";
import { canManageTeam } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
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
  const inviteEmail = params.invite
    ? await getWorkspaceInviteEmailDraft(params.invite, context.fullName || "A team member")
    : null;
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");
  const userCanManageTeam = canManageTeam(context.role as TeamRole, context.appRole as AppRole | null);

  return (
    <DashboardShell
      title={`${context.workspaceLabel} team`}
      description="Add assignable workers now, then invite login access only when they need to use the dashboard."
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="grid gap-3 md:grid-cols-2">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-accent/5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 font-semibold text-foreground">
                        {initials(member.display_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{member.display_name}</p>
                        <p className="text-sm text-muted-foreground">{roleLabels[member.role as keyof typeof roleLabels]}</p>
                        {member.app_role ? (
                          <p className="text-xs text-muted-foreground">App: {appRoleLabels[member.app_role as keyof typeof appRoleLabels] ?? member.app_role}</p>
                        ) : null}
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
                      {member.membership_id ? <Badge variant="accent">Login</Badge> : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role guide</CardTitle>
              <CardDescription>Choose roles based on ministry responsibilities and access needs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InlineHelp>
                <strong>Admin:</strong> Full access. Can manage settings, team members, and all data.
              </InlineHelp>
              <InlineHelp>
                <strong>Pastor:</strong> Full access. Can manage settings, team members, and all data.
              </InlineHelp>
              <InlineHelp>
                <strong>Elder:</strong> Can view and manage contacts, events, and follow-ups. Cannot manage team or settings.
              </InlineHelp>
              <InlineHelp>
                <strong>Bible Worker:</strong> Can view and manage contacts, events, and follow-ups. Cannot manage team or settings.
              </InlineHelp>
              <InlineHelp>
                <strong>Health Leader:</strong> Can view and manage contacts, events, and follow-ups. Cannot manage team or settings.
              </InlineHelp>
              <InlineHelp>
                <strong>Prayer Team:</strong> Can view and manage contacts, events, and follow-ups. Cannot manage team or settings.
              </InlineHelp>
              <InlineHelp>
                <strong>Youth Leader:</strong> Can view and manage contacts, events, and follow-ups. Cannot manage team or settings.
              </InlineHelp>
              <InlineHelp>
                <strong>Viewer:</strong> Read-only access to contacts, events, and follow-ups. Cannot make changes or manage team.
              </InlineHelp>
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
                <div key={invitation.id} className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 md:grid-cols-[1fr_auto] md:items-center transition-colors hover:bg-accent/5">
                  <div>
                    <p className="font-semibold text-foreground">{invitation.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.email} - {roleLabels[invitation.role as keyof typeof roleLabels]} - Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {userCanManageTeam ? (
                    <form action={revokeTeamInvitationAction}>
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <Button type="submit" size="sm" variant="outline">
                        <XCircle className="h-4 w-4" />
                        Revoke
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
              {!pendingInvitations.length ? (
                <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No pending account invitations.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {userCanManageTeam ? (
        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add team member
            </CardTitle>
            <CardDescription>Leave login access off for volunteers who only need to be assigned follow-up tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            {params.error ? <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p> : null}
            {inviteUrl ? (
              <div className="mb-4 grid gap-2 rounded-xl border border-success/20 bg-success/10 p-3">
                <p className="text-sm font-semibold text-success">Invite link ready</p>
                <Input readOnly value={inviteUrl} className="bg-background font-mono text-xs" />
                {inviteEmail ? (
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={inviteEmail.gmailUrl} target="_blank" rel="noreferrer">
                        <Mail className="h-4 w-4" />
                        Open Gmail draft
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={inviteEmail.emailUrl}>
                        <Mail className="h-4 w-4" />
                        Open email draft
                      </a>
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <form action={addTeamMemberAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Name</Label>
                <Input id="displayName" name="displayName" placeholder="Bible Worker Rachel" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Church role</Label>
                <select id="role" name="role" defaultValue="bible_worker" className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="appRole">App role (optional)</Label>
                <select id="appRole" name="appRole" defaultValue="" className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Auto-detect from church role</option>
                  {appRoleOptions.map((role) => (
                    <option key={role} value={role}>{appRoleLabels[role]}</option>
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
              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/50 p-3 text-sm font-medium transition hover:bg-accent/5">
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
        ) : (
          <Card className="xl:sticky xl:top-6 xl:self-start">
            <CardHeader>
              <CardTitle>Team management restricted</CardTitle>
              <CardDescription>Only admins and pastors can add members, invite login access, or revoke pending invitations.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You can still view the team roster and use assigned contact workflows available to your role.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
      </CinematicSection>
    </DashboardShell>
  );
}

async function getWorkspaceInviteEmailDraft(token: string, inviterName: string) {
  const supabase = await createClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("email, churches(name)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  const churches = invitation?.churches as { name: string }[] | null | undefined;
  const workspaceName = churches?.[0]?.name;

  if (!invitation?.email || !workspaceName) {
    return null;
  }

  const inviteLink = absoluteUrl(`/invite/${token}`);
  const { subject, body } = workspaceInviteTemplate({
    workspaceName,
    inviterName,
    inviteLink
  });

  return {
    gmailUrl: gmailComposeUrl({ to: invitation.email, subject, body }),
    emailUrl: mailtoUrl({ to: invitation.email, subject, body })
  };
}
