import Link from "next/link";
import { notFound } from "next/navigation";
import { Church, LogIn, UserPlus } from "lucide-react";
import { acceptTeamInvitationAction } from "@/app/invite/[token]/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roleLabels } from "@/lib/constants";
import { getTeamInvitationPreview } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Team Invitation"
};

export default async function InvitePage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; signup?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const [preview, supabase] = await Promise.all([
    getTeamInvitationPreview(token),
    createClient()
  ]);

  if (!preview) {
    notFound();
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const signupHref = `/signup?invite=${encodeURIComponent(token)}`;
  const loginHref = `/login?invite=${encodeURIComponent(token)}`;
  const isPending = preview.status === "pending";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <BrandLogo className="mx-auto mb-3 h-20 w-auto object-contain" priority />
          <CardTitle className="text-2xl">Join {preview.church_name}</CardTitle>
          <CardDescription>{preview.display_name} has been invited to ShepherdRoute.</CardDescription>
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

          <div className="grid gap-3 rounded-lg border bg-muted p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Invited email</span>
              <span className="font-semibold">{preview.email}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Role</span>
              <span className="font-semibold">{roleLabels[preview.role as keyof typeof roleLabels] ?? preview.role}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={isPending ? "success" : "muted"}>{preview.status}</Badge>
            </div>
          </div>

          {isPending && user ? (
            <form action={acceptTeamInvitationAction}>
              <input type="hidden" name="token" value={token} />
              <Button size="lg" type="submit" className="w-full">
                <Church className="h-4 w-4" />
                Accept invitation
              </Button>
            </form>
          ) : null}

          {isPending && !user ? (
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

          {!isPending ? (
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
