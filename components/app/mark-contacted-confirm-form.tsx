"use client";

import { CheckCircle2 } from "lucide-react";
import { markFollowUpContactedAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

export function MarkContactedConfirmForm({
  followUpId,
  contactId,
  disabled = false,
  size = "sm"
}: {
  followUpId: string;
  contactId: string;
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  return (
    <form
      action={markFollowUpContactedAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Mark this follow-up as contacted? Only continue if you actually contacted the person."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="followUpId" value={followUpId} />
      <input type="hidden" name="contactId" value={contactId} />
      <Button type="submit" variant="outline" size={size} className="w-full" disabled={disabled}>
        <CheckCircle2 className="h-4 w-4" />
        Mark contacted
      </Button>
    </form>
  );
}
