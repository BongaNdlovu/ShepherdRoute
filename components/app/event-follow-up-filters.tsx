"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TeamOption = {
  id: string;
  display_name: string;
};

type EventFollowUpFiltersProps = {
  team: TeamOption[];
  status?: string;
  assignedTo?: string;
};

export function EventFollowUpFilters({
  team,
  status,
  assignedTo,
}: EventFollowUpFiltersProps) {
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
        <option value="overdue">Overdue</option>
        <option value="today">Due Today</option>
        <option value="upcoming">Upcoming</option>
        <option value="completed">Completed</option>
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
