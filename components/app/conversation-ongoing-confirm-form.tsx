"use client";

import { MessageSquareMore } from "lucide-react";
import { markFollowUpWaitingAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/app/pending-submit-button";

export function ConversationOngoingConfirmForm({
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
      action={markFollowUpWaitingAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Mark this conversation as ongoing? This keeps the follow-up open and sets it to waiting for reply."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="followUpId" value={followUpId} />
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <PendingSubmitButton type="submit" variant="secondary" size={size} className="w-full" disabled={disabled} pendingText="Updating...">
        <MessageSquareMore className="h-4 w-4" />
        Conversation ongoing
      </PendingSubmitButton>
    </form>
  );
}
