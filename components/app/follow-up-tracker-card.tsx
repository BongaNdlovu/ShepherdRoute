import Link from "next/link";
import { updateContactAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { assignmentRoleLabels, assignmentRoleOptions, statusLabels, statusOptions } from "@/lib/constants";
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
        <CardDescription>
          Assign an in-app representative and choose the church role that should handle this contact.
        </CardDescription>
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
            <Label htmlFor="assignedHandlingRole">Handling role</Label>
            <select
              id="assignedHandlingRole"
              name="assignedHandlingRole"
              defaultValue={contact.assigned_handling_role ?? contact.recommended_assigned_role ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring"
            >
              <option value="">No handling role</option>
              {assignmentRoleOptions.map((role) => (
                <option key={role} value={role}>{assignmentRoleLabels[role]}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              This can be an outside church/ministry role even if that person does not have app access.
            </p>
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
