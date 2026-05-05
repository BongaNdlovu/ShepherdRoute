"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  History,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X
} from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

const CHAT_STORAGE_KEY = "shepherdroute.deepseek.chat.sessions.v1";
const ACTIVE_CHAT_STORAGE_KEY = "shepherdroute.deepseek.chat.activeSessionId.v1";
const MAX_HISTORY_MESSAGES = 10;

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptySession(): ChatSession {
  const now = new Date().toISOString();

  return {
    id: newId(),
    title: "New chat",
    messages: [],
    archived: false,
    createdAt: now,
    updatedAt: now
  };
}

function deriveTitle(message: string) {
  const trimmed = message.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed || "New chat";
}

function loadSessions() {
  if (typeof window === "undefined") return [createEmptySession()];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHAT_STORAGE_KEY) || "[]") as ChatSession[];
    return parsed.length ? parsed : [createEmptySession()];
  } catch {
    return [createEmptySession()];
  }
}

function saveSessions(sessions: ChatSession[], activeSessionId: string) {
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeSessionId);
}

const REPORT_EVENT_PATH_PREFIX = "/reports/events/";

function eventIdFromPathname(pathname: string) {
  if (!pathname.startsWith(REPORT_EVENT_PATH_PREFIX)) return undefined;

  return pathname.slice(REPORT_EVENT_PATH_PREFIX.length).split("/")[0] || undefined;
}

