import Link from "next/link";
import { CalendarCheck, LogIn, UserPlus } from "lucide-react";
import { acceptEventInvitationAction } from "@/app/event-invitations/accept/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { getEventInvitationPreview } from "@/lib/data-event-invitations";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Event Invitation"
};

export default async function AcceptEventInvitationPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; error?: string; signup?: string }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  const preview = token ? await getEventInvitationPreview(token) : null;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isPending = preview?.status === "pending";
  const acceptPath = `/event-invitations/accept?token=${encodeURIComponent(token)}`;
  const loginHref = `/login?eventInvite=${encodeURIComponent(token)}&next=${encodeURIComponent(acceptPath)}`;
  const signupHref = `/signup?eventInvite=${encodeURIComponent(token)}`;
  const showAcceptButton = Boolean(preview && isPending && user);
  const showAuthButtons = Boolean(preview && isPending && !user);
  const showDashboardButton = Boolean(preview && !isPending);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <CinematicSection>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <BrandLogo className="mx-auto mb-3 h-20 w-auto object-contain" priority />
            <CardTitle className="text-2xl">
              {preview ? `Help with ${preview.event_name}` : "Event Invitation"}
            </CardTitle>
            <CardDescription>
              {preview
                ? `You have been invited to help ${preview.workspace_name} with this event.`
                : "This invitation link could not be found."}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {query.error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {query.error}
              </div>
            ) : null}

            {query.signup ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Check your email if verification is enabled, then return to this invite or log in.
              </div>
            ) : null}

            {preview ? (
              <div className="grid gap-3 rounded-lg border bg-muted p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Invited email</span>
                  <span className="break-all font-semibold">{preview.invitee_email ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Workspace</span>
                  <span className="font-semibold">{preview.workspace_name}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isPending ? "success" : "muted"}>{preview.status}</Badge>
                </div>
                {preview.expires_at ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-semibold">{new Date(preview.expires_at).toLocaleDateString()}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                This invitation is invalid, expired, revoked, or has already been used.
              </div>
            )}

            {showAcceptButton ? (
              <form action={acceptEventInvitationAction}>
                <input type="hidden" name="token" value={token} />
                <Button size="lg" type="submit" className="w-full">
                  <CalendarCheck className="h-4 w-4" />
                  Accept event invitation
                </Button>
              </form>
            ) : null}

            {showAuthButtons ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild size="lg">
                  <Link href={signupHref}>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={loginHref}>
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                </Button>
              </div>
            ) : null}

            {showDashboardButton ? (
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : null}

            {!preview ? (
              <Button asChild size="lg" variant="outline">
                <Link href="/">Return to Home</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </CinematicSection>
    </main>
  );
}
