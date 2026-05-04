"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { statusOptions, urgencyOptions } from "@/lib/constants";

type TeamOption = {
  id: string;
  display_name: string;
};

type EventContactsFiltersProps = {
  team: TeamOption[];
  status?: string;
  urgency?: string;
  assignedTo?: string;
};

export function EventContactsFilters({
  team,
  status,
  urgency,
  assignedTo,
}: EventContactsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (!value || value === "all") {
      next.delete(name);
    } else {
      next.set(name, value);
    }

    next.delete("page");

    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="mt-2 flex flex-wrap gap-4">
      <select
        name="status"
        value={status ?? "all"}
        onChange={(event) => updateParam("status", event.target.value)}
        className="h-8 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="all">All Status</option>
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <select
        name="urgency"
        value={urgency ?? "all"}
        onChange={(event) => updateParam("urgency", event.target.value)}
        className="h-8 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="all">All Urgency</option>
        {urgencyOptions.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>

      <select
        name="assignedTo"
        value={assignedTo ?? "all"}
        onChange={(event) => updateParam("assignedTo", event.target.value)}
        className="h-8 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="all">All Assignments</option>
        {team.map((member) => (
          <option key={member.id} value={member.id}>
            {member.display_name}
          </option>
        ))}
      </select>
    </div>
  );
}