export function DeepSeekChatWidget() {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const eventId = useMemo(() => eventIdFromPathname(pathname), [pathname]);
  const isReportAware = Boolean(eventId);

  useEffect(() => {
    const loaded = loadSessions();
    const storedActiveId = window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
    const activeId = loaded.some((session) => session.id === storedActiveId)
      ? storedActiveId!
      : loaded[0].id;

    setSessions(loaded);
    setActiveSessionId(activeId);
  }, []);

  useEffect(() => {
    if (sessions.length && activeSessionId) {
      saveSessions(sessions, activeSessionId);
    }
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const visibleSessions = sessions.filter((session) => !session.archived);
  const archivedSessions = sessions.filter((session) => session.archived);
  const activeVisibleIndex = visibleSessions.findIndex((session) => session.id === activeSession?.id);
  const canGoBack = activeVisibleIndex > 0;
  const canGoForward = activeVisibleIndex >= 0 && activeVisibleIndex < visibleSessions.length - 1;

  function updateActiveSession(updater: (session: ChatSession) => ChatSession) {
    setSessions((current) =>
      current.map((session) => (session.id === activeSessionId ? updater(session) : session))
    );
  }

  function startNewChat() {
    const session = createEmptySession();
    setSessions((current) => [session, ...current]);
    setActiveSessionId(session.id);
    setShowHistory(false);
    setError(null);
  }

  function deleteActiveChat() {
    if (!activeSession) return;

    const nextSessions = sessions.filter((session) => session.id !== activeSession.id);
    const replacement = nextSessions.find((session) => !session.archived) ?? nextSessions[0] ?? createEmptySession();

    setSessions(nextSessions.length ? nextSessions : [replacement]);
    setActiveSessionId(replacement.id);
    setShowHistory(false);
  }

  function archiveActiveChat() {
    if (!activeSession) return;

    updateActiveSession((session) => ({
      ...session,
      archived: true,
      updatedAt: new Date().toISOString()
    }));

    const replacement = visibleSessions.find((session) => session.id !== activeSession.id) ?? createEmptySession();

    if (!sessions.some((session) => session.id === replacement.id)) {
      setSessions((current) => [replacement, ...current]);
    }

    setActiveSessionId(replacement.id);
  }

  function restoreChat(sessionId: string) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId ? { ...session, archived: false, updatedAt: new Date().toISOString() } : session
      )
    );
    setActiveSessionId(sessionId);
    setShowHistory(false);
  }

  function navigateChat(direction: "back" | "forward") {
    const nextIndex = direction === "back" ? activeVisibleIndex - 1 : activeVisibleIndex + 1;
    const nextSession = visibleSessions[nextIndex];

    if (nextSession) {
      setActiveSessionId(nextSession.id);
      setShowHistory(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message || isLoading) return;

    setInput("");
    setError(null);

    const history = activeSession?.messages.slice(-MAX_HISTORY_MESSAGES) ?? [];
    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString()
    };

    updateActiveSession((session) => ({
      ...session,
      title: session.messages.length ? session.title : deriveTitle(message),
      messages: [...session.messages, userMessage],
      updatedAt: userMessage.createdAt
    }));

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          messages: history.map(({ role, content }) => ({ role, content })),
          pathname,
          eventId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Chat request failed.");
      }

      const assistantMessage: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: String(data.reply ?? ""),
        createdAt: new Date().toISOString()
      };

      updateActiveSession((session) => ({
        ...session,
        messages: [...session.messages, assistantMessage],
        updatedAt: assistantMessage.createdAt
      }));
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Chat request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 md:bottom-6 md:left-auto md:right-6">
      {isOpen ? (
        <section className="ml-auto flex h-[32rem] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border/70 bg-white shadow-2xl md:w-96">
          <header className="flex flex-col gap-3 border-b bg-sky-500 p-4 text-white sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5">
                <BrandLogo className="h-full w-full object-contain" priority />
              </div>
              <div className="min-w-0">
                <h2 className="font-black">ShepherdRoute AI</h2>
                <p className="text-xs text-white/70">
                  {isReportAware ? "Ask what should happen next from this report." : "Ask about workflows, reports, and follow-up."}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-1 sm:justify-end">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Chat history" aria-label="Chat history" onClick={() => setShowHistory((value) => !value)}>
                <History className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Back" aria-label="Previous chat" disabled={!canGoBack} onClick={() => navigateChat("back")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Forward" aria-label="Next chat" disabled={!canGoForward} onClick={() => navigateChat("forward")}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="New chat" aria-label="New chat" onClick={startNewChat}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Archive chat" aria-label="Archive chat" onClick={archiveActiveChat}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Delete chat" aria-label="Delete chat" onClick={deleteActiveChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Close" aria-label="Close chat" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {showHistory ? (
            <div className="border-b bg-white p-3 text-sm">
              <p className="mb-2 font-bold">Chat history</p>
              <div className="grid max-h-48 gap-2 overflow-y-auto sidebar-scroll">
                {visibleSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted",
                      session.id === activeSessionId && "bg-muted font-semibold"
                    )}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setShowHistory(false);
                    }}
                  >
                    <span className="block truncate">{session.title}</span>
                    <span className="text-xs text-muted-foreground">{session.messages.length} messages</span>
                  </button>
                ))}

                {archivedSessions.length ? <p className="pt-2 text-xs font-bold uppercase text-muted-foreground">Archived</p> : null}

                {archivedSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => restoreChat(session.id)}
                  >
                    <span className="truncate">{session.title}</span>
                    <ArchiveRestore className="h-4 w-4 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sidebar-scroll">
            {!activeSession?.messages.length ? (
              <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                {isReportAware
                  ? "Try: What are the top three follow-up actions from this report?"
                  : "Try: How should our team use reports after an event?"}
              </div>
            ) : null}
            {activeSession?.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl p-3 text-sm leading-6",
                  message.role === "user" ? "ml-8 bg-slate-950 text-white" : "mr-8 bg-muted text-foreground"
                )}
              >
                {message.content}
              </div>
            ))}
            {isLoading ? (
              <div className="mr-8 flex items-center gap-2 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            ) : null}
            {error ? <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t p-3">
            <div className="flex min-w-0 gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={isReportAware ? "Ask what should happen next..." : "Ask ShepherdRoute AI..."}
                className="min-h-11 min-w-0 resize-none"
                maxLength={2000}
              />
              <Button type="submit" size="icon" className="shrink-0" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <Button type="button" className="h-14 w-14 rounded-full shadow-2xl" size="icon" onClick={() => setIsOpen(true)}>
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
