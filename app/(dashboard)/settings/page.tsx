import Link from "next/link";
import { AlertTriangle, Bell, Church, Settings2, ShieldCheck, UserCog } from "lucide-react";
import { updateAccountSettingsAction } from "@/app/(dashboard)/actions";
import { resetContactDataAction } from "@/app/(dashboard)/_actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getChurchContext, getUserProfileSettings } from "@/lib/data";
import { normalizeAccountPreferences } from "@/lib/data-profile";

export const metadata = {
  title: "Settings"
};

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const profile = await getUserProfileSettings(context.userId);
  const preferences = normalizeAccountPreferences(profile?.preferences);
  const canManageChurch = ["admin", "pastor"].includes(context.role) || context.isAppAdmin;
  const isAdmin = context.role === "admin" || context.isAppAdmin;

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage simple account preferences and church setup links.</p>
      </header>

      {params.error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
      {params.updated ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Settings updated.</p> : null}
      {params.reset === "success" ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Contact data has been reset successfully.</p> : null}

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

          {isAdmin ? (
            <Card className="border-rose-200 bg-rose-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-700"><AlertTriangle className="h-5 w-5" /> Data management</CardTitle>
                <CardDescription className="text-rose-600">Danger zone: These actions permanently affect your church&apos;s data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-rose-200 bg-white p-4">
                  <h3 className="font-semibold text-slate-900">Reset contact data</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Permanently delete all contacts, follow-ups, messages, and related data for this church. This action cannot be undone.
                  </p>
                  <form action={resetContactDataAction} className="mt-4 space-y-3">
                    <div className="grid gap-2">
                      <Label htmlFor="confirmation" className="text-sm">Type <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">RESET_CONTACT_DATA</code> to confirm</Label>
                      <Input
                        id="confirmation"
                        name="confirmation"
                        type="text"
                        placeholder="RESET_CONTACT_DATA"
                        required
                        className="border-rose-200 focus-visible:ring-rose-500"
                      />
                    </div>
                    <Button type="submit" variant="destructive" size="sm">
                      Reset all contact data
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
