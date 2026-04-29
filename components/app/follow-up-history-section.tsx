import { CalendarClock } from "lucide-react";
import type { ContactDetailResult } from "@/lib/data";

type FollowUpHistorySectionProps = {
  followUps: ContactDetailResult["followUps"];
};

export function FollowUpHistorySection({ followUps }: FollowUpHistorySectionProps) {
  return (
    <div>
      <h3 className="font-bold">Follow-up history</h3>
      <div className="mt-3 grid gap-2">
        {followUps.map((item) => {
          const assigned = Array.isArray(item.team_members) ? item.team_members[0] : item.team_members;
          return (
            <div key={item.id} className="rounded-lg border bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{item.channel} - {item.status}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              {assigned?.display_name ? <p className="mt-1 text-muted-foreground">Assigned to {assigned.display_name}</p> : null}
              {item.notes ? <p className="mt-2 leading-6">{item.notes}</p> : null}
              {item.next_action ? <p className="mt-2 text-muted-foreground">Next: {item.next_action}</p> : null}
              {item.due_at ? (
                <p className="mt-2 flex items-center gap-1 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Due {new Date(item.due_at).toLocaleString()}
                </p>
              ) : null}
              {item.completed_at ? <p className="mt-2 font-semibold text-emerald-700">Completed</p> : null}
            </div>
          );
        })}
        {!followUps.length ? <p className="rounded-lg border bg-white p-3 text-sm text-muted-foreground">No follow-up activity yet.</p> : null}
      </div>
    </div>
  );
}
