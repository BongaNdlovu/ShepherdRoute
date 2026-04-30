import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { markFollowUpContactedAction, openSuggestedWhatsappAction } from "@/app/(dashboard)/actions";
import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TodayFollowUpItem } from "@/lib/data-reports";
import { formatDateTime } from "@/lib/followUp";

export function TodaysFollowUpsCard({ items }: { items: TodayFollowUpItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{"Today's Follow-Ups"}</CardTitle>
          <CardDescription>Approve the suggested WhatsApp, open it, then mark the contact as contacted.</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/contacts?status=assigned">View queue</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/contacts/${item.contact_id}`} className="font-bold underline-offset-4 hover:underline">
                      {item.contact.full_name}
                    </Link>
                    <UrgencyBadge urgency={item.contact.urgency} />
                    <StatusBadge status={item.contact.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.contact.event_name ?? "Manual contact"} • Owner: {item.assigned_name ?? "Unassigned"} • Due: {formatDateTime(item.due_at)}
                  </p>
                  <InterestPills interests={item.contact.interests} />
                  {item.next_action ? <p className="text-sm leading-6 text-slate-700">{item.next_action}</p> : null}
                  {item.suggested_message ? (
                    <p className="rounded-md bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">
                      {item.suggested_message.message_text}
                    </p>
                  ) : (
                    <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">No suggested WhatsApp message has been saved yet.</p>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:w-64 lg:grid-cols-1">
                  <form action={openSuggestedWhatsappAction}>
                    <input type="hidden" name="followUpId" value={item.id} />
                    <input type="hidden" name="contactId" value={item.contact_id} />
                    <input type="hidden" name="messageId" value={item.suggested_message?.id ?? ""} />
                    <Button type="submit" variant="success" className="w-full" disabled={!item.suggested_message || item.contact.do_not_contact}>
                      <MessageCircle className="h-4 w-4" />
                      {item.contact.do_not_contact ? "Opted out" : item.suggested_message?.opened_at ? "Open again" : "Approve & open WhatsApp"}
                    </Button>
                  </form>
                  <form action={markFollowUpContactedAction}>
                    <input type="hidden" name="followUpId" value={item.id} />
                    <input type="hidden" name="contactId" value={item.contact_id} />
                    <Button type="submit" variant="outline" className="w-full">
                      <CheckCircle2 className="h-4 w-4" />
                      Mark contacted
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {!items.length ? (
            <p className="rounded-lg border bg-muted p-6 text-center text-sm text-muted-foreground">
              No open follow-ups due today. New contacts will appear here after they are captured.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
