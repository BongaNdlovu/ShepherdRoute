import { csvResponse, toCsv } from "@/lib/csv";
import { formatExportDateTime, formatExportUrgency, formatSpreadsheetPhone } from "@/lib/exports/export-formatting";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReportContactsPage, getEventReportExportMeta } from "@/lib/data";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { createWorkbook, xlsxResponse, type XlsxCell } from "@/lib/xlsx";

const EXPORT_BATCH_SIZE = 1000;
const EVENT_EXPORT_HEADERS = [
  "Name",
  "Phone",
  "Email",
  "Area",
  "Language",
  "Best Time to Contact",
  "Interests",
  "Status",
  "Urgency",
  "Assigned To",
  "Date Captured"
];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getChurchContext();
  const supabase = await createClient();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

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

  const firstContactPage = await getEventReportContactsPage(context.churchId, id, 0, 1);

  if (firstContactPage.length === 0) {
    return new Response("No contacts have been captured for this event yet.", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }


  // Fetch all unique question names for this event
  const { data: questionRows } = await supabase
    .from("contact_form_answers")
    .select("question_name, question_label")
    .eq("church_id", context.churchId)
    .eq("event_id", id);

  const configuredQuestions =
    extractQuestionOrderFromFormConfig(event.form_config);

  const answerQuestions = Array.from(
    new Map(
      (questionRows ?? []).map((row) => [
        row.question_name,
        row.question_label || row.question_name
      ])
    ).entries()
  );

  const questionMap = new Map<string, string>();

  for (const [name, label] of configuredQuestions) {
    if (name && !questionMap.has(name)) {
      questionMap.set(name, label || name);
    }
  }

  for (const [name, label] of answerQuestions) {
    if (name && !questionMap.has(name)) {
      questionMap.set(name, label || name);
    }
  }

  const uniqueQuestions = Array.from(questionMap.entries());

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
      metadata: { event_name: event.name, format }
    });

  const rows = await collectEventRows(context.churchId, id, uniqueQuestions);

  if (rows.length === 0) {
    return new Response("CSV export failed: contacts were found, but no CSV rows were generated.", {
      status: 500,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  if (process.env.SHEPHERDROUTE_DEBUG_EXPORTS === "true") {
    console.log("Event CSV export rows", {
      churchId: context.churchId,
      eventId: id,
      firstContactPageCount: firstContactPage.length,
      rowCount: rows.length,
      dynamicQuestionCount: uniqueQuestions.length
    });
  }

  if (format === "xlsx") {
    const workbook = createWorkbook([
      {
        name: "Event Contacts",
        rows: [
          ["Event Contact Report"],
          [`Export date: ${formatExportDateTime(new Date().toISOString())}`],
          [`Event: ${event.name}`],
          [],
          headers,
          ...toXlsxRows(rows, headers)
        ],
        headerRow: 5,
        freezePane: { ySplit: 5, topLeftCell: "A6" },
        autoFilter: { from: "A5", to: `${columnName(headers.length)}${Math.max(5, rows.length + 5)}` },
        columnWidths: eventColumnWidths(headers.length),
        wrapColumns: eventWrapColumns(headers.length)
      },
      {
        name: "Summary",
        rows: buildEventSummaryRows(rows, headers, event.name)
      }
    ]);

    return xlsxResponse(
      `${slugify(event.name)}-${new Date().toISOString().split("T")[0]}-contacts.xlsx`,
      workbook
    );
  }

  const csv = toCsv(headers, rows);
  return csvResponse(
    `${slugify(event.name)}-${new Date().toISOString().split("T")[0]}-contacts.csv`,
    csv
  );
}

function toXlsxRows(rows: Array<Array<unknown>>, headers: string[]): XlsxCell[][] {
  const phoneIndex = headers.indexOf("Phone");

  return rows.map((row) =>
    row.map((cell, index) => {
      if (index === phoneIndex && typeof cell === "string" && cell.startsWith("'")) {
        return cell.slice(1);
      }

      if (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean" || cell === null || cell === undefined) {
        return cell;
      }

      return String(cell);
    })
  );
}

function extractQuestionOrderFromFormConfig(formConfig: unknown): Array<[string, string]> {
  if (!formConfig || typeof formConfig !== "object" || Array.isArray(formConfig)) {
    return [];
  }

  const config = formConfig as Record<string, unknown>;
  const questions = config.questions;

  if (!Array.isArray(questions)) {
    return [];
  }

  const orderedQuestions: Array<[string, string]> = [];
  const seen = new Set<string>();

  for (const item of questions) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const question = item as Record<string, unknown>;

    const nameCandidate =
      typeof question.name === "string"
        ? question.name
        : typeof question.question_name === "string"
          ? question.question_name
          : typeof question.id === "string"
            ? question.id
            : "";

    const labelCandidate =
      typeof question.label === "string"
        ? question.label
        : typeof question.question_label === "string"
          ? question.question_label
          : typeof question.title === "string"
            ? question.title
            : nameCandidate;

    const name = nameCandidate.trim();
    const label = labelCandidate.trim() || name;

    if (!name || seen.has(name)) {
      continue;
    }

    seen.add(name);
    orderedQuestions.push([name, label]);
  }

  return orderedQuestions;
}

async function collectEventRows(churchId: string, eventId: string, uniqueQuestions: Array<[string, string]>): Promise<Array<Array<unknown>>> {
  let offset = 0;
  const supabase = await createClient();
  const rows: Array<Array<unknown>> = [];

  while (true) {
    const contacts = await getEventReportContactsPage(churchId, eventId, offset, EXPORT_BATCH_SIZE);

    if (contacts.length === 0) {
      break;
    }

    const contactIds = contacts.map((contact) => contact.id);

    const { data: answers, error: answersError } = contactIds.length
      ? await supabase
          .from("contact_form_answers")
          .select("contact_id, question_name, answer_display")
          .eq("church_id", churchId)
          .eq("event_id", eventId)
          .in("contact_id", contactIds)
      : { data: [], error: null };

    if (answersError) {
      throw new Error(answersError.message);
    }

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
        .map((item: { interest: Interest }) => interestLabels[item.interest] ?? item.interest)
        .join("; ");

      const answerMap = answersByContact.get(contact.id) ?? new Map<string, string>();
      const dynamicValues = uniqueQuestions.map(([name]) => answerMap.get(name) ?? "");

      rows.push([
        contact.full_name,
        formatSpreadsheetPhone(contact.phone ?? contact.whatsapp_number ?? ""),
        contact.email ?? "",
        contact.area ?? "",
        contact.language ?? "",
        contact.best_time_to_contact ?? "",
        interests,
        statusLabels[contact.status as FollowUpStatus] ?? contact.status,
        formatExportUrgency(contact.urgency),
        contact.assigned_name ?? "",
        formatExportDateTime(contact.created_at),
        ...dynamicValues
      ]);
    }

    if (contacts.length < EXPORT_BATCH_SIZE) {
      break;
    }

    offset += EXPORT_BATCH_SIZE;
  }

  return rows;
}

