import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/team", label: "Team" },
  { href: "/profiles", label: "Profiles" },
  { href: "/events", label: "Events" },
  { href: "/contacts", label: "Contacts" }
];

export function OwnerAdminTabs({ churchId, active }: { churchId: string; active: "overview" | "team" | "profiles" | "events" | "contacts" }) {
  const activeMap = {
    overview: "",
    team: "/team",
    profiles: "/profiles",
    events: "/events",
    contacts: "/contacts"
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-2 shadow-sm">
      {tabs.map((tab) => {
        const isActive = activeMap[active] === tab.href;
        return (
          <Link
            key={tab.href || "overview"}
            href={`/admin/churches/${churchId}${tab.href}`}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold transition",
              isActive ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-muted"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
