"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersRound, Clock, UserCheck, BarChart3, Settings, LayoutTemplate } from "lucide-react";

interface EventWorkspaceTabsProps {
  eventId: string;
}

export function EventWorkspaceTabs({ eventId }: EventWorkspaceTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { href: `/events/${eventId}`, label: "Overview", icon: LayoutTemplate },
    { href: `/events/${eventId}/contacts`, label: "Contacts", icon: UsersRound },
    { href: `/events/${eventId}/follow-ups`, label: "Follow-ups", icon: Clock },
    { href: `/events/${eventId}/team`, label: "Team", icon: UserCheck },
    { href: `/events/${eventId}/reports`, label: "Reports", icon: BarChart3 },
    { href: `/events/${eventId}/customize`, label: "Form & QR", icon: LayoutTemplate },
    { href: `/events/${eventId}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <nav className="border-b">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== `/events/${eventId}`);
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
