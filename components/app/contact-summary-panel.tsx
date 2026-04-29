import { InterestPills } from "@/components/app/interest-pills";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import type { ContactDetailResult } from "@/lib/data";

type ContactSummaryPanelProps = {
  contact: ContactDetailResult["contact"];
  error?: string;
};

export function ContactSummaryPanel({ contact, error }: ContactSummaryPanelProps) {
  const assignedMember = Array.isArray(contact.team_members) ? contact.team_members[0] : contact.team_members;

  return (
    <>
      {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <InterestPills interests={contact.contact_interests ?? []} />
      <div className="grid gap-4 rounded-lg bg-muted p-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Area</p>
          <p className="mt-1 font-semibold">{contact.area ?? "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Language</p>
          <p className="mt-1 font-semibold">{contact.language ?? "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Best time</p>
          <p className="mt-1 font-semibold">{contact.best_time_to_contact ?? "No preference"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned to</p>
          <p className="mt-1 font-semibold">{assignedMember?.display_name ?? "Unassigned"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consent</p>
          <p className="mt-1 font-semibold">{contact.consent_given ? "Given" : "Missing"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current status</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <UrgencyBadge urgency={contact.urgency} />
            <StatusBadge status={contact.status} />
          </div>
        </div>
      </div>
    </>
  );
}
