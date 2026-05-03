import { AlertTriangle, BarChart3, CalendarClock, ClipboardList, Droplets, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { StatCard } from "@/components/app/stat-card";
import { getChurchContext, getOutreachReportSummary } from "@/lib/data";

export const metadata = {
  title: "Reports"
};

export default async function ReportsPage() {
  const context = await getChurchContext();
  const summary = await getOutreachReportSummary(context.churchId);

  return (
    <DashboardShell
      title="Outreach report"
      description="Board-ready summary for pastors, elders, health ministries, and personal ministries."
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BarChart3} title="Total contacts" value={summary.total_contacts} note="Across all recorded events." />
          <StatCard icon={UserCheck} title="Followed up" value={summary.followed_up_count} note="Contacts no longer in new status." />
          <StatCard icon={ClipboardList} title="Bible study leads" value={summary.bible_study_count} note="Ready for study pathway." />
          <StatCard icon={Droplets} title="Baptismal requests" value={summary.baptism_count} note="Bible worker to begin preparation." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarClock} title="Due today" value={summary.due_today_count} note="Open follow-ups due today." />
          <StatCard icon={AlertTriangle} title="Overdue" value={summary.overdue_count} note="Follow-ups past their deadline." />
          <StatCard icon={UserX} title="Unassigned" value={summary.unassigned_count} note="Contacts without an owner." />
          <StatCard icon={UserX} title="Opted out" value={summary.do_not_contact_count} note="Do not contact records." />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Event performance</CardTitle>
              <CardDescription>Use this to see which outreach channels need more team support.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/70 rounded-2xl border border-border/70">
                {summary.events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/5">
                    <div>
                      <p className="font-semibold text-foreground">{event.name}</p>
                      <p className="text-sm text-muted-foreground">{event.event_type}</p>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">{event.contact_count}</p>
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
              <p className="leading-7 text-muted-foreground">
                The current outreach pipeline has {summary.total_contacts} contacts, with {summary.bible_study_count} Bible study lead{summary.bible_study_count === 1 ? "" : "s"}, {summary.baptism_count} baptismal request{summary.baptism_count === 1 ? "" : "s"}, {summary.prayer_count} prayer care request{summary.prayer_count === 1 ? "" : "s"}, and {summary.high_priority_count} high-priority pastoral case{summary.high_priority_count === 1 ? "" : "s"}. Assign new contacts within 48 hours, use WhatsApp for first contact, and protect prayer requests as sensitive ministry data.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </CinematicSection>
    </DashboardShell>
  );
}
