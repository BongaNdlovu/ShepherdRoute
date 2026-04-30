import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { statusLabels, statusOptions } from "@/lib/constants";
import type { FollowUpQueueFilters } from "@/lib/data-follow-ups";

const dueStateLabels = {
  open_due: "Open due/overdue",
  overdue: "Overdue",
  due_today: "Due today",
  upcoming: "Upcoming",
  completed: "Completed",
  all: "All"
};

export function FollowUpsFilterForm({
  params,
  team
}: {
  params: FollowUpQueueFilters;
  team: Array<{ id: string; display_name: string }>;
}) {
  return (
    <form className="grid gap-3 lg:grid-cols-[1fr_180px_170px_190px_auto]">
      <Label className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={params.q} placeholder="Search contact, phone, note, event..." className="pl-9" />
      </Label>
      <input type="hidden" name="page" value="1" />
      <select name="dueState" defaultValue={params.dueState ?? "open_due"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
        {Object.entries(dueStateLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select name="status" defaultValue={params.status ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
        <option value="all">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>{statusLabels[status]}</option>
        ))}
      </select>
      <select name="assignedTo" defaultValue={params.assignedTo ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
        <option value="all">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {team.map((member) => (
          <option key={member.id} value={member.id}>{member.display_name}</option>
        ))}
      </select>
      <Button type="submit">Apply</Button>
    </form>
  );
}
