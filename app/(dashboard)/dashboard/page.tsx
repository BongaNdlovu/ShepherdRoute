import Link from "next/link";
import { Activity, AlertTriangle, CalendarClock, ClipboardList, Droplets, Heart, HeartPulse, Plus, QrCode, UserRoundCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { ContextualBanner, type OnboardingStep } from "@/components/app/contextual-banner";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { EmptyState } from "@/components/app/empty-state";
import { InlineHelp } from "@/components/app/inline-help";
import { InterestPills } from "@/components/app/interest-pills";
import { QrCard } from "@/components/app/qr-card";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { TodaysFollowUpsCard } from "@/components/app/todays-follow-ups-card";
import { getChurchContext, getDashboardData, getOnboardingStatus } from "@/lib/data";
import { absoluteRequestUrl } from "@/lib/server-url";

export const metadata = {
  title: "Dashboard"
};

export default async function DashboardPage() {
  const context = await getChurchContext();
  const [{ contacts, events, summary, todayFollowUps, team }, onboarding] = await Promise.all([
    getDashboardData(context.churchId),
    getOnboardingStatus(context.churchId)
  ]);

  const activeEvent = events.find((event) => event.is_active && !event.archived_at) ?? null;
  const activeEventPublicUrl = activeEvent ? await absoluteRequestUrl(`/e/${activeEvent.slug}`) : null;
  const allContacts = contacts;

  const hasEvent = events.length > 0;
  const hasTeam = team.length > 1;
  const hasContact = contacts.length > 0;
  const hasCompletedFollowUp = summary.followed_up_count > 0;
  const isFullyOnboarded = hasEvent && hasTeam && hasContact && hasCompletedFollowUp;

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 1,
      label: "Create your first event",
      href: "/events/new",
      completed: hasEvent,
      current: !hasEvent
    },
    {
      id: 2,
      label: "Add a team member",
      href: "/settings/team",
      completed: hasTeam,
      current: hasEvent && !hasTeam
    },
    {
      id: 3,
      label: "Capture your first visitor",
      href: activeEvent ? `/e/${activeEvent.slug}` : "/events",
      completed: hasContact,
      current: hasEvent && hasTeam && !hasContact
    },
    {
      id: 4,
      label: "Complete a follow-up",
      href: "/follow-ups",
      completed: hasCompletedFollowUp,
      current: hasEvent && hasTeam && hasContact && !hasCompletedFollowUp
    }
  ];

  const showOnboardingBanner = onboarding.needsGuidance && !isFullyOnboarded;

  return (
    <DashboardShell
      title={showOnboardingBanner ? "Let's get your church started" : "Dashboard"}
      description={showOnboardingBanner
        ? "Create an event, share the QR code, and track every visitor through follow-up."
        : "Track visitors, manage follow-ups, and grow your church care pathway."
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/events/new">
              <Plus className="h-4 w-4" />
              {hasEvent ? "New event" : "Create first event"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contacts">
              <UsersRound className="h-4 w-4" />
              View contacts
            </Link>
          </Button>
        </div>
      }
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
          {showOnboardingBanner ? <ContextualBanner steps={onboardingSteps} /> : null}

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
          <StatCard icon={Droplets} title="Baptismal requests" value={summary.baptism_count} note="Bible worker to begin preparation." />
        </div>

        <TodaysFollowUpsCard items={todayFollowUps} />

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>People to follow up</CardTitle>
                <CardDescription>
                  {allContacts.length
                    ? "Visitors who need a call, WhatsApp message, or assignment."
                    : "Your visitor list will appear here after your first registration."}
                </CardDescription>
              </div>
              {allContacts.length ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/contacts">View all contacts</Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {allContacts.length ? (
                  allContacts.map((contact) => (
                    <Link key={contact.id} href={`/contacts/${contact.id}`} className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-accent/5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{contact.full_name}</p>
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
                  <EmptyState
                    icon={QrCode}
                    title="No visitors yet"
                    description="Create an event to get a QR code. When visitors scan it and fill out the form, they will appear here automatically."
                    action={{ href: "/events/new", label: "Create your first event" }}
                    secondaryAction={{ href: "/contacts", label: "Add contact manually" }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {activeEvent && activeEventPublicUrl ? (
              <>
                <QrCard eventName={activeEvent.name} url={activeEventPublicUrl} />
                <InlineHelp variant="tip">
                  <strong>How this works:</strong> Show this QR code on a screen, print it, or share the link. Visitors scan it, fill out a simple form, and their details appear in Contacts with a follow-up task.
                </InlineHelp>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Start with an event</CardTitle>
                  <CardDescription>
                    Events create QR codes that visitors scan to register. Use this for Sabbath services, health expos, Bible studies, youth programs, or outreach events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href="/events/new">Create your first event</Link>
                  </Button>
                  <InlineHelp>
                    Not ready for an event? You can also <Link href="/contacts" className="font-semibold underline">add contacts manually</Link> from the Contacts page.
                  </InlineHelp>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
      </CinematicSection>
    </DashboardShell>
  );
}
