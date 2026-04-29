import type { ContactDetailResult } from "@/lib/data";

type GeneratedMessagesSectionProps = {
  messages: ContactDetailResult["messages"];
};

export function GeneratedMessagesSection({ messages }: GeneratedMessagesSectionProps) {
  return (
    <div>
      <h3 className="font-bold">Generated messages</h3>
      <div className="mt-3 grid gap-2">
        {messages.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-3 text-sm leading-6">
            {item.message_text}
          </div>
        ))}
        {!messages.length ? <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">No generated messages saved yet. The current WhatsApp text is generated live.</p> : null}
      </div>
    </div>
  );
}
