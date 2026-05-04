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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function generateGeminiReply(apiKey: string, prompt: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = Array.from(
    new Set([
      process.env.GEMINI_MODEL?.trim(),
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ].filter(Boolean))
  ) as string[];
  let lastError: unknown;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.error(`Gemini API error (${modelName}):`, errorMessage(error));
    }
  }

  throw new Error(`Gemini failed for all configured models. Last error: ${errorMessage(lastError)}`);
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

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return safeJson({ error: "Gemini is not configured." }, 503);
  }

  try {
    let prompt = `You are the ShepherdRoute assistant. Help users understand the ShepherdRoute app, church follow-up workflows, event reporting, visitor care, and ministry accountability. Keep answers practical, concise, and action-oriented. User question: ${message}`;

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

    try {
      const reply = await generateGeminiReply(apiKey, prompt);
      return safeJson({ reply });
    } catch (error) {
      console.error("Gemini API error:", errorMessage(error));
      return safeJson(
        {
          error:
            "Gemini could not generate a response. Check that GEMINI_API_KEY is valid, enabled for Gemini, and configured in this environment."
        },
        502
      );
    }
  } catch (error) {
    console.error("Chat API error:", errorMessage(error));
    return safeJson({ error: "Unable to generate a response right now." }, 500);
  }
}
