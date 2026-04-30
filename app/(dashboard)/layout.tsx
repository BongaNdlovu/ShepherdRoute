import Link from "next/link";
import { BarChart3, Church, ClipboardList, LogOut, QrCode, Settings2, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { switchChurchAction } from "@/app/(dashboard)/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";

const navItems: Array<{ href: string; label: string; icon: typeof Church }> = [
  { href: "/dashboard", label: "Dashboard", icon: Church },
  { href: "/events", label: "Events", icon: QrCode },
  { href: "/contacts", label: "Contacts", icon: UsersRound },
  { href: "/follow-ups", label: "Follow-ups", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings/team", label: "Team", icon: UserCog },
  { href: "/settings/health", label: "Setup", icon: Settings2 }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getChurchContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3 md:flex-row md:p-6">
        <aside className="flex flex-col rounded-lg border bg-white p-4 shadow-sm md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-72 md:overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-primary p-4 text-primary-foreground">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white p-1.5">
              <BrandLogo className="h-full w-full object-contain" priority />
            </div>
            <div>
              <p className="text-xs text-white/60">ShepherdRoute</p>
              <h1 className="text-base font-bold leading-tight">{context.churchName}</h1>
            </div>
          </Link>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {context.memberships.length > 1 ? (
              <form action={switchChurchAction} className="mt-3 grid gap-2 rounded-lg border bg-muted p-3">
                <label htmlFor="churchId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Workspace
                </label>
                <select
                  id="churchId"
                  name="churchId"
                  defaultValue={context.churchId}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold focus-ring"
                >
                  {context.memberships.map((membership) => (
                    <option key={membership.churchId} value={membership.churchId}>
                      {membership.churchName}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="outline" className="justify-start">
                  <Church className="h-4 w-4" />
                  Switch church
                </Button>
              </form>
            ) : (
              <p className="mt-3 rounded-lg border bg-muted p-3 text-sm font-semibold text-slate-700">
                {roleLabels[context.role as keyof typeof roleLabels] ?? context.role}
              </p>
            )}

            <nav className="mt-5 grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-amber-100 hover:text-amber-950"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              {context.isAppAdmin ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-amber-100 hover:text-amber-950"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Owner admin
                </Link>
              ) : null}
            </nav>

            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-950">Care routing ready</p>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                Prayer requests are stored separately from contact details and can be protected by role.
              </p>
            </div>
          </div>

          <form action={logoutAction} className="mt-4 border-t pt-4">
            <Button variant="outline" className="w-full justify-start" type="submit" aria-label="Log out">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </aside>

        <main className="min-w-0 flex-1">
          {children}
          <footer className="mt-6 flex flex-col gap-2 rounded-lg border bg-white p-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright (c) {new Date().getFullYear()} ShepherdRoute. All rights reserved.</p>
            <div className="flex gap-3">
              <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">Privacy notice</Link>
              <Link href="/copyright" className="font-semibold underline-offset-4 hover:underline">Copyright notice</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
