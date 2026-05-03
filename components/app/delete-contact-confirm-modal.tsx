"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type DeleteContactConfirmModalProps = {
  contactId: string;
  contactName: string;
  onConfirm: (contactId: string) => void;
};

export function DeleteContactConfirmModal({ contactId, contactName, onConfirm }: DeleteContactConfirmModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const confirmed = window.confirm(
      `Delete this contact? This will remove ${contactName} from active records, follow-up views, reports, and exports. This action cannot be undone.`
    );

    if (confirmed) {
      startTransition(() => {
        onConfirm(contactId);
      });
    }
  };

  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
