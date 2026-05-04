import { AlertTriangle, BarChart3, CalendarClock, ClipboardList, Droplets, Heart, HeartPulse, UserCheck, UserX, UsersRound } from "lucide-react";
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
  const isMinistryWorkspace = context.workspaceType === "ministry";
  const primaryTitle = isMinistryWorkspace ? "Ministry reports" : "Church reports";
  const secondaryTitle = isMinistryWorkspace ? "Church impact summary" : "Ministry reports";

  return (
    <DashboardShell
      title={primaryTitle}
      description={`Board-ready reporting for ${context.churchName}, including follow-up accountability and ministry outcomes.`}
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{primaryTitle}</CardTitle>
              <CardDescription>
                {isMinistryWorkspace
                  ? "Ministry-focused view of contacts, care requests, and follow-up outcomes."
                  : "Church-wide view of visitor capture, pastoral care, and follow-up accountability."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={BarChart3} title="Total contacts" value={summary.total_contacts} note="Across all recorded events." />
                <StatCard icon={UserCheck} title="Followed up" value={summary.followed_up_count} note="Contacts no longer in new status." />
                <StatCard icon={CalendarClock} title="Due today" value={summary.due_today_count} note="Open follow-ups due today." />
                <StatCard icon={AlertTriangle} title="Overdue" value={summary.overdue_count} note="Follow-ups past their deadline." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={UserX} title="Unassigned" value={summary.unassigned_count} note="Contacts without an owner." />
                <StatCard icon={ClipboardList} title="Waiting reply" value={summary.waiting_reply_count} note="Contacts waiting for a response." />
                <StatCard icon={UserX} title="No consent" value={summary.no_consent_count} note="Records not ready for follow-up." />
                <StatCard icon={UserX} title="Opted out" value={summary.do_not_contact_count} note="Do not contact records." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{secondaryTitle}</CardTitle>
              <CardDescription>
                {isMinistryWorkspace
                  ? "How this ministry contributes to the wider church care pipeline."
                  : "Care, health, youth, Bible work, prayer, and baptism preparation outcomes."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={ClipboardList} title="Bible study leads" value={summary.bible_study_count} note="Ready for study pathway." />
                <StatCard icon={Droplets} title="Baptismal requests" value={summary.baptism_count} note="Bible worker to begin preparation." />
                <StatCard icon={Heart} title="Prayer care" value={summary.prayer_count} note="Stored with privacy controls." />
                <StatCard icon={HeartPulse} title="Health interests" value={summary.health_count} note="Ready for health ministry follow-up." />
                <StatCard icon={UsersRound} title="High priority" value={summary.high_priority_count} note="Needs trusted human care quickly." />
              </div>
              <p className="leading-7 text-muted-foreground">
                The current pipeline has {summary.total_contacts} contact{summary.total_contacts === 1 ? "" : "s"}, with {summary.bible_study_count} Bible study lead{summary.bible_study_count === 1 ? "" : "s"}, {summary.baptism_count} baptismal request{summary.baptism_count === 1 ? "" : "s"}, {summary.prayer_count} prayer care request{summary.prayer_count === 1 ? "" : "s"}, and {summary.high_priority_count} high-priority case{summary.high_priority_count === 1 ? "" : "s"}. Assign new contacts promptly, use preferred contact methods, and protect prayer requests as sensitive ministry data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event performance</CardTitle>
              <CardDescription>Use this to see which events need more team support.</CardDescription>
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
                {!summary.events.length ? (
                  <p className="p-4 text-sm text-muted-foreground">No events have been recorded yet.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    </DashboardShell>
  );
}
