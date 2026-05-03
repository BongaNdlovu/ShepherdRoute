import { UserRound } from "lucide-react";
import { updateProfileAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabels } from "@/lib/constants";
import { getChurchContext, getUserProfileSettings } from "@/lib/data";

export const metadata = {
  title: "Profile"
};

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const profile = await getUserProfileSettings(context.userId);

  if (!profile) {
    return null;
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-3 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Your profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manage your personal details used across ShepherdRoute.</p>
          </div>
        </div>
      </header>

      {params.error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
      {params.updated ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Profile updated.</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Your email is managed by your login account and is shown here for reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" defaultValue={profile.full_name} autoComplete="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" value={profile.email ?? ""} readOnly className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email changes should be handled through account authentication settings in a future release.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="+27 72 000 0000" autoComplete="tel" />
              </div>
              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{context.workspaceLabel} access</CardTitle>
            <CardDescription>Your roles are managed by {context.workspaceLabel.toLowerCase()} admins, pastors, or the ShepherdRoute owner.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {profile.memberships.map((membership) => (
              <div key={membership.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{membership.church_name}</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[membership.role as keyof typeof roleLabels] ?? membership.role}</p>
                  </div>
                  <Badge variant={membership.status === "active" ? "success" : "muted"}>{membership.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
