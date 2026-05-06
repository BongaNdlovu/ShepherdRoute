"use client";

import { useMemo, useState } from "react";
import { Archive, Ban, CheckSquare, Trash2, X } from "lucide-react";
import { bulkUpdateContactsLifecycleAction } from "@/app/(dashboard)/actions";
import { BulkContactAssignmentForm } from "@/components/app/bulk-contact-assignment-form";
import { ContactList } from "@/components/app/contact-list";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ContactListItem } from "@/lib/data";

type ContactBulkActionsProps = {
  churchName: string;
  contacts: ContactListItem[];
  team: Array<{ id: string; display_name: string; role: string }>;
  compactLists?: boolean;
  canManageContacts: boolean;
  returnTo?: string;
};

export function ContactBulkActions({
  churchName,
  contacts,
  team,
  compactLists = false,
  canManageContacts,
  returnTo = "/contacts"
}: ContactBulkActionsProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const selectedCount = selectedContactIds.length;
  const allVisibleSelected = contacts.length > 0 && selectedCount === contacts.length;

  const selectedContacts = useMemo(
    () => contacts.filter((contact) => selectedContactIds.includes(contact.id)),
    [contacts, selectedContactIds]
  );

  function toggleContact(contactId: string) {
    setSelectedContactIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId]
    );
  }

  function toggleAllVisible() {
    setSelectedContactIds(allVisibleSelected ? [] : contacts.map((contact) => contact.id));
  }

  function clearSelection() {
    setSelectedContactIds([]);
  }

  function confirmLifecycle(intent: "do_not_contact" | "archive" | "delete") {
    const names = selectedContacts.slice(0, 3).map((contact) => contact.full_name).join(", ");
    const suffix = selectedCount > 3 ? ` and ${selectedCount - 3} more` : "";
    const target = `${selectedCount} contact${selectedCount === 1 ? "" : "s"}${names ? ` (${names}${suffix})` : ""}`;

    if (intent === "delete") {
      return window.confirm(`Delete ${target}? This soft-deletes them from active views and marks them do not contact.`);
    }

    if (intent === "archive") {
      return window.confirm(`Archive ${target}? They will leave active contact lists and keep their history.`);
    }

    return window.confirm(`Mark ${target} as do not contact?`);
  }

  return (
    <div className="space-y-4">
      {canManageContacts ? (
        <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleAllVisible}
                aria-label="Select all visible contacts"
              />
              Select all visible contacts
            </label>
            {selectedCount > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </div>

          {selectedCount > 0 ? (
            <div className="mt-4 space-y-3">
              <BulkContactAssignmentForm
                selectedContactIds={selectedContactIds}
                team={team}
                onClearSelection={clearSelection}
                returnTo={returnTo}
              />

              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                <form action={bulkUpdateContactsLifecycleAction} onSubmit={(event) => {
                  if (!confirmLifecycle("do_not_contact")) event.preventDefault();
                }}>
                  <input type="hidden" name="intent" value="do_not_contact" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  {selectedContactIds.map((id) => (
                    <input key={id} type="hidden" name="contactIds" value={id} />
                  ))}
                  <Button type="submit" variant="outline" className="w-full">
                    <Ban className="h-4 w-4" />
                    Do not contact
                  </Button>
                </form>

                <form action={bulkUpdateContactsLifecycleAction} onSubmit={(event) => {
                  if (!confirmLifecycle("archive")) event.preventDefault();
                }}>
                  <input type="hidden" name="intent" value="archive" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  {selectedContactIds.map((id) => (
                    <input key={id} type="hidden" name="contactIds" value={id} />
                  ))}
                  <Button type="submit" variant="outline" className="w-full">
                    <Archive className="h-4 w-4" />
                    Archive selected
                  </Button>
                </form>

                <form action={bulkUpdateContactsLifecycleAction} onSubmit={(event) => {
                  if (!confirmLifecycle("delete")) event.preventDefault();
                }}>
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  {selectedContactIds.map((id) => (
                    <input key={id} type="hidden" name="contactIds" value={id} />
                  ))}
                  <Button type="submit" variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4" />
                    Delete selected
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckSquare className="h-4 w-4" />
              Select contacts to reveal bulk actions.
            </p>
          )}
        </div>
      ) : null}

      <ContactList
        churchName={churchName}
        contacts={contacts}
        team={team}
        compactLists={compactLists}
        canManageContacts={canManageContacts}
        selectedContactIds={selectedContactIds}
        onToggleSelection={canManageContacts ? toggleContact : undefined}
      />
    </div>
  );
}