function eventColumnWidths(columnCount: number) {
  const baseWidths = [24, 18, 28, 22, 16, 22, 28, 16, 14, 24, 20];
  return Array.from({ length: columnCount }, (_, index) => baseWidths[index] ?? 40);
}

function eventWrapColumns(columnCount: number) {
  const wrap = [7];

  for (let index = EVENT_EXPORT_HEADERS.length + 1; index <= columnCount; index += 1) {
    wrap.push(index);
  }

  return wrap;
}

function buildEventSummaryRows(rows: Array<Array<unknown>>, headers: string[], eventName: string) {
  const statusIndex = headers.indexOf("Status");
  const urgencyIndex = headers.indexOf("Urgency");
  const assignedIndex = headers.indexOf("Assigned To");
  const countsByStatus = countValues(rows, statusIndex);
  const countsByUrgency = countValues(rows, urgencyIndex);
  const assignedCount = rows.filter((row) => Boolean(row[assignedIndex])).length;

  return [
    ["Event Contact Report Summary"],
    [`Export date: ${formatExportDateTime(new Date().toISOString())}`],
    [`Event: ${eventName}`],
    [],
    ["Metric", "Value"],
    ["Total contacts exported", rows.length],
    ["Total assigned", assignedCount],
    ["Total unassigned", rows.length - assignedCount],
    [],
    ["Count by status"],
    ...Object.entries(countsByStatus),
    [],
    ["Count by urgency"],
    ...Object.entries(countsByUrgency)
  ];
}

function countValues(rows: Array<Array<unknown>>, index: number) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const key = String(row[index] || "Blank");
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function columnName(index: number) {
  let name = "";
  let value = index;

  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }

  return name;
}
