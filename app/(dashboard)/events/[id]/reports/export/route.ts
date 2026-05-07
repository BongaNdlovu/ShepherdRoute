import { streamCsvResponse } from "@/lib/csv";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReportContactsPage, getEventReportExportMeta } from "@/lib/data";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const EXPORT_BATCH_SIZE = 1000;
const EVENT_EXPORT_HEADERS = [
  "Name",
  "Phone",
  "Email",
  "Area",
  "Language",
  "Best Time",
  "Interests",
  "Status",
  "Urgency",
  "Assignee",
  "Created At"
];

type EventFormConfig = {
  show_phone?: boolean;
  show_email?: boolean;
  show_area?: boolean;
  show_language?: boolean;
  show_best_time?: boolean;
  show_message?: boolean;
  show_prayer_visibility?: boolean;
  questions?: Array<{ name?: string; label?: string; enabled?: boolean }>;
};

function currentFormQuestionNames(formConfig: unknown) {
  const config = (formConfig ?? {}) as EventFormConfig;
  const names = new Set<string>();

  if (config.show_phone !== false) names.add("phone");
  if (config.show_email !== false) names.add("email");
  if (config.show_area !== false) names.add("area");
  if (config.show_language !== false) names.add("language");
  if (config.show_best_time !== false) names.add("best_time");
  if (config.show_message !== false) names.add("message");
  if (config.show_prayer_visibility !== false) names.add("prayer_visibility");

  for (const question of config.questions ?? []) {
    if (question.name && question.enabled !== false) {
      names.add(question.name);
    }
  }

  return names;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getChurchContext();
  const supabase = await createClient();

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_export_reports",
    });
  } catch {
    return new Response("Unauthorized", { status: 403 });
  }

  const event = await getEventReportExportMeta(context.churchId, id);

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  // Fetch all unique question names for this event
  const { data: questionRows } = await supabase
    .from("contact_form_answers")
    .select("question_name, question_label")
    .eq("church_id", context.churchId)
    .eq("event_id", id);

  const currentQuestionNames = currentFormQuestionNames(event.form_config);
  const uniqueQuestions = Array.from(
    new Map(
      (questionRows ?? []).map((row) => [row.question_name, row.question_label])
    ).entries()
  ).filter(([name]) => currentQuestionNames.has(name));

  const dynamicHeaders = uniqueQuestions.map(([name, label]) => label || name);
  const headers = [...EVENT_EXPORT_HEADERS, ...dynamicHeaders];

  // Audit log before export
  await supabase
    .from("audit_logs")
    .insert({
      church_id: context.churchId,
      actor_user_id: context.userId,
      action: "event_report_export",
      target_type: "event",
      target_id: id,
      metadata: { event_name: event.name }
    });

  return streamCsvResponse(`${slugify(event.name)}-${new Date().toISOString().split("T")[0]}-contacts.csv`, headers, eventRows(context.churchId, id, uniqueQuestions));
}

async function* eventRows(churchId: string, eventId: string, uniqueQuestions: Array<[string, string]>) {
  let offset = 0;
  const supabase = await createClient();

  while (true) {
    const contacts = await getEventReportContactsPage(churchId, eventId, offset, EXPORT_BATCH_SIZE);

    if (contacts.length === 0) {
      break;
    }

    const contactIds = contacts.map((contact) => contact.id);

    const { data: answers } = contactIds.length
      ? await supabase
          .from("contact_form_answers")
          .select("contact_id, question_name, answer_display")
          .eq("church_id", churchId)
          .eq("event_id", eventId)
          .in("contact_id", contactIds)
      : { data: [] };

    const answersByContact = new Map<string, Map<string, string>>();

    for (const answer of answers ?? []) {
      const answerMap = answersByContact.get(answer.contact_id) ?? new Map<string, string>();
      const displayValue = answer.answer_display;
      const formatted = Array.isArray(displayValue) ? displayValue.join(", ") : String(displayValue ?? "");
      answerMap.set(answer.question_name, formatted);
      answersByContact.set(answer.contact_id, answerMap);
    }

    for (const contact of contacts) {
      const interests = (contact.contact_interests ?? [])
        .map((item: { interest: Interest }) => interestLabels[item.interest])
        .join("; ");

      const answerMap = answersByContact.get(contact.id) ?? new Map<string, string>();
      const dynamicValues = uniqueQuestions.map(([name]) => answerMap.get(name) ?? "");

      yield [
        contact.full_name,
        contact.phone,
        contact.email ?? "",
        contact.area ?? "",
        contact.language ?? "",
        contact.best_time_to_contact ?? "",
        interests,
        statusLabels[contact.status as FollowUpStatus],
        contact.urgency,
        contact.assigned_name ?? "",
        contact.created_at,
        ...dynamicValues
      ];
    }

    if (contacts.length < EXPORT_BATCH_SIZE) {
      break;
    }

    offset += EXPORT_BATCH_SIZE;
  }
}
