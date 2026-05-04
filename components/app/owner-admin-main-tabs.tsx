import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Overview", key: "overview" },
  { href: "/admin/churches", label: "Churches", key: "churches" },
  { href: "/admin/ministries", label: "Ministries", key: "ministries" },
  { href: "/admin/users", label: "Users", key: "users" },
  { href: "/admin/invitations", label: "Invitations", key: "invitations" },
] as const;

export function OwnerAdminMainTabs({
  active,
}: {
  active: "overview" | "churches" | "ministries" | "users" | "invitations";
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-white/60 bg-white/55 p-2 shadow-sm backdrop-blur">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            active === tab.key
              ? "bg-primary text-primary-foreground"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
