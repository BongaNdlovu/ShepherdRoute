import { getChurchContext, getContactsPage } from "@/lib/data";
import { csvResponse, toCsv } from "@/lib/csv";
import { assignmentRoleLabels, interestLabels, statusLabels, type FollowUpStatus } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const EXPORT_BATCH_SIZE = 100;
const BASE_CONTACT_HEADERS = [
  "Name",
  "Phone",
  "Email",
  "Area",
  "Language",
  "Event",
  "Interests",
  "Status",
  "Urgency",
  "Handling Role",
  "Recommended Role",
  "In-App Assignee",
  "Do Not Contact",
  "Duplicate Match",
  "Best Time",
  "Created At"
];

type ContactExportFilters = {
  q?: string;
  status?: string;
  interest?: string;
  event?: string;
  assignedTo?: string;
};

function normalizeCsvAnswer(value: unknown) {
  if (Array.isArray(value)) {
    return value.join("; ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

async function canExportContacts(context: { role: string; isAppAdmin: boolean; appAdminRole: string | null }): Promise<boolean> {
  // Export allowed for admin, pastor, and app admins
  if (context.role === "admin" || context.role === "pastor") {
    return true;
  }
  if (context.isAppAdmin) {
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  const context = await getChurchContext();

  // Role gate check
  if (!(await canExportContacts(context))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const filters: ContactExportFilters = {
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    interest: url.searchParams.get("interest") ?? undefined,
    event: url.searchParams.get("event") ?? undefined,
    assignedTo: url.searchParams.get("assignedTo") ?? undefined
  };

  const { rows, questionLabels } = await collectContactRows(context.churchId, filters);

  // Build dynamic headers
  const headers = [...BASE_CONTACT_HEADERS, ...questionLabels];

  // Audit log
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "contacts_export",
    target_id: null,
    action: "export",
    metadata: {
      filters,
      row_count: rows.length
    }
  });

  const csv = toCsv(headers, rows);
  const fileName = createContactExportFileName();

  if (process.env.NODE_ENV !== "production") {
    console.log("CSV export rows", {
      churchId: context.churchId,
      filters,
      rowCount: rows.length
    });
  }

  return csvResponse(fileName, csv);
}

async function collectContactRows(
  churchId: string,
  filters: ContactExportFilters
) {
  const rows: Array<Array<unknown>> = [];
  const contactIds: string[] = [];
  let page = 1;

  while (true) {
    const result = await getContactsPage(churchId, {
      ...filters,
      page: String(page),
      pageSize: String(EXPORT_BATCH_SIZE)
    });

    for (const contact of result.contacts) {
      contactIds.push(contact.id);
      const interests = (contact.interests ?? [])
        .map((interest) => interestLabels[interest] ?? interest)
        .join("; ");

      const handlingRole = contact.assigned_handling_role
        ? assignmentRoleLabels[contact.assigned_handling_role as keyof typeof assignmentRoleLabels] ?? contact.assigned_handling_role
        : "";

      const recommendedRole = contact.recommended_assigned_role
        ? assignmentRoleLabels[contact.recommended_assigned_role as keyof typeof assignmentRoleLabels] ?? contact.recommended_assigned_role
        : "";

      rows.push([
        contact.full_name,
        contact.phone ?? "",
        contact.email ?? "",
        contact.area ?? "",
        contact.language ?? "",
        contact.event_name ?? "Manual contact",
        interests,
        statusLabels[contact.status as FollowUpStatus] ?? contact.status,
        contact.urgency,
        handlingRole,
        recommendedRole,
        contact.assigned_name ?? "",
        contact.do_not_contact ? "Yes" : "No",
        contact.duplicate_of_contact_id ? "Yes" : "No",
        contact.best_time_to_contact ?? "",
        contact.created_at
      ]);
    }

    if (!result.contacts.length || page >= result.pageCount) {
      break;
    }

    page += 1;
  }

  // Fetch form answers for all contacts
  const supabase = await createClient();
  const { data: formAnswers } = await supabase
    .from("contact_form_answers")
    .select("contact_id, question_name, question_label, answer_display")
    .eq("church_id", churchId)
    .in("contact_id", contactIds);

  // Build a map of contact_id to answers and collect all unique question names in order
  const answersMap = new Map<string, Map<string, unknown>>();
  const questionOrder = new Map<string, string>();
  if (formAnswers) {
    for (const answer of formAnswers) {
      if (!answersMap.has(answer.contact_id)) {
        answersMap.set(answer.contact_id, new Map());
      }
      answersMap.get(answer.contact_id)!.set(answer.question_name, answer.answer_display);
      if (!questionOrder.has(answer.question_name)) {
        questionOrder.set(answer.question_name, answer.question_label);
      }
    }
  }

  const questionNames = Array.from(questionOrder.keys());
  const questionLabels = questionNames.map((name) => questionOrder.get(name) ?? name);

  // Merge answers into rows with deterministic column ordering
  const rowsWithAnswers = rows.map((row, index) => {
    const contactId = contactIds[index];
    const contactAnswers = answersMap.get(contactId) || new Map<string, unknown>();
    return [
      ...row,
      ...questionNames.map((name) => normalizeCsvAnswer(contactAnswers.get(name)))
    ];
  });

  return { rows: rowsWithAnswers, questionLabels: Array.from(questionLabels) };
}

function createContactExportFileName() {
  const today = new Date().toISOString().slice(0, 10);
  return `shepherdroute-contacts-${today}.csv`;
}
