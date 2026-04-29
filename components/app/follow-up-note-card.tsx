import { PlusCircle } from "lucide-react";
import { addFollowUpNoteAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { followUpChannelLabels, followUpChannelOptions, statusLabels, statusOptions } from "@/lib/constants";
import type { ContactDetailResult } from "@/lib/data";

type FollowUpNoteCardProps = {
  contact: ContactDetailResult["contact"];
  team: ContactDetailResult["team"];
};

export function FollowUpNoteCard({ contact, team }: FollowUpNoteCardProps) {
  return (
    <Card className="xl:col-start-2 xl:sticky xl:top-[460px] xl:self-start">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Log follow-up note
        </CardTitle>
        <CardDescription>Record calls, WhatsApps, visits, next action, and due date.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={addFollowUpNoteAction} className="grid gap-4">
          <input type="hidden" name="contactId" value={contact.id} />
          <div className="grid gap-2">
            <Label htmlFor="noteAssignedTo">Assign to</Label>
            <select id="noteAssignedTo" name="assignedTo" defaultValue={contact.assigned_to ?? "unassigned"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="unassigned">Unassigned</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>{member.display_name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="channel">Channel</Label>
              <select id="channel" name="channel" defaultValue="whatsapp" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                {followUpChannelOptions.map((channel) => (
                  <option key={channel} value={channel}>{followUpChannelLabels[channel]}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="noteStatus">Status</Label>
              <select id="noteStatus" name="status" defaultValue={contact.status} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="What happened in the follow-up?" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nextAction">Next action</Label>
            <Textarea id="nextAction" name="nextAction" placeholder="What should happen next?" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dueAt">Due date</Label>
            <input id="dueAt" name="dueAt" type="datetime-local" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring" />
          </div>
          <label className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-semibold">
            <input type="checkbox" name="markComplete" className="h-4 w-4" />
            Mark this follow-up as completed
          </label>
          <Button type="submit">Save note</Button>
        </form>
      </CardContent>
    </Card>
  );
}
