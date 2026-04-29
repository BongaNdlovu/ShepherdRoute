import Link from "next/link";
import { updateContactAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { statusLabels, statusOptions } from "@/lib/constants";
import type { ContactDetailResult } from "@/lib/data";

type FollowUpTrackerCardProps = {
  contact: ContactDetailResult["contact"];
  team: ContactDetailResult["team"];
};

export function FollowUpTrackerCard({ contact, team }: FollowUpTrackerCardProps) {
  return (
    <Card className="xl:sticky xl:top-6 xl:self-start">
      <CardHeader>
        <CardTitle>Follow-up tracker</CardTitle>
        <CardDescription>Assign ownership and move the contact through the pathway.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateContactAction} className="grid gap-4">
          <input type="hidden" name="contactId" value={contact.id} />
          <div className="grid gap-2">
            <Label htmlFor="assignedTo">Assign to</Label>
            <select id="assignedTo" name="assignedTo" defaultValue={contact.assigned_to ?? "unassigned"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="unassigned">Unassigned</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>{member.display_name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" defaultValue={contact.status} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              {statusOptions.map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </div>
          <Button type="submit">Save follow-up</Button>
          <Button asChild variant="outline">
            <Link href="/contacts">Back to contacts</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
