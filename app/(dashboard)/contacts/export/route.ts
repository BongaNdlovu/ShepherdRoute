import { getChurchContext, getContactsPage } from "@/lib/data";
import { streamCsvResponse } from "@/lib/csv";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";

const EXPORT_BATCH_SIZE = 100;
const CONTACT_EXPORT_HEADERS = ["Name", "Phone", "Email", "Area", "Language", "Event", "Interests", "Status", "Urgency", "Assigned To", "Do Not Contact", "Journey Match", "Best Time", "Created At"];

type ContactExportFilters = {
  q?: string;
  status?: string;
  interest?: string;
  event?: string;
  assignedTo?: string;
};

export async function GET(request: Request) {
  const context = await getChurchContext();
  const url = new URL(request.url);
  const filters: ContactExportFilters = {
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    interest: url.searchParams.get("interest") ?? undefined,
    event: url.searchParams.get("event") ?? undefined,
    assignedTo: url.searchParams.get("assignedTo") ?? undefined
  };

  return streamCsvResponse("shepherdroute-contacts.csv", CONTACT_EXPORT_HEADERS, contactRows(context.churchId, filters));
}

async function* contactRows(churchId: string, filters: ContactExportFilters) {
  let page = 1;

  while (true) {
    const result = await getContactsPage(churchId, {
      ...filters,
      page: String(page),
      pageSize: String(EXPORT_BATCH_SIZE)
    });

    for (const contact of result.contacts) {
      const interests = (contact.interests ?? [])
        .map((interest: Interest) => interestLabels[interest])
        .join("; ");

      yield [
        contact.full_name,
        contact.phone,
        contact.email ?? "",
        contact.area ?? "",
        contact.language ?? "",
        contact.event_name ?? "Manual contact",
        interests,
        statusLabels[contact.status as FollowUpStatus],
        contact.urgency,
        contact.assigned_name ?? "Unassigned",
        contact.do_not_contact ? "Yes" : "No",
        contact.duplicate_of_contact_id ? "Yes" : "No",
        contact.best_time_to_contact ?? "",
        contact.created_at
      ];
    }

    if (!result.contacts.length || page >= result.pageCount) {
      break;
    }

    page += 1;
  }
}
