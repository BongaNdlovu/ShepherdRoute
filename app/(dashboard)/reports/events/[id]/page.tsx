import Link from "next/link";
import { Activity, ArrowLeft, ClipboardList, Download, Heart, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReportSummary } from "@/lib/data";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { getEventTemplate } from "@/lib/eventTemplates";

export const metadata = {
  title: "Detailed Event Report"
};

export default async function DetailedEventReportPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getChurchContext();

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_view_reports"
    });
  } catch {
    return (
      <DashboardShell title="Access restricted" description="You do not have permission to view this event report.">
        <CinematicSection className="cinematic-fade-up">
          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm text-muted-foreground">Ask a workspace admin or pastor to grant report access.</p>
              <Button asChild variant="outline">
                <Link href="/reports">
                  <ArrowLeft className="h-4 w-4" />
                  Back to reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </CinematicSection>
      </DashboardShell>
    );
  }

  const { event, summary } = await getEventReportSummary(context.churchId, id);
  const template = getEventTemplate(event.event_type);
  const workspaceLabel = context.workspaceType === "ministry" ? "Ministry event report" : "Church event report";

  return (
    <DashboardShell
      title={`${event.name} detailed report`}
      description={`${workspaceLabel} for ${context.churchName}. Use this page to understand results and decide what should happen next.`}
      actions={(
        <>
          <Button asChild variant="outline">
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
              Back to reports
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/reports/events/${event.id}/export`}>
              <Download className="h-4 w-4" />
              Download Word report
            </Link>
          </Button>
        </>
      )}
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={UsersRound} title="Contacts" value={summary.total_contacts} note="Total event registrations." />
            <StatCard icon={Activity} title="Followed up" value={summary.followed_up_count} note={`${summary.follow_up_count} follow-up records logged.`} />
            <StatCard icon={ClipboardList} title="Bible studies" value={summary.bible_study_count} note="People requesting Bible study." />
            <StatCard icon={Heart} title="Prayer care" value={summary.prayer_count + summary.high_priority_count} note="Prayer and high-priority care." />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{template.name} report focus</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {template.reportSections.map((section) => {
                const value = section.metric
                  ? summary[section.metric]
                  : section.interest
                    ? summary.interest_counts[section.interest] ?? 0
                    : null;

                return (
                  <div key={section.key} className="rounded-lg border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{section.label}</p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{section.description}</p>
                      </div>
                      {value !== null ? <span className="text-2xl font-black">{value}</span> : null}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status breakdown</CardTitle>
                <CardDescription>Follow-up pathway progress for this event.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {Object.entries(summary.status_counts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="font-semibold">{statusLabels[status as FollowUpStatus] ?? status}</span>
                    <span className="text-xl font-black">{count}</span>
                  </div>
                ))}
                {!Object.keys(summary.status_counts).length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No status data yet.</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interest breakdown</CardTitle>
                <CardDescription>Ministry interests selected by visitors.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {Object.entries(summary.interest_counts).map(([interest, count]) => (
                  <div key={interest} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="font-semibold">{interestLabels[interest as Interest] ?? interest}</span>
                    <span className="text-xl font-black">{count}</span>
                  </div>
                ))}
                {!Object.keys(summary.interest_counts).length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No interest data yet.</p> : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Topic breakdown</CardTitle>
                <CardDescription>Topics selected or classified for this event.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {Object.entries(summary.topic_counts).map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="font-semibold">{topic}</span>
                    <span className="text-xl font-black">{count}</span>
                  </div>
                ))}
                {!Object.keys(summary.topic_counts).length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No topic data yet.</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form answer breakdown</CardTitle>
                <CardDescription>Custom event questions answered by attendees.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {summary.form_answer_counts.map((answer) => (
                  <div key={answer.question_name} className="flex items-center justify-between gap-4 rounded-lg bg-muted p-3">
                    <div>
                      <span className="font-semibold">{answer.question_label}</span>
                      <p className="text-xs text-muted-foreground">{answer.question_name}</p>
                    </div>
                    <span className="text-xl font-black">{answer.count}</span>
                  </div>
                ))}
                {!summary.form_answer_counts.length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No custom answer data yet.</p> : null}
              </CardContent>
            </Card>
          </div>
        </section>
      </CinematicSection>
    </DashboardShell>
  );
}
