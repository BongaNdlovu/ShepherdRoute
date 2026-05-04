import Link from "next/link";
import { BarChart3, Church, ClipboardList, Home, LogOut, QrCode, Settings2, ShieldCheck, UserCog, UserRound, UsersRound } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { switchChurchAction } from "@/app/(dashboard)/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { NavigationHistoryControls } from "@/components/app/navigation-history-controls";
import { InactiveWorkspaceNotice } from "@/components/app/inactive-workspace-notice";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { GeminiChatWidget } from "@/components/app/gemini-chat-widget";
import { roleLabels } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";

const navItems: Array<{ href: string; label: string; description: string; icon: typeof Church }> = [
  { href: "/dashboard", label: "Dashboard", description: "Overview and quick actions", icon: Church },
  { href: "/events", label: "Events & QR codes", description: "Create and manage events", icon: QrCode },
  { href: "/contacts", label: "Visitor contacts", description: "View and manage people", icon: UsersRound },
  { href: "/follow-ups", label: "Follow-up tasks", description: "Work due and completed", icon: ClipboardList },
  { href: "/reports", label: "Reports", description: "Ministry insights and data", icon: BarChart3 },
  { href: "/profile", label: "My profile", description: "Personal settings", icon: UserRound },
  { href: "/settings", label: "Workspace settings", description: "Configure your church or ministry", icon: Settings2 },
  { href: "/settings/team", label: "Team members", description: "Manage roles and invites", icon: UserCog },
  { href: "/settings/health", label: "Health setup", description: "Configure health ministry", icon: Settings2 },
  { href: "/", label: "Product intro", description: "View the public landing page", icon: Home }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getChurchContext();

  const isWorkspaceInactive = context.workspaceStatus === "inactive";
  const canBypassInactiveWorkspace = context.isAppAdmin;

  return (
    <div className="cinematic-shell min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-4 p-3 md:flex-row md:p-6">
        <aside className="surface-card sticky top-6 hidden h-[calc(100dvh-3rem)] w-72 shrink-0 rounded-3xl p-4 lg:flex flex-col">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-primary p-4 text-primary-foreground">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white p-1.5">
              <BrandLogo className="h-full w-full object-contain" priority />
            </div>
            <div>
              <p className="text-xs text-white/60">ShepherdRoute · {context.workspaceLabel}</p>
              <h1 className="text-base font-bold leading-tight">{context.churchName}</h1>
            </div>
          </Link>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {context.memberships.length > 1 ? (
              <form action={switchChurchAction} className="mt-3 grid gap-2 p-3">
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
              <p className="mt-3 p-3 text-sm font-semibold text-slate-700">
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
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="grid min-w-0 leading-tight">
                    <span>{item.label}</span>
                    <span className="mt-0.5 text-xs font-normal text-slate-500">{item.description}</span>
                  </span>
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
              <p className="text-sm font-bold text-amber-950">Workspace care routing ready</p>
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

        <main id="main-content" className="min-w-0 flex-1 space-y-6 overflow-visible">
          <NavigationHistoryControls />
          {isWorkspaceInactive && !canBypassInactiveWorkspace ? (
            <InactiveWorkspaceNotice name={context.churchName} label={context.workspaceLabel} />
          ) : (
            children
          )}
          <footer className="surface-card mt-6 flex flex-col gap-2 rounded-3xl p-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between pb-20 md:pb-4">
            <p>Copyright (c) {new Date().getFullYear()} ShepherdRoute. All rights reserved.</p>
            <div className="flex gap-3">
              <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">Privacy notice</Link>
              <Link href="/copyright" className="font-semibold underline-offset-4 hover:underline">Copyright notice</Link>
            </div>
          </footer>
        </main>
        <MobileBottomNav />
        <GeminiChatWidget />
      </div>
    </div>
  );
}
