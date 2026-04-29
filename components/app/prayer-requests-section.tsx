import type { ContactDetailResult } from "@/lib/data";
import { prayerVisibilityLabels, prayerVisibilityNotes, type PrayerVisibility } from "@/lib/followUp";

type PrayerRequestsSectionProps = {
  prayer: ContactDetailResult["prayer"];
};

export function PrayerRequestsSection({ prayer }: PrayerRequestsSectionProps) {
  return (
    <div>
      <h3 className="font-bold">Prayer requests</h3>
      <p className="mt-1 text-sm text-muted-foreground">Kept outside the general contact table for tighter future access control.</p>
      <div className="mt-3 grid gap-2">
        {prayer.map((request) => (
          <div key={request.created_at} className="rounded-lg border bg-white p-3 text-sm leading-6">
            <div className="mb-2 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-slate-700">
              {prayerVisibilityLabels[request.visibility as PrayerVisibility] ?? request.visibility}
              <span className="block font-normal text-muted-foreground">
                {prayerVisibilityNotes[request.visibility as PrayerVisibility] ?? "Access is limited by church role."}
              </span>
            </div>
            {request.request_text}
          </div>
        ))}
        {!prayer.length ? <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">No prayer request recorded.</p> : null}
      </div>
    </div>
  );
}
