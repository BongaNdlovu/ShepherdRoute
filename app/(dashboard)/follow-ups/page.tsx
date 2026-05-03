import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { FollowUpsFilterForm } from "@/components/app/follow-ups-filter-form";
import { FollowUpsPagination } from "@/components/app/follow-ups-pagination";
import { FollowUpsQueueList } from "@/components/app/follow-ups-queue-list";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { InlineHelp } from "@/components/app/inline-help";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChurchContext, getFollowUpsPage, getTeamMembers, getUserAccountPreferences } from "@/lib/data";

export const metadata = {
  title: "Follow-Ups"
};

export default async function FollowUpsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; assignedTo?: string; dueState?: string; page?: string; pageSize?: string; error?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const [followUpsPage, team, preferences] = await Promise.all([
    getFollowUpsPage(context.churchId, params),
    getTeamMembers(context.churchId),
    getUserAccountPreferences(context.userId)
  ]);

  return (
    <DashboardShell
      title="Follow-up tasks"
      description="Work due, overdue, upcoming, and completed care tasks without loading the whole contact list."
      actions={
        <Button asChild variant="outline">
          <Link href="/contacts">
            <ClipboardList className="h-4 w-4" />
            Contacts
          </Link>
        </Button>
      }
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Queue</CardTitle>
            <CardDescription>Filter by timing, status, owner, or contact details.</CardDescription>
          </CardHeader>
          <CardContent>
            {params.error ? <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p> : null}
            <FollowUpsFilterForm params={params} team={team} />
            <FollowUpsPagination
              params={params}
              page={followUpsPage.page}
              pageCount={followUpsPage.pageCount}
              pageSize={followUpsPage.pageSize}
              total={followUpsPage.total}
              visibleCount={followUpsPage.items.length}
            />
            <FollowUpsQueueList items={followUpsPage.items} compactLists={preferences.compactLists} returnTo={(() => {
              const returnSearchParams = new URLSearchParams();

              Object.entries(params).forEach(([key, value]) => {
                if (value && key !== "error") {
                  returnSearchParams.set(key, value);
                }
              });

              const returnTo = returnSearchParams.toString()
                ? `/follow-ups?${returnSearchParams.toString()}`
                : "/follow-ups";

              return returnTo;
            })()} />
          </CardContent>
        </Card>

        <InlineHelp variant="tip">
          <strong>How follow-up tasks work:</strong> When a visitor registers at an event, a follow-up task is created automatically based on their interests. Use this queue to call, message, or assign tasks to team members. Mark tasks as &quot;Contacted&quot; when you reach out, and &quot;Completed&quot; when the follow-up journey is finished.
        </InlineHelp>
      </section>
      </CinematicSection>
    </DashboardShell>
  );
}
