import { getChurchContext, getEventReportSummary } from "@/lib/data";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { getEventTemplate } from "@/lib/eventTemplates";
import { buildEventReportDocument, wordDocumentResponse } from "@/lib/report-document";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getChurchContext();
  const supabase = await createClient();

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_export_reports"
    });
  } catch {
    return new Response("Unauthorized", { status: 403 });
  }

  const { event, summary } = await getEventReportSummary(context.churchId, id);
  const template = getEventTemplate(event.event_type);

  await supabase
    .from("audit_logs")
    .insert({
      church_id: context.churchId,
      actor_user_id: context.userId,
      action: "event_report_word_export",
      target_type: "event",
      target_id: id,
      metadata: { event_name: event.name }
    });

  const html = buildEventReportDocument({
    event,
    summary,
    template,
    workspace: {
      churchName: context.churchName,
      workspaceLabel: context.workspaceLabel,
      workspaceType: context.workspaceType
    }
  });

  return wordDocumentResponse(event.name, html);
}
