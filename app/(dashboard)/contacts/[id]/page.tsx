import { generateAiFollowUpRecommendationAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/app/pending-submit-button";
import { ContactSummaryPanel } from "@/components/app/contact-summary-panel";
import { ContactClassificationPanel } from "@/components/app/contact-classification-panel";
import { ContactTemplateAnswersPanel } from "@/components/app/contact-template-answers-panel";
import { ContactJourneySection } from "@/components/app/contact-journey-section";
import { FollowUpHistorySection } from "@/components/app/follow-up-history-section";
import { FollowUpNoteCard } from "@/components/app/follow-up-note-card";
import { FollowUpTrackerCard } from "@/components/app/follow-up-tracker-card";
import { GeneratedMessagesSection } from "@/components/app/generated-messages-section";
import { PrayerRequestsSection } from "@/components/app/prayer-requests-section";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { WhatsappFollowUpCard } from "@/components/app/whatsapp-follow-up-card";
import { FollowUpSuggestionCard } from "@/components/app/follow-up-suggestion-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChurchContext, getContact, getMinistrySuggestionCandidates } from "@/lib/data";
import { canManageContacts } from "@/lib/permissions";
import type { AppRole, TeamRole } from "@/lib/constants";
import { AI_TRIAGE_WHATSAPP_PROMPT_VERSION, CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION, generateMessage } from "@/lib/whatsapp";
import { generateFollowUpSuggestion } from "@/lib/follow-up-suggestions";

export const metadata = {
  title: "Contact Detail"
};

export default async function ContactDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await getChurchContext();
  const { contact, prayer, journey, team, followUps, messages, formAnswers } = await getContact(context.churchId, id);
  const userCanManageContact = canManageContacts(context.role as TeamRole, context.appRole as AppRole | null);
  const interests = contact.contact_interests ?? [];

  const ministryCandidates = await getMinistrySuggestionCandidates(context.churchId);
  const suggestion = generateFollowUpSuggestion({
    contact,
    prayerRequests: prayer,
    formAnswers,
    teams: ministryCandidates
  });
  const suggestedMessages = messages.filter((item) =>
    item.channel === "whatsapp" &&
    item.purpose === "suggested_whatsapp" &&
    item.message_text.trim().length > 0 &&
    [AI_TRIAGE_WHATSAPP_PROMPT_VERSION, CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION].includes(item.prompt_version ?? "")
  );
  const suggestedMessage =
    suggestedMessages.find((item) => item.prompt_version === AI_TRIAGE_WHATSAPP_PROMPT_VERSION)?.message_text ??
    suggestedMessages.find((item) => item.prompt_version === CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION)?.message_text;
  const aiExplicitlySkippedWhatsapp = contact.classification_payload?.suggested_whatsapp_message === "";
  const message = suggestedMessage ?? (aiExplicitlySkippedWhatsapp
    ? ""
    : generateMessage({
      name: contact.full_name,
      phone: contact.phone ?? contact.whatsapp_number,
      interests: interests.map((item) => item.interest),
      churchName: context.churchName,
      eventName: contact.events?.name,
      templateType: contact.events?.event_type
    }));

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl">{contact.full_name}</CardTitle>
              <CardDescription>{contact.events?.name ?? "Manual contact"}{contact.phone ?? contact.whatsapp_number ? ` - ${contact.phone ?? contact.whatsapp_number}` : ""}</CardDescription>
            </div>
            <div className="flex gap-2">
              <UrgencyBadge urgency={contact.urgency} />
              <StatusBadge status={contact.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <ContactSummaryPanel contact={contact} error={query.error} success={query.success} canManageContact={userCanManageContact} />
          <ContactClassificationPanel classification={contact.classification_payload} />
          {userCanManageContact ? (
            <form action={generateAiFollowUpRecommendationAction} className="flex justify-end rounded-lg border bg-white p-3">
              <input type="hidden" name="contactId" value={contact.id} />
              <PendingSubmitButton pendingText="Generating..." variant="outline">
                Generate AI Follow-Up Recommendation
              </PendingSubmitButton>
            </form>
          ) : null}
          <ContactTemplateAnswersPanel churchId={context.churchId} contactId={contact.id} />
          <FollowUpSuggestionCard suggestion={suggestion} canManage={userCanManageContact} />
          <ContactJourneySection journey={journey} />
          {userCanManageContact ? (
            <WhatsappFollowUpCard contactId={contact.id} phone={contact.phone ?? contact.whatsapp_number} message={message} doNotContact={contact.do_not_contact} />
          ) : null}
          <PrayerRequestsSection prayer={prayer} />
          <FollowUpHistorySection followUps={followUps} />
          <GeneratedMessagesSection messages={messages} />
        </CardContent>
      </Card>

      {userCanManageContact ? (
        <>
          <FollowUpTrackerCard contact={contact} team={team} />
          <FollowUpNoteCard contact={contact} team={team} />
        </>
      ) : null}
    </section>
  );
}
