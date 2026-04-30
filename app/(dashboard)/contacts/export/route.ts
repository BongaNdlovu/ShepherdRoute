import { getChurchContext, getContacts } from "@/lib/data";
import { csvResponse, toCsv } from "@/lib/csv";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";

export async function GET(request: Request) {
  const context = await getChurchContext();
  const url = new URL(request.url);
  const filters = {
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    interest: url.searchParams.get("interest") ?? undefined,
    event: url.searchParams.get("event") ?? undefined,
    assignedTo: url.searchParams.get("assignedTo") ?? undefined
  };
  const contacts = await getContacts(context.churchId, filters);

  const rows = contacts.map((contact) => {
    const interests = (contact.interests ?? [])
      .map((interest: Interest) => interestLabels[interest])
      .join("; ");

    return [
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
  });

  return csvResponse(
    "shepherdroute-contacts.csv",
    toCsv(
      ["Name", "Phone", "Email", "Area", "Language", "Event", "Interests", "Status", "Urgency", "Assigned To", "Do Not Contact", "Journey Match", "Best Time", "Created At"],
      rows
    )
  );
}
