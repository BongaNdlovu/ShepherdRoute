import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { saveGeneratedMessageAction, updateContactAction } from "@/app/(dashboard)/actions";
import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { statusLabels, statusOptions } from "@/lib/constants";
import { getChurchContext, getContact } from "@/lib/data";
import { generateMessage } from "@/lib/whatsapp";

export const metadata = {
  title: "Contact Detail"
};

export default async function ContactDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getChurchContext();
  const { contact, prayer, team, followUps, messages } = await getContact(context.churchId, id);
  const interests = contact.contact_interests ?? [];
  const assignedMember = Array.isArray(contact.team_members) ? contact.team_members[0] : contact.team_members;
  const message = generateMessage({
    name: contact.full_name,
    phone: contact.phone,
    interests: interests.map((item: { interest: never }) => item.interest),
    churchName: context.churchName,
    eventName: contact.events?.name
  });

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl">{contact.full_name}</CardTitle>
              <CardDescription>{contact.events?.name ?? "Manual contact"} - {contact.phone}</CardDescription>
            </div>
            <div className="flex gap-2">
              <UrgencyBadge urgency={contact.urgency} />
              <StatusBadge status={contact.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <InterestPills interests={interests} />
          <div className="grid gap-4 rounded-lg bg-muted p-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Area</p>
              <p className="mt-1 font-semibold">{contact.area ?? "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Language</p>
              <p className="mt-1 font-semibold">{contact.language ?? "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Best time</p>
              <p className="mt-1 font-semibold">{contact.best_time_to_contact ?? "No preference"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned to</p>
              <p className="mt-1 font-semibold">{assignedMember?.display_name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consent</p>
              <p className="mt-1 font-semibold">{contact.consent_given ? "Given" : "Missing"}</p>
            </div>
          </div>

          <Card className="border-emerald-100 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-950">
                <MessageCircle className="h-5 w-5" />
                WhatsApp follow-up
              </CardTitle>
              <CardDescription className="text-emerald-900/75">Generated from selected interest tags.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-emerald-950">{message}</p>
              <form action={saveGeneratedMessageAction} className="mt-4">
                <input type="hidden" name="contactId" value={contact.id} />
                <input type="hidden" name="phone" value={contact.phone} />
                <input type="hidden" name="message" value={message} />
                <Button type="submit" variant="success" className="w-full">Save and open in WhatsApp</Button>
              </form>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-bold">Prayer requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">Kept outside the general contact table for tighter future access control.</p>
            <div className="mt-3 grid gap-2">
              {prayer.map((request) => (
                <div key={request.created_at} className="rounded-lg border bg-white p-3 text-sm leading-6">
                  {request.request_text}
                </div>
              ))}
              {!prayer.length ? <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">No prayer request recorded.</p> : null}
            </div>
          </div>

          <div>
            <h3 className="font-bold">Follow-up history</h3>
            <div className="mt-3 grid gap-2">
              {followUps.map((item) => {
                const assigned = Array.isArray(item.team_members) ? item.team_members[0] : item.team_members;
                return (
                  <div key={item.id} className="rounded-lg border bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{item.channel} - {item.status}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    {assigned?.display_name ? <p className="mt-1 text-muted-foreground">Assigned to {assigned.display_name}</p> : null}
                    {item.notes ? <p className="mt-2 leading-6">{item.notes}</p> : null}
                    {item.next_action ? <p className="mt-2 text-muted-foreground">Next: {item.next_action}</p> : null}
                  </div>
                );
              })}
              {!followUps.length ? <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">No follow-up activity yet.</p> : null}
            </div>
          </div>

          <div>
            <h3 className="font-bold">Generated messages</h3>
            <div className="mt-3 grid gap-2">
              {messages.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg border bg-white p-3 text-sm leading-6">
                  {item.message_text}
                </div>
              ))}
              {!messages.length ? <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">No generated messages saved yet. The current WhatsApp text is generated live.</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-6 xl:self-start">
        <CardHeader>
          <CardTitle>Follow-up tracker</CardTitle>
          <CardDescription>Assign ownership and move the contact through the pathway.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateContactAction} className="grid gap-4">
            <input type="hidden" name="contactId" value={contact.id} />
            <div className="grid gap-2">
              <Label htmlFor="assignedTo">Assign to</Label>
              <select id="assignedTo" name="assignedTo" defaultValue={contact.assigned_to ?? "unassigned"} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                <option value="unassigned">Unassigned</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>{member.display_name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={contact.status} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </div>
            <Button type="submit">Save follow-up</Button>
            <Button asChild variant="outline">
              <Link href="/contacts">Back to contacts</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
