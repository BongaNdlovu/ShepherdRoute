import Link from "next/link";
import { BarChart3, Church, ClipboardList, LogOut, QrCode, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getChurchContext } from "@/lib/data";

const navItems: Array<{ href: string; label: string; icon: typeof Church }> = [
  { href: "/dashboard", label: "Dashboard", icon: Church },
  { href: "/events", label: "Events", icon: QrCode },
  { href: "/contacts", label: "Contacts", icon: UsersRound },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings/team", label: "Team", icon: UserCog }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getChurchContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3 md:flex-row md:p-6">
        <aside className="rounded-lg border bg-white p-4 shadow-sm md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-72">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-primary p-4 text-primary-foreground">
            <div className="rounded-md bg-white/10 p-3">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-white/60">ShepardRoute</p>
              <h1 className="text-base font-bold leading-tight">{context.churchName}</h1>
            </div>
          </Link>

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

          <form action={logoutAction} className="mt-6">
            <Button variant="outline" className="w-full justify-start" type="submit">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
