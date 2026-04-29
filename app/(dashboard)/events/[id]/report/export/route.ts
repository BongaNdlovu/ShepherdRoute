import { getChurchContext, getEventReportContacts } from "@/lib/data";
import { csvResponse, toCsv } from "@/lib/csv";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getChurchContext();
  const { event, contacts } = await getEventReportContacts(context.churchId, id);
  const rows = contacts.map((contact) => {
    const interests = (contact.contact_interests ?? [])
      .map((item: { interest: Interest }) => interestLabels[item.interest])
      .join("; ");

    return [
      contact.full_name,
      contact.phone,
      contact.area ?? "",
      interests,
      statusLabels[contact.status as FollowUpStatus],
      contact.urgency,
      contact.created_at
    ];
  });

  return csvResponse(
    `${slugify(event.name)}-report.csv`,
    toCsv(["Name", "Phone", "Area", "Interests", "Status", "Urgency", "Created At"], rows)
  );
}
