import { Clock3 } from "lucide-react";
import { InterestPills } from "@/components/app/interest-pills";
import type { ContactDetailResult } from "@/lib/data";
import { formatDateTime } from "@/lib/followUp";

type ContactJourneySectionProps = {
  journey: ContactDetailResult["journey"];
};

export function ContactJourneySection({ journey }: ContactJourneySectionProps) {
  return (
    <div>
      <h3 className="font-bold">Person journey</h3>
      <p className="mt-1 text-sm text-muted-foreground">A timeline of event attendance, requests, and pathway moments for this person.</p>
      <div className="mt-3 grid gap-2">
        {journey.map((item) => {
          const event = Array.isArray(item.events) ? item.events[0] : item.events;

          return (
            <div key={item.id} className="rounded-lg border bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{event?.name ?? "Manual pathway"} - {formatDateTime(item.created_at)}</p>
                  {item.summary ? <p className="mt-2 text-sm leading-6">{item.summary}</p> : null}
                </div>
                <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              {item.selected_interests?.length ? (
                <div className="mt-3">
                  <InterestPills interests={item.selected_interests} />
                </div>
              ) : null}
            </div>
          );
        })}
        {!journey.length ? <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">No journey history yet.</p> : null}
      </div>
    </div>
  );
}
