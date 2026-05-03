import { streamCsvResponse } from "@/lib/csv";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { getChurchContext, getEventReportContactsPage, getEventReportExportMeta } from "@/lib/data";
import { requireEventPermission } from "@/lib/data-event-assignments";
import { slugify } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const EXPORT_BATCH_SIZE = 1000;
const EVENT_EXPORT_HEADERS = ["Name", "Phone", "Area", "Interests", "Status", "Urgency", "Created At"];

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getChurchContext();

  // Check event permission for export
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: appAdmin } = await supabase
    .from('app_admins')
    .select('role')
    .eq('user_id', user?.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from('church_memberships')
    .select('id, role')
    .eq('user_id', user?.id)
    .eq('church_id', context.churchId)
    .eq('status', 'active')
    .maybeSingle();

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('membership_id', membership?.id)
    .maybeSingle();

  try {
    await requireEventPermission({
      userId: user?.id || '',
      eventId: id,
      appRole: appAdmin?.role as any,
      teamRole: teamMember?.role as any || 'viewer',
      permission: 'can_export_reports',
    });
  } catch (error) {
    return new Response("Unauthorized", { status: 403 });
  }

  const event = await getEventReportExportMeta(context.churchId, id);

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  // Audit log before export
  await supabase
    .from("audit_logs")
    .insert({
      church_id: context.churchId,
      user_id: context.userId,
      action: "event_report_export",
      resource_type: "event",
      resource_id: id,
      metadata: { event_name: event.name }
    });

  return streamCsvResponse(`${slugify(event.name)}-${new Date().toISOString().split("T")[0]}-contacts.csv`, EVENT_EXPORT_HEADERS, eventRows(context.churchId, id));
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
