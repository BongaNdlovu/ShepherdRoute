import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { updateContactAction } from "@/app/(dashboard)/actions";
import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { statusLabels, statusOptions } from "@/lib/constants";
import type { ContactListItem } from "@/lib/data";
import { generateMessage, waLink } from "@/lib/whatsapp";

type ContactListProps = {
  churchName: string;
  contacts: ContactListItem[];
  team: Array<{ id: string; display_name: string }>;
};

export function ContactList({ churchName, contacts, team }: ContactListProps) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border">
      <div className="hidden grid-cols-[1.15fr_1fr_1.1fr_1.2fr] bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground xl:grid">
        <span>Contact</span>
        <span>Interest</span>
        <span>Pathway</span>
        <span>Quick actions</span>
      </div>
      <div className="divide-y">
        {contacts.map((contact) => {
          const message = generateMessage({
            name: contact.full_name,
            phone: contact.phone,
            interests: contact.interests,
            churchName,
            eventName: contact.event_name
          });

          return (
            <div
              key={contact.id}
              className="grid gap-4 px-4 py-4 transition hover:bg-amber-50 xl:grid-cols-[1.15fr_1fr_1.1fr_1.2fr] xl:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/contacts/${contact.id}`} className="font-bold underline-offset-4 hover:underline">
                    {contact.full_name}
                  </Link>
                  <UrgencyBadge urgency={contact.urgency} />
                  {contact.do_not_contact ? <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-bold text-slate-700">Do not contact</span> : null}
                  {contact.duplicate_of_contact_id ? <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Journey match</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{contact.phone} {contact.email ? `- ${contact.email}` : ""} {contact.area ? `- ${contact.area}` : ""}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {contact.event_name ?? "Manual contact"}
                  {contact.best_time_to_contact ? ` - ${contact.best_time_to_contact}` : ""}
                </p>
              </div>
              <InterestPills interests={contact.interests} />
              <div className="space-y-2">
                <StatusBadge status={contact.status} />
                <p className="text-sm font-semibold text-slate-600">{contact.assigned_name ?? "Unassigned"}</p>
              </div>
              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={updateContactAction} className="flex gap-2">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="status" value={contact.status} />
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
                    <select name="status" defaultValue={contact.status} className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-ring">
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{statusLabels[status]}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">Save</Button>
                  </form>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/contacts/${contact.id}`}>Open detail</Link>
                  </Button>
                  <Button asChild size="sm" variant={contact.do_not_contact ? "outline" : "success"}>
                    <a href={contact.do_not_contact ? `/contacts/${contact.id}` : waLink(contact.phone, message)} target={contact.do_not_contact ? undefined : "_blank"} rel={contact.do_not_contact ? undefined : "noreferrer"}>
                      <MessageCircle className="h-4 w-4" />
                      {contact.do_not_contact ? "Opted out" : "WhatsApp"}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {!contacts.length ? <p className="p-8 text-center text-sm text-muted-foreground">No contacts match this view yet.</p> : null}
      </div>
    </div>
  );
}
