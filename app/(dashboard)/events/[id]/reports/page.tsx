import Link from "next/link";
import { Activity, ClipboardList, Download, Heart, UsersRound } from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReportSummary } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";

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

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_view_reports",
    });
  } catch {
    return (
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-4">
          <EventWorkspaceTabs eventId={id} />
          <Card>
            <CardContent className="p-6">
              <h1 className="text-lg font-semibold">Access restricted</h1>
              <p className="text-sm text-muted-foreground">
                You do not have permission to view event reports.
              </p>
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    );
  }

  const { event, summary } = await getEventReportSummary(context.churchId, id);
  const template = getEventTemplate(event.event_type);

  return (
    <CinematicSection className="cinematic-fade-up">
      <section className="space-y-4">
        <EventWorkspaceTabs eventId={event.id} />

      <header className="flex flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{event.name} report</h2>
          <p className="mt-1 text-sm text-muted-foreground">Summary of visitor capture, interests, and follow-up activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/events/${event.id}/reports/export`}>
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
              <div key={section.key} className="p-4">
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
                <span className="font-semibold">{statusLabels[status as FollowUpStatus]}</span>
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
                <span className="font-semibold">{interestLabels[interest as Interest]}</span>
                <span className="text-xl font-black">{count}</span>
              </div>
            ))}
            {!Object.keys(summary.interest_counts).length ? <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No interest data yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </section>
    </CinematicSection>
  );
}
