"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { updateContactLifecycleAction } from "@/app/(dashboard)/actions";
import { InterestPills } from "@/components/app/interest-pills";
import { DeleteContactConfirmModal } from "@/components/app/delete-contact-confirm-modal";
import { StatusBadge, UrgencyBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { consentScopeLabels, formatDateTime } from "@/lib/followUp";
import { contactMethodLabels, assignmentRoleLabels } from "@/lib/constants";
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
      {contact.duplicate_of_contact_id ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-bold">This person already exists. This event was added to their journey.</p>
              <p className="mt-1">
                {contact.duplicate_match_reason ?? "Matched to an existing person."}
                {contact.duplicate_match_confidence ? ` Confidence ${Math.round(contact.duplicate_match_confidence * 100)}%.` : ""}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {contact.assigned_to ? null : (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-bold">No one is assigned.</p>
          <p className="mt-1">Assign this contact so follow-up has a clear owner.</p>
        </div>
      )}
      {contact.do_not_contact ? (
        <div className="rounded-lg border border-slate-300 bg-slate-100 p-4 text-sm text-slate-800">
          <p className="font-bold">Do not contact</p>
          <p className="mt-1">This person should not receive WhatsApp, phone, or email follow-up.</p>
        </div>
      ) : null}
      <InterestPills interests={contact.contact_interests ?? []} />
      <div className="grid gap-4 rounded-lg bg-muted p-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</p>
          <p className="mt-1 font-semibold">{contact.email ?? "Not provided"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</p>
          <p className="mt-1 font-semibold">{contact.whatsapp_number ?? contact.phone ?? "No phone number"}</p>
        </div>
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
          <p className="mt-1 font-semibold">
            {contact.assigned_handling_role
              ? assignmentRoleLabels[contact.assigned_handling_role as keyof typeof assignmentRoleLabels] ?? contact.assigned_handling_role
              : assignedMember?.display_name ?? "Unassigned"}
          </p>
          {contact.assigned_handling_role && assignedMember?.display_name ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Person: {assignedMember.display_name}
            </p>
          ) : null}
          {contact.recommended_assigned_role && contact.recommended_assigned_role !== contact.assigned_handling_role ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Recommended: {assignmentRoleLabels[contact.recommended_assigned_role as keyof typeof assignmentRoleLabels] ?? contact.recommended_assigned_role}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consent</p>
          <p className="mt-1 font-semibold">{contact.consent_given ? `Given ${formatDateTime(contact.consent_at)}` : "Missing"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Source: {contact.consent_source ?? "Unknown"}</p>
          {contact.consent_status && (
            <p className="mt-1 text-xs text-muted-foreground">Status: {contact.consent_status}</p>
          )}
          {contact.privacy_policy_version && (
            <p className="mt-1 text-xs text-muted-foreground">Policy: {contact.privacy_policy_version}</p>
          )}
          {contact.preferred_contact_methods && contact.preferred_contact_methods.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Preferred: {contact.preferred_contact_methods.map((method: string) => contactMethodLabels[method as keyof typeof contactMethodLabels] ?? method).join(", ")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">No contact preference recorded</p>
          )}
          {contact.consent_scope?.length ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Scope: {contact.consent_scope.map((scope) => consentScopeLabels[scope] ?? scope).join(", ")}
            </p>
          ) : null}
          {contact.consent_text_snapshot && (
            <p className="mt-1 text-xs text-muted-foreground max-w-md truncate" title={contact.consent_text_snapshot}>
              &quot;{contact.consent_text_snapshot}&quot;
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current status</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <UrgencyBadge urgency={contact.urgency} />
            <StatusBadge status={contact.status} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Consent, opt-out, archive, and soft-delete controls.
        </div>
        <form action={updateContactLifecycleAction}>
          <input type="hidden" name="contactId" value={contact.id} />
          <input type="hidden" name="intent" value="do_not_contact" />
          <Button type="submit" size="sm" variant="outline" disabled={contact.do_not_contact}>Do not contact</Button>
        </form>
        <form action={updateContactLifecycleAction}>
          <input type="hidden" name="contactId" value={contact.id} />
          <input type="hidden" name="intent" value="archive" />
          <Button type="submit" size="sm" variant="outline">Archive</Button>
        </form>
        <form action={updateContactLifecycleAction}>
          <input type="hidden" name="contactId" value={contact.id} />
          <input type="hidden" name="intent" value="delete" />
          <DeleteContactConfirmModal contactId={contact.id} contactName={contact.full_name} onConfirm={(contactId) => {
            const formData = new FormData();
            formData.append("contactId", contactId);
            formData.append("intent", "delete");
            updateContactLifecycleAction(formData);
          }} />
        </form>
      </div>
    </>
  );
}
