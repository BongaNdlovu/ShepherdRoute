"use client";

import type { ComponentProps } from "react";
import { Trash2 } from "lucide-react";
import { PendingSubmitButton } from "@/components/app/pending-submit-button";

export function DeleteContactConfirmForm({
  contactId,
  contactName,
  action
}: {
  contactId: string;
  contactName: string;
  action: ComponentProps<"form">["action"];
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete this contact? This will remove ${contactName} from active contact lists, follow-up workflows, reports, and exports. This action cannot be undone.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="intent" value="delete" />
      <PendingSubmitButton type="submit" size="sm" variant="destructive" className="w-full" pendingText="Deleting...">
        <Trash2 className="h-4 w-4" />
        Delete
      </PendingSubmitButton>
    </form>
  );
}
