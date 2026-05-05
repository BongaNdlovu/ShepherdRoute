"use client";

import Link from "next/link";
import { MessageCircle, Check } from "lucide-react";
import { updateContactAction, updateContactLifecycleAction } from "@/app/(dashboard)/actions";
import { DeleteContactConfirmForm } from "@/components/app/delete-contact-confirm-form";
import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { statusLabels, statusOptions, contactMethodLabels, assignmentRoleLabels, assignmentRoleOptions } from "@/lib/constants";
import type { ContactListItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import { generateMessage, createWhatsappLink } from "@/lib/whatsapp";

type ContactListProps = {
  churchName: string;
  contacts: ContactListItem[];
  team: Array<{ id: string; display_name: string }>;
  compactLists?: boolean;
  canManageContacts?: boolean;
  selectedContactIds?: string[];
  onToggleSelection?: (contactId: string) => void;
};

export function ContactList({ churchName, contacts, team, compactLists = false, canManageContacts = false, selectedContactIds = [], onToggleSelection }: ContactListProps) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
      <div className={cn(
        "hidden bg-slate-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground xl:grid",
        onToggleSelection ? "grid-cols-[auto_1.15fr_1fr_1.1fr_1.2fr]" : "grid-cols-[1.15fr_1fr_1.1fr_1.2fr]"
      )}>
        {onToggleSelection ? <span></span> : null}
        <span>Contact</span>
        <span>Interest</span>
        <span>Pathway</span>
        <span>Quick actions</span>
      </div>
      <div className="divide-y divide-border/70">
        {contacts.map((contact) => {
          const message = generateMessage({
            name: contact.full_name,
            phone: contact.phone,
            interests: contact.interests,
            churchName,
            eventName: contact.event_name
          });
          const isSelected = selectedContactIds.includes(contact.id);

          return (
            <div
              key={contact.id}
              className={cn(
                "grid transition-colors hover:bg-accent/5 xl:items-center",
                onToggleSelection ? "xl:grid-cols-[auto_1.15fr_1fr_1.1fr_1.2fr]" : "xl:grid-cols-[1.15fr_1fr_1.1fr_1.2fr]",
                compactLists ? "gap-2 px-3 py-2" : "gap-4 px-4 py-4",
                isSelected ? "bg-amber-50" : ""
              )}
            >
              {onToggleSelection ? (
                <div className="flex items-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection(contact.id)}
                    aria-label={`Select ${contact.full_name}`}
                  />
                </div>
              ) : null}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/contacts/${contact.id}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
                    {contact.full_name}
                  </Link>
                  <UrgencyBadge urgency={contact.urgency} />
                  {contact.do_not_contact ? <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">Do not contact</span> : null}
                  {contact.duplicate_of_contact_id ? <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">Journey match</span> : null}
                  {isSelected ? <Check className="h-4 w-4 text-amber-600" /> : null}
                </div>
                <p className={cn(compactLists ? "mt-0.5 text-xs" : "mt-1 text-sm", "text-muted-foreground")}>{contact.phone ?? "No phone"}{contact.email ? ` - ${contact.email}` : ""}{contact.area ? ` - ${contact.area}` : ""}</p>
                <p className={cn(compactLists ? "mt-0.5" : "mt-1", "text-xs text-muted-foreground")}>
                  {contact.event_name ?? "Manual contact"}
                  {contact.best_time_to_contact ? ` - ${contact.best_time_to_contact}` : ""}
                </p>
                {contact.preferred_contact_methods && contact.preferred_contact_methods.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {contact.preferred_contact_methods.map((method: string) => (
                      <span key={method} className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                        {contactMethodLabels[method as keyof typeof contactMethodLabels] ?? method}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={cn(compactLists ? "mt-0.5" : "mt-1", "text-xs text-muted-foreground")}>No contact preference recorded</p>
                )}
              </div>
              <InterestPills interests={contact.interests} />
              <div className={cn(compactLists ? "space-y-1" : "space-y-2")}>
                <StatusBadge status={contact.status} />
                <p className="text-sm font-medium text-foreground">
                  {contact.assigned_handling_role
                    ? assignmentRoleLabels[contact.assigned_handling_role as keyof typeof assignmentRoleLabels] ?? contact.assigned_handling_role
                    : contact.assigned_name ?? "Unassigned"}
                </p>
                {contact.assigned_handling_role && contact.assigned_name ? (
                  <p className="text-xs text-muted-foreground">
                    Assigned to: {contact.assigned_name}
                  </p>
                ) : null}
                {contact.recommended_assigned_role && contact.recommended_assigned_role !== contact.assigned_handling_role ? (
                  <p className="text-xs text-muted-foreground">
                    Recommended: {assignmentRoleLabels[contact.recommended_assigned_role as keyof typeof assignmentRoleLabels] ?? contact.recommended_assigned_role}
                  </p>
                ) : null}
              </div>
              <div className={cn("grid", compactLists ? "gap-1.5" : "gap-2")}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={updateContactAction} className="flex gap-2">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="status" value={contact.status} />
                    <input type="hidden" name="assignedHandlingRole" value={contact.assigned_handling_role ?? ""} />
                    <select name="assignedTo" defaultValue={contact.assigned_to ?? "unassigned"} className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-ring">
                      <option value="unassigned">Unassigned</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>{member.display_name}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">Assign</Button>
                  </form>
                  <form action={updateContactAction} className="flex gap-2">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="assignedTo" value={contact.assigned_to ?? "unassigned"} />
                    <select name="assignedHandlingRole" defaultValue={contact.assigned_handling_role ?? ""} className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-ring">
                      <option value="">No role</option>
                      {assignmentRoleOptions.map((role) => (
                        <option key={role} value={role}>{assignmentRoleLabels[role]}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">Set Role</Button>
                  </form>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={updateContactAction} className="flex gap-2">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="assignedTo" value={contact.assigned_to ?? "unassigned"} />
                    <input type="hidden" name="assignedHandlingRole" value={contact.assigned_handling_role ?? ""} />
                    <select name="status" defaultValue={contact.status} className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-ring">
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{statusLabels[status]}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">Save Status</Button>
                  </form>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/contacts/${contact.id}`}>Open detail</Link>
                  </Button>
                  {contact.phone ? (
                    <Button asChild size="sm" variant={contact.do_not_contact ? "outline" : "success"}>
                      <a href={contact.do_not_contact ? `/contacts/${contact.id}` : createWhatsappLink(contact.phone, message) ?? `/contacts/${contact.id}`} target={contact.do_not_contact ? undefined : "_blank"} rel={contact.do_not_contact ? undefined : "noreferrer"}>
                        <MessageCircle className="h-4 w-4" />
                        {contact.do_not_contact ? "Opted out" : "WhatsApp"}
                      </a>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" disabled>
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        No phone
                      </span>
                    </Button>
                  )}
                </div>
                {canManageContacts ? (
                  <DeleteContactConfirmForm
                    contactId={contact.id}
                    contactName={contact.full_name}
                    action={updateContactLifecycleAction}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
        {!contacts.length ? <p className="p-8 text-center text-sm text-muted-foreground">No contacts match this view yet.</p> : null}
      </div>
    </div>
  );
}
