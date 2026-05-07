import { getChurchContext, getContactsPage } from "@/lib/data";
import { streamCsvResponse } from "@/lib/csv";
import { assignmentRoleLabels, interestLabels, statusLabels, type FollowUpStatus } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const EXPORT_BATCH_SIZE = 100;
const FORM_ANSWER_LOOKUP_CHUNK_SIZE = 500;

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

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

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

  const exportShape = await inspectContactExportShape(context.churchId, filters);

  if (exportShape.rowCount === 0) {
    return new NextResponse("No contacts match the current export filters.", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  // Build dynamic headers
  const headers = [...BASE_CONTACT_HEADERS, ...exportShape.questionLabels];

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
      row_count: exportShape.rowCount
    }
  });

  const fileName = createContactExportFileName();

  if (process.env.SHEPHERDROUTE_DEBUG_EXPORTS === "true") {
    console.log("CSV export rows", {
      churchId: context.churchId,
      filters,
      rowCount: exportShape.rowCount
    });
  }

  return streamCsvResponse(
    fileName,
    headers,
    streamContactRows(context.churchId, filters, exportShape.questionNames)
  );
}

async function inspectContactExportShape(
  churchId: string,
  filters: ContactExportFilters
) {
  const questionOrder = new Map<string, string>();
  let rowCount = 0;
  let page = 1;
  const supabase = await createClient();

  while (true) {
    const result = await getContactsPage(churchId, {
      ...filters,
      page: String(page),
      pageSize: String(EXPORT_BATCH_SIZE)
    });

    rowCount += result.contacts.length;
    await collectQuestionOrderForContacts(
      supabase,
      churchId,
      result.contacts.map((contact) => contact.id),
      questionOrder
    );

    if (!result.contacts.length || page >= result.pageCount) {
      break;
    }

    page += 1;
  }

  const questionNames = Array.from(questionOrder.keys());
  const questionLabels = questionNames.map((name) => questionOrder.get(name) ?? name);

  return { rowCount, questionNames, questionLabels };
}

async function collectQuestionOrderForContacts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  churchId: string,
  contactIds: string[],
  questionOrder: Map<string, string>
) {
  for (const chunk of chunkArray(contactIds, FORM_ANSWER_LOOKUP_CHUNK_SIZE)) {
    if (!chunk.length) {
      continue;
    }

    const { data, error } = await supabase
      .from("contact_form_answers")
      .select("question_name, question_label")
      .eq("church_id", churchId)
      .in("contact_id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const answer of data ?? []) {
      if (!questionOrder.has(answer.question_name)) {
        questionOrder.set(answer.question_name, answer.question_label);
      }
    }
  }
}

async function* streamContactRows(
  churchId: string,
  filters: ContactExportFilters,
  questionNames: string[]
) {
  let page = 1;
  const supabase = await createClient();

  while (true) {
    const result = await getContactsPage(churchId, {
      ...filters,
      page: String(page),
      pageSize: String(EXPORT_BATCH_SIZE)
    });

    const answersMap = await getAnswerMapForContacts(
      supabase,
      churchId,
      result.contacts.map((contact) => contact.id)
    );

    for (const contact of result.contacts) {
      const contactAnswers = answersMap.get(contact.id) || new Map<string, unknown>();
      yield [
        ...contactToCsvRow(contact),
        ...questionNames.map((name) => normalizeCsvAnswer(contactAnswers.get(name)))
      ];
    }

    if (!result.contacts.length || page >= result.pageCount) {
      break;
    }

    page += 1;
  }
}

async function getAnswerMapForContacts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  churchId: string,
  contactIds: string[]
) {
  const answersMap = new Map<string, Map<string, unknown>>();

  for (const chunk of chunkArray(contactIds, FORM_ANSWER_LOOKUP_CHUNK_SIZE)) {
    if (!chunk.length) {
      continue;
    }

    const { data, error } = await supabase
      .from("contact_form_answers")
      .select("contact_id, question_name, answer_display")
      .eq("church_id", churchId)
      .in("contact_id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const answer of data ?? []) {
      if (!answersMap.has(answer.contact_id)) {
        answersMap.set(answer.contact_id, new Map());
      }
      answersMap.get(answer.contact_id)!.set(answer.question_name, answer.answer_display);
    }
  }

  return answersMap;
}

function contactToCsvRow(contact: Awaited<ReturnType<typeof getContactsPage>>["contacts"][number]) {
  const interests = (contact.interests ?? [])
    .map((interest) => interestLabels[interest] ?? interest)
    .join("; ");

  const handlingRole = contact.assigned_handling_role
    ? assignmentRoleLabels[contact.assigned_handling_role as keyof typeof assignmentRoleLabels] ?? contact.assigned_handling_role
    : "";

  const recommendedRole = contact.recommended_assigned_role
    ? assignmentRoleLabels[contact.recommended_assigned_role as keyof typeof assignmentRoleLabels] ?? contact.recommended_assigned_role
    : "";

  return [
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
  ];
}

function createContactExportFileName() {
  const today = new Date().toISOString().slice(0, 10);
  return `shepherdroute-contacts-${today}.csv`;
}
