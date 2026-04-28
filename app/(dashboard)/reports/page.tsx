import { BarChart3, ClipboardList, Heart, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { getChurchContext, getContacts, getEvents } from "@/lib/data";

export const metadata = {
  title: "Reports"
};

export default async function ReportsPage() {
  const context = await getChurchContext();
  const [contacts, events] = await Promise.all([
    getContacts(context.churchId, {}),
    getEvents(context.churchId)
  ]);

  const followedUp = contacts.filter((contact) => contact.status !== "new").length;
  const bibleStudies = contacts.filter((contact) =>
    (contact.contact_interests ?? []).some((item: { interest: string }) => item.interest === "bible_study")
  ).length;
  const prayer = contacts.filter((contact) =>
    (contact.contact_interests ?? []).some((item: { interest: string }) => item.interest === "prayer")
  ).length;
  const pastoral = contacts.filter((contact) => contact.urgency === "high").length;

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight">Outreach report</h2>
        <p className="mt-1 text-sm text-muted-foreground">Board-ready summary for pastors, elders, health ministries, and personal ministries.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BarChart3} title="Total contacts" value={contacts.length} note="Across all recorded events." />
        <StatCard icon={UserCheck} title="Followed up" value={followedUp} note="Contacts no longer in new status." />
        <StatCard icon={ClipboardList} title="Bible study leads" value={bibleStudies} note="Ready for study pathway." />
        <StatCard icon={Heart} title="Prayer care" value={prayer} note="Prayer team and pastoral support." />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Event performance</CardTitle>
            <CardDescription>Use this to see which outreach channels need more team support.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-lg border">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-bold">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.event_type}</p>
                  </div>
                  <p className="text-2xl font-black">{event.contacts?.[0]?.count ?? 0}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ministry summary</CardTitle>
            <CardDescription>Prepared for future AI classification without requiring AI in v1.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="leading-7 text-slate-700">
              The current outreach pipeline has {contacts.length} contacts, with {bibleStudies} Bible study lead{bibleStudies === 1 ? "" : "s"}, {prayer} prayer care request{prayer === 1 ? "" : "s"}, and {pastoral} high-priority pastoral case{pastoral === 1 ? "" : "s"}. Assign new contacts within 48 hours, use WhatsApp for first contact, and protect prayer requests as sensitive ministry data.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
