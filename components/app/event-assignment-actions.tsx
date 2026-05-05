"use client";

import { useState } from "react";
import { ShieldBan, ShieldCheck, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventPermissionSelector } from "@/components/app/event-permission-selector";
import { updateEventAssignmentPermissions, revokeEventAssignment } from "@/app/(dashboard)/_actions/event-assignments";
import type { EventAssignmentPermissions } from "@/lib/event-permission-presets";

export function EventAssignmentActions({
  assignmentId,
  eventId,
  initialPermissions,
  revoked,
}: {
  assignmentId: string;
  eventId: string;
  initialPermissions: Partial<EventAssignmentPermissions>;
  revoked: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [permissions, setPermissions] = useState<Partial<EventAssignmentPermissions>>(initialPermissions);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  async function handleUpdatePermissions() {
    setIsUpdating(true);
    try {
      await updateEventAssignmentPermissions({
        assignmentId,
        eventId,
        permissions,
      });
      setEditOpen(false);
    } catch (error) {
      console.error("Failed to update permissions:", error);
      alert(error instanceof Error ? error.message : "Failed to update permissions");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRevoke() {
    if (!confirm("Are you sure you want to revoke this assignment?")) {
      return;
    }
    setIsRevoking(true);
    try {
      await revokeEventAssignment({ assignmentId, eventId });
    } catch (error) {
      console.error("Failed to revoke assignment:", error);
      alert(error instanceof Error ? error.message : "Failed to revoke assignment");
    } finally {
      setIsRevoking(false);
    }
  }

  if (revoked) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldBan className="h-4 w-4" />
        <span>Revoked</span>
      </div>
    );
  }

  if (editOpen) {
    return (
      <div className="space-y-4">
        <EventPermissionSelector
          value={permissions as EventAssignmentPermissions}
          onChange={setPermissions}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleUpdatePermissions} disabled={isUpdating}>
            <Check className="h-4 w-4 mr-2" />
            {isUpdating ? "Updating..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <ShieldCheck className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={isRevoking}>
        <ShieldBan className="h-4 w-4 mr-2" />
        {isRevoking ? "Revoking..." : "Revoke"}
      </Button>
    </div>
  );
}
