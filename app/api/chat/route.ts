import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getChurchContext, getEventReportSummary } from "@/lib/data";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";

const MAX_MESSAGE_LENGTH = 2000;

function isReportEventPath(pathname: string | undefined, eventId: string | undefined) {
  return Boolean(pathname?.startsWith("/reports/events/") && eventId);
}

function safeJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return safeJson({ error: "Invalid JSON body." }, 400);
  }

  if (!body || typeof body !== "object") {
    return safeJson({ error: "Invalid request body." }, 400);
  }

  const payload = body as { message?: unknown; pathname?: unknown; eventId?: unknown };
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const pathname = typeof payload.pathname === "string" ? payload.pathname : undefined;
  const eventId = typeof payload.eventId === "string" ? payload.eventId : undefined;

  if (!message) {
    return safeJson({ error: "Message is required." }, 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return safeJson({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return safeJson({ error: "Gemini is not configured." }, 503);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    let prompt = `You are the ShepherdRoute assistant. Help users understand the Guestloop/ShepherdRoute app, church follow-up workflows, event reporting, visitor care, and ministry accountability. Keep answers practical, concise, and action-oriented. User question: ${message}`;

    if (isReportEventPath(pathname, eventId)) {
      const context = await getChurchContext();

      await requireCurrentUserEventPermission({
        churchId: context.churchId,
        eventId: eventId!,
        permission: "can_view_reports"
      });

      const { event, summary } = await getEventReportSummary(context.churchId, eventId!);

      prompt = `You are the ShepherdRoute report interpretation assistant. Interpret this detailed event report only in terms of what should happen going forward. Give prioritized next actions for church/ministry leaders. Do not invent private data that is not in the report.

Workspace: ${context.churchName} (${context.workspaceLabel})
Event: ${event.name}
User question: ${message}

Report summary:
${JSON.stringify(summary, null, 2)}

Respond with:
1. A short interpretation.
2. 3-6 prioritized recommended actions.
3. Any risks or gaps the team should address.`;
    }

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return safeJson({ reply });
  } catch {
    return safeJson({ error: "Unable to generate a response right now." }, 500);
  }
}
