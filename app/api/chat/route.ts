import { NextResponse } from "next/server";
import { getChurchContext, getEventReportSummary } from "@/lib/data";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;
const DEEPSEEK_TIMEOUT_MS = 30_000;
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 10;

const chatRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type ClientChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function parseClientMessages(value: unknown): ClientChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_HISTORY_MESSAGES)
    .flatMap((message) => {
      if (!message || typeof message !== "object") return [];

      const candidate = message as { role?: unknown; content?: unknown };
      const role = candidate.role === "user" || candidate.role === "assistant" ? candidate.role : null;
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";

      if (!role || !content || content.length > MAX_MESSAGE_LENGTH) return [];

      return [{ role, content }];
    });
}

function isReportEventPath(pathname: string | undefined, eventId: string | undefined) {
  return Boolean(pathname?.startsWith("/reports/events/") && eventId);
}

function safeJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function reserveChatRequestSlot(userId: string) {
  const now = Date.now();
  const bucket = chatRateLimitBuckets.get(userId);

  if (!bucket || bucket.resetAt <= now) {
    chatRateLimitBuckets.set(userId, { count: 1, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (bucket.count >= CHAT_RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  bucket.count += 1;
  return true;
}

async function generateDeepSeekReply(prompt: string, history: ClientChatMessage[] = []) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("DeepSeek is not configured.");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash",
      thinking: { type: process.env.DEEPSEEK_THINKING === "enabled" ? "enabled" : "disabled" },
      messages: [
        { role: "system", content: "You are the ShepherdRoute assistant. Keep answers practical, concise, and action-oriented." },
        ...history,
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: process.env.DEEPSEEK_MODEL?.includes("pro") ? 4096 : 1024
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
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

  const payload = body as { message?: unknown; messages?: unknown; pathname?: unknown; eventId?: unknown };
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const history = parseClientMessages(payload.messages);
  const pathname = typeof payload.pathname === "string" ? payload.pathname : undefined;
  const eventId = typeof payload.eventId === "string" ? payload.eventId : undefined;

  if (!message) {
    return safeJson({ error: "Message is required." }, 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return safeJson({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` }, 400);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return safeJson({ error: "Authentication is required." }, 401);
    }

    if (!reserveChatRequestSlot(user.id)) {
      return safeJson({ error: "Too many chat requests. Please wait a minute and try again." }, 429);
    }

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
      const reply = await generateDeepSeekReply(prompt, history);
      return safeJson({ reply });
    } catch (error) {
      console.error("DeepSeek API error:", errorMessage(error));
      return safeJson(
        {
          error:
            "DeepSeek could not generate a response. Check that DEEPSEEK_API_KEY is valid and configured in this environment."
        },
        502
      );
    }
  } catch (error) {
    console.error("Chat API error:", errorMessage(error));
    return safeJson({ error: "Unable to generate a response right now." }, 500);
  }
}
