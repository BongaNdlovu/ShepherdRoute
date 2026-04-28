import Link from "next/link";
import { Activity, ClipboardList, Download, Heart, UsersRound } from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReport } from "@/lib/data";

export const metadata = {
  title: "Event Report"
};

export default async function EventReportPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getChurchContext();
  const { event, contacts, followUps } = await getEventReport(context.churchId, id);

  const followedUp = contacts.filter((contact) => contact.status !== "new").length;
  const prayer = contacts.filter((contact) =>
    (contact.contact_interests ?? []).some((item: { interest: Interest }) => item.interest === "prayer")
  ).length;
  const bibleStudies = contacts.filter((contact) =>
    (contact.contact_interests ?? []).some((item: { interest: Interest }) => item.interest === "bible_study")
  ).length;
  const highPriority = contacts.filter((contact) => contact.urgency === "high").length;

  const statusCounts = contacts.reduce<Record<string, number>>((acc, contact) => {
    acc[contact.status] = (acc[contact.status] ?? 0) + 1;
    return acc;
  }, {});

  const interestCounts = contacts.reduce<Record<string, number>>((acc, contact) => {
    for (const item of contact.contact_interests ?? []) {
      acc[item.interest] = (acc[item.interest] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{event.name} report</h2>
          <p className="mt-1 text-sm text-muted-foreground">Summary of visitor capture, interests, and follow-up activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/report/export`}>
              <Download className="h-4 w-4" />
              Export CSV
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}`}>Back to event</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} title="Contacts" value={contacts.length} note="Total event registrations." />
        <StatCard icon={Activity} title="Followed up" value={followedUp} note={`${followUps.length} follow-up records logged.`} />
        <StatCard icon={ClipboardList} title="Bible studies" value={bibleStudies} note="People requesting Bible study." />
        <StatCard icon={Heart} title="Prayer care" value={prayer + highPriority} note="Prayer and high-priority care." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>Follow-up pathway progress for this event.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="font-semibold">{statusLabels[status as FollowUpStatus]}</span>
                <span className="text-xl font-black">{count}</span>
              </div>
            ))}
            {!Object.keys(statusCounts).length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No status data yet.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interest breakdown</CardTitle>
            <CardDescription>Ministry interests selected by visitors.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {Object.entries(interestCounts).map(([interest, count]) => (
              <div key={interest} className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="font-semibold">{interestLabels[interest as Interest]}</span>
                <span className="text-xl font-black">{count}</span>
              </div>
            ))}
            {!Object.keys(interestCounts).length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No interest data yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
