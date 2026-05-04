import { streamCsvResponse } from "@/lib/csv";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReportContactsPage, getEventReportExportMeta } from "@/lib/data";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const EXPORT_BATCH_SIZE = 1000;
const EVENT_EXPORT_HEADERS = ["Name", "Phone", "Area", "Interests", "Status", "Urgency", "Created At"];

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

  const uniqueQuestions = Array.from(
    new Map(
      (questionRows ?? []).map((row) => [row.question_name, row.question_label])
    ).entries()
  );

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

    for (const contact of contacts) {
      const interests = (contact.contact_interests ?? [])
        .map((item: { interest: Interest }) => interestLabels[item.interest])
        .join("; ");

      // Fetch form answers for this contact
      const { data: answers } = await supabase
        .from("contact_form_answers")
        .select("question_name, answer_display")
        .eq("church_id", churchId)
        .eq("contact_id", contact.id);

      const answerMap = new Map(
        (answers ?? []).map((a) => {
          const displayValue = a.answer_display;
          const formatted = Array.isArray(displayValue) ? displayValue.join(", ") : String(displayValue ?? "");
          return [a.question_name, formatted];
        })
      );

      const dynamicValues = uniqueQuestions.map(([name]) => answerMap.get(name) ?? "");

      yield [
        contact.full_name,
        contact.phone,
        contact.area ?? "",
        interests,
        statusLabels[contact.status as FollowUpStatus],
        contact.urgency,
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
