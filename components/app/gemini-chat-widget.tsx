"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const REPORT_EVENT_PATH_PREFIX = "/reports/events/";

function eventIdFromPathname(pathname: string) {
  if (!pathname.startsWith(REPORT_EVENT_PATH_PREFIX)) return undefined;

  return pathname.slice(REPORT_EVENT_PATH_PREFIX.length).split("/")[0] || undefined;
}

export function GeminiChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventId = useMemo(() => eventIdFromPathname(pathname), [pathname]);
  const isReportAware = Boolean(eventId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message || isLoading) return;

    setInput("");
    setError(null);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, pathname, eventId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Chat request failed.");
      }

      setMessages((current) => [...current, { role: "assistant", content: String(data.reply ?? "") }]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Chat request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {isOpen ? (
        <section className="flex h-[32rem] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-border/70 bg-white shadow-2xl md:w-96">
          <header className="flex items-start justify-between gap-3 border-b bg-slate-950 p-4 text-white">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white p-1.5">
                <BrandLogo className="h-full w-full object-contain" priority />
              </div>
              <div>
                <h2 className="font-black">ShepherdRoute AI</h2>
                <p className="text-xs text-white/70">
                  {isReportAware ? "Ask what should happen next from this report." : "Ask about workflows, reports, and follow-up."}
                </p>
              </div>
            </div>
            <Button type="button" size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {!messages.length ? (
              <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                {isReportAware
                  ? "Try: What are the top three follow-up actions from this report?"
                  : "Try: How should our team use reports after an event?"}
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
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
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={isReportAware ? "Ask what should happen next..." : "Ask ShepherdRoute AI..."}
                className="min-h-11 resize-none"
                maxLength={2000}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <Button type="button" className="h-14 w-14 rounded-full shadow-2xl opacity-50 cursor-not-allowed" size="icon" disabled onClick={() => setIsOpen(true)}>
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
