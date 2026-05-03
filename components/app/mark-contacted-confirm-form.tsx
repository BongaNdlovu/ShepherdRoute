"use client";

import { CheckCircle2 } from "lucide-react";
import { markFollowUpContactedAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/app/pending-submit-button";

export function MarkContactedConfirmForm({
  followUpId,
  contactId,
  returnTo,
  disabled = false,
  size = "sm"
}: {
  followUpId: string;
  contactId: string;
  returnTo: string;
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
      <input type="hidden" name="returnTo" value={returnTo} />
      <PendingSubmitButton type="submit" variant="outline" size={size} className="w-full" disabled={disabled} pendingText="Marking...">
        <CheckCircle2 className="h-4 w-4" />
        Mark contacted
      </PendingSubmitButton>
    </form>
  );
}
