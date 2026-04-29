import { ContactSummaryPanel } from "@/components/app/contact-summary-panel";
import { FollowUpHistorySection } from "@/components/app/follow-up-history-section";
import { FollowUpNoteCard } from "@/components/app/follow-up-note-card";
import { FollowUpTrackerCard } from "@/components/app/follow-up-tracker-card";
import { GeneratedMessagesSection } from "@/components/app/generated-messages-section";
import { PrayerRequestsSection } from "@/components/app/prayer-requests-section";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { WhatsappFollowUpCard } from "@/components/app/whatsapp-follow-up-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChurchContext, getContact } from "@/lib/data";
import { generateMessage } from "@/lib/whatsapp";

export const metadata = {
  title: "Contact Detail"
};

export default async function ContactDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await getChurchContext();
  const { contact, prayer, team, followUps, messages } = await getContact(context.churchId, id);
  const interests = contact.contact_interests ?? [];
  const message = generateMessage({
    name: contact.full_name,
    phone: contact.phone,
    interests: interests.map((item) => item.interest),
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
          <ContactSummaryPanel contact={contact} error={query.error} />
          <WhatsappFollowUpCard contactId={contact.id} phone={contact.phone} message={message} />
          <PrayerRequestsSection prayer={prayer} />
          <FollowUpHistorySection followUps={followUps} />
          <GeneratedMessagesSection messages={messages} />
        </CardContent>
      </Card>

      <FollowUpTrackerCard contact={contact} team={team} />
      <FollowUpNoteCard contact={contact} team={team} />
    </section>
  );
}
