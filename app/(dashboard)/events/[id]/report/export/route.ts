import { streamCsvResponse } from "@/lib/csv";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReportContactsPage, getEventReportExportMeta } from "@/lib/data";
import { slugify } from "@/lib/utils";

const EXPORT_BATCH_SIZE = 1000;
const EVENT_EXPORT_HEADERS = ["Name", "Phone", "Area", "Interests", "Status", "Urgency", "Created At"];

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getChurchContext();
  const event = await getEventReportExportMeta(context.churchId, id);

  return streamCsvResponse(`${slugify(event.name)}-report.csv`, EVENT_EXPORT_HEADERS, eventRows(context.churchId, id));
}

async function* eventRows(churchId: string, eventId: string) {
  let offset = 0;

  while (true) {
    const contacts = await getEventReportContactsPage(churchId, eventId, offset, EXPORT_BATCH_SIZE);

    for (const contact of contacts) {
      const interests = (contact.contact_interests ?? [])
        .map((item: { interest: Interest }) => interestLabels[item.interest])
        .join("; ");

      yield [
        contact.full_name,
        contact.phone,
        contact.area ?? "",
        interests,
        statusLabels[contact.status as FollowUpStatus],
        contact.urgency,
        contact.created_at
      ];
    }

    if (contacts.length < EXPORT_BATCH_SIZE) {
      break;
    }

    offset += EXPORT_BATCH_SIZE;
  }
}
