import Link from "next/link";
import { Bell, Church, Settings2, ShieldCheck, UserCog } from "lucide-react";
import { updateAccountSettingsAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getChurchContext, getUserProfileSettings } from "@/lib/data";
import { normalizeAccountPreferences } from "@/lib/data-profile";

export const metadata = {
  title: "Settings"
};

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const profile = await getUserProfileSettings(context.userId);
  const preferences = normalizeAccountPreferences(profile?.preferences);
  const canManageChurch = ["admin", "pastor"].includes(context.role) || context.isAppAdmin;

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage simple account preferences and church setup links.</p>
      </header>

      {params.error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
      {params.updated ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Settings updated.</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Account preferences</CardTitle>
            <CardDescription>These preferences change your own ShepherdRoute workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateAccountSettingsAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="defaultDashboardView">Default working area</Label>
                <select id="defaultDashboardView" name="defaultDashboardView" defaultValue={preferences.defaultDashboardView ?? "dashboard"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                  <option value="dashboard">Dashboard</option>
                  <option value="follow-ups">Follow-up queue</option>
                  <option value="contacts">Contacts</option>
                  <option value="reports">Reports</option>
                </select>
              </div>
              <label className="flex items-start gap-3 rounded-lg border bg-muted p-3 text-sm font-semibold">
                <input name="compactLists" type="checkbox" defaultChecked={Boolean(preferences.compactLists)} className="mt-1 h-4 w-4 rounded border-input" />
                <span>Prefer compact list layouts where available</span>
              </label>
              <div className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <Bell className="h-4 w-4" />
                  Notifications
                </div>
                <p className="mt-1 leading-6">
                  Email notifications and automated WhatsApp reminders need a delivery provider before they can be enabled.
                </p>
              </div>
              <Button type="submit">Save settings</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Church className="h-5 w-5" /> Church workspace</CardTitle>
              <CardDescription>{context.churchName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start"><Link href="/profile">Profile</Link></Button>
              {canManageChurch ? <Button asChild variant="outline" className="justify-start"><Link href="/settings/team"><UserCog className="h-4 w-4" /> Team settings</Link></Button> : null}
              {canManageChurch ? <Button asChild variant="outline" className="justify-start"><Link href="/settings/health"><Settings2 className="h-4 w-4" /> Setup health</Link></Button> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Privacy and security</CardTitle>
              <CardDescription>Security-sensitive account changes are intentionally limited in this release.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Your login email is managed by Supabase Auth and is read-only in ShepherdRoute for now.</p>
              <p>Church roles are managed by authorized church leaders or the ShepherdRoute owner.</p>
              <p>Prayer request visibility is protected by role-based access rules.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
