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
    const event = Array.isArray(contact.events) ? contact.events[0] : contact.events;
    const assigned = Array.isArray(contact.team_members) ? contact.team_members[0] : contact.team_members;
    const interests = (contact.contact_interests ?? [])
      .map((item: { interest: Interest }) => interestLabels[item.interest])
      .join("; ");

    return [
      contact.full_name,
      contact.phone,
      contact.area ?? "",
      contact.language ?? "",
      event?.name ?? "Manual contact",
      interests,
      statusLabels[contact.status as FollowUpStatus],
      contact.urgency,
      assigned?.display_name ?? "Unassigned",
      contact.best_time_to_contact ?? "",
      contact.created_at
    ];
  });

  return csvResponse(
    "shepardroute-contacts.csv",
    toCsv(
      ["Name", "Phone", "Area", "Language", "Event", "Interests", "Status", "Urgency", "Assigned To", "Best Time", "Created At"],
      rows
    )
  );
}
