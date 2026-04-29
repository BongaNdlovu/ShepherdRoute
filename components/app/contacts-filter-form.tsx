import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { interestLabels, interestOptions, statusLabels, statusOptions } from "@/lib/constants";

type ContactsFilterParams = {
  q?: string;
  status?: string;
  interest?: string;
  event?: string;
  assignedTo?: string;
};

type ContactsFilterFormProps = {
  params: ContactsFilterParams;
  events: Array<{ id: string; name: string }>;
  team: Array<{ id: string; display_name: string }>;
};

export function ContactsFilterForm({ params, events, team }: ContactsFilterFormProps) {
  return (
    <form className="grid gap-3 lg:grid-cols-[1fr_170px_170px_190px_190px_auto]">
      <Label className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={params.q} placeholder="Search name, phone, area..." className="pl-9" />
      </Label>
      <input type="hidden" name="page" value="1" />
      <select name="status" defaultValue={params.status ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
        <option value="all">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>{statusLabels[status]}</option>
        ))}
      </select>
      <select name="interest" defaultValue={params.interest ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
        <option value="all">All interests</option>
        {interestOptions.map((interest) => (
          <option key={interest} value={interest}>{interestLabels[interest]}</option>
        ))}
      </select>
      <select name="event" defaultValue={params.event ?? "all"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
        <option value="all">All events</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>{event.name}</option>
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
