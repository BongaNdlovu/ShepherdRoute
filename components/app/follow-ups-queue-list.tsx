import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { openSuggestedWhatsappAction } from "@/app/(dashboard)/actions";
import { ConversationOngoingConfirmForm } from "@/components/app/conversation-ongoing-confirm-form";
import { MarkContactedConfirmForm } from "@/components/app/mark-contacted-confirm-form";
import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import type { FollowUpQueueItem } from "@/lib/data-follow-ups";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/followUp";

export function FollowUpsQueueList({
  items,
  compactLists = false,
  returnTo = "/follow-ups"
}: {
  items: FollowUpQueueItem[];
  compactLists?: boolean;
  returnTo?: string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border">
      <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.1fr] bg-slate-50/70 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground xl:grid">
        <span>Contact</span>
        <span>Care path</span>
        <span>Due / owner</span>
        <span>Actions</span>
      </div>
      <div className="divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "grid transition hover:bg-amber-50 xl:grid-cols-[1.2fr_1fr_1fr_1.1fr] xl:items-start",
              compactLists ? "gap-2 px-3 py-2" : "gap-4 px-4 py-4"
            )}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/contacts/${item.contact_id}`} className="font-bold underline-offset-4 hover:underline">
                  {item.contact.full_name}
                </Link>
                <UrgencyBadge urgency={item.contact.urgency} />
                {item.contact.do_not_contact ? <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-bold text-slate-700">Do not contact</span> : null}
              </div>
              <p className={cn(compactLists ? "mt-0.5 text-xs" : "mt-1 text-sm", "text-muted-foreground")}>
                {item.contact.phone}{item.contact.email ? ` - ${item.contact.email}` : ""}{item.contact.area ? ` - ${item.contact.area}` : ""}
              </p>
              <p className={cn(compactLists ? "mt-0.5" : "mt-1", "text-xs text-muted-foreground")}>{item.contact.event_name ?? "Manual contact"}</p>
            </div>

            <div className={cn(compactLists ? "space-y-1" : "space-y-2")}>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={item.status} />
                <StatusBadge status={item.contact.status} />
              </div>
              <InterestPills interests={item.contact.interests} />
              {item.next_action ? <p className="text-sm leading-6 text-slate-700">{item.next_action}</p> : null}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">{formatDateTime(item.due_at)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Owner: {item.assigned_name ?? "Unassigned"}</p>
              {item.completed_at ? <p className="mt-1 text-xs text-muted-foreground">Completed: {formatDateTime(item.completed_at)}</p> : null}
            </div>

            <div className={cn("grid", compactLists ? "gap-1.5" : "gap-2")}>
              <form action={openSuggestedWhatsappAction}>
                <input type="hidden" name="followUpId" value={item.id} />
                <input type="hidden" name="contactId" value={item.contact_id} />
                <input type="hidden" name="messageId" value={item.suggested_message?.id ?? ""} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Button type="submit" variant="success" size="sm" className="w-full" disabled={item.contact.do_not_contact}>
                  <MessageCircle className="h-4 w-4" />
                  {item.contact.do_not_contact ? "Opted out" : item.suggested_message?.opened_at ? "Open WhatsApp again" : "Open WhatsApp"}
                </Button>
              </form>
              <ConversationOngoingConfirmForm
                followUpId={item.id}
                contactId={item.contact_id}
                returnTo={returnTo}
                disabled={Boolean(item.completed_at) || item.status === "waiting"}
              />
              <MarkContactedConfirmForm
                followUpId={item.id}
                contactId={item.contact_id}
                returnTo={returnTo}
                disabled={Boolean(item.completed_at)}
              />
            </div>
          </div>
        ))}
        {!items.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No follow-ups match this queue view.</p>
        ) : null}
      </div>
    </div>
  );
}
