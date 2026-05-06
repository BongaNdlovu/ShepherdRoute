"use client";

import { useState } from "react";
import { Check, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignmentRoleOptions, statusOptions } from "@/lib/constants";
import { bulkAssignContactsAction } from "@/app/(dashboard)/actions";

type TeamMember = {
  id: string;
  display_name: string;
  role: string;
};

interface BulkContactAssignmentFormProps {
  selectedContactIds: string[];
  team: TeamMember[];
  onClearSelection: () => void;
  returnTo?: string;
}

export function BulkContactAssignmentForm({ selectedContactIds, team, onClearSelection, returnTo = "/contacts" }: BulkContactAssignmentFormProps) {
  const [assignedTo, setAssignedTo] = useState<string>("unassigned");
  const [assignedHandlingRole, setAssignedHandlingRole] = useState<string>("no_change");
  const [status, setStatus] = useState<string>("no_change");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await bulkAssignContactsAction(formData);
      onClearSelection();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (selectedContactIds.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="h-5 w-5 text-amber-600" />
        <p className="font-semibold text-amber-950">
          {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? "s" : ""} selected
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {selectedContactIds.map((id) => (
          <input key={id} type="hidden" name="contactIds" value={id} />
        ))}
        <input type="hidden" name="returnTo" value={returnTo} />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign to</Label>
            <Select name="assignedTo" value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {team.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.display_name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedHandlingRole">Handling role</Label>
            <Select name="assignedHandlingRole" value={assignedHandlingRole} onValueChange={setAssignedHandlingRole}>
              <SelectTrigger id="assignedHandlingRole">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                {assignmentRoleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Assigning..." : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Assign {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
