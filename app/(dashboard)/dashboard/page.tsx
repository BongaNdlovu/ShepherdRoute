import Link from "next/link";
import { Activity, AlertTriangle, CalendarClock, ClipboardList, Heart, HeartPulse, Plus, UserRoundCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterestPills } from "@/components/app/interest-pills";
import { QrCard } from "@/components/app/qr-card";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { getChurchContext, getDashboardData } from "@/lib/data";
import { absoluteUrl } from "@/lib/utils";

export const metadata = {
  title: "Dashboard"
};

export default async function DashboardPage() {
  const context = await getChurchContext();
  const { contacts, events, summary } = await getDashboardData(context.churchId);
  const activeEvent = events[0];
  const allContacts = contacts;

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">{context.churchName}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight md:text-4xl">Capture. Care. Follow up. Disciple.</h2>
            <p className="mt-2 text-muted-foreground">The follow-up pathway for churches that care.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/events/new">
                <Plus className="h-4 w-4" />
                New event
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contacts">
                <UsersRound className="h-4 w-4" />
                Contacts
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={CalendarClock} title="Due today" value={summary.due_today_count} note="Follow-up tasks due before midnight." />
        <StatCard icon={AlertTriangle} title="Overdue" value={summary.overdue_count} note="Needs accountability review." />
        <StatCard icon={Activity} title="High urgency" value={summary.high_priority_count} note="Route to a trusted pastor quickly." />
        <StatCard icon={UserRoundCheck} title="Unassigned" value={summary.unassigned_count} note="Need an owner for follow-up." />
        <StatCard icon={ClipboardList} title="Waiting reply" value={summary.waiting_reply_count} note="Contacts waiting for a response." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} title="Bible study requests" value={summary.bible_study_count} note="Ready for Bible worker assignment." />
        <StatCard icon={Heart} title="Prayer requests" value={summary.prayer_count} note="Stored with privacy controls." />
        <StatCard icon={HeartPulse} title="Health interests" value={summary.health_count} note="Ready for health ministry follow-up." />
        <StatCard icon={UserRoundCheck} title="Do not contact" value={summary.do_not_contact_count} note="Respect opt-out preferences." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>People needing action</CardTitle>
              <CardDescription>Who needs to be called, messaged, or assigned next.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/contacts">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {allContacts.length ? (
                allContacts.map((contact) => (
                  <Link key={contact.id} href={`/contacts/${contact.id}`} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{contact.full_name}</p>
                        <UrgencyBadge urgency={contact.urgency} />
                      </div>
                      <div className="mt-1">
                        <InterestPills interests={(contact.contact_interests ?? []).slice(0, 3)} />
                      </div>
                    </div>
                    <StatusBadge status={contact.status} />
                  </Link>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Create an event and share its QR form to start capturing visitors.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {activeEvent ? (
          <QrCard eventName={activeEvent.name} url={absoluteUrl(`/e/${activeEvent.slug}`)} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No event yet</CardTitle>
              <CardDescription>Create your first visitor Sabbath, health expo, seminar, or Bible study event.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/events/new">Create first event</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
