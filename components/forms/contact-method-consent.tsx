"use client";

import { contactMethodLabels, contactMethodOptions, type ContactMethod } from "@/lib/constants";

type ContactMethodConsentProps = {
  availableMethods?: ContactMethod[];
  errors?: {
    preferred_contact_methods?: string;
    phone?: string;
    email?: string;
  };
};

export function ContactMethodConsent({
  availableMethods = [...contactMethodOptions],
  errors
}: ContactMethodConsentProps) {
  const methods = contactMethodOptions.filter((method) => availableMethods.includes(method));

  if (!methods.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted p-4">
        <h3 className="font-semibold text-slate-900">Contact permission</h3>
        <p className="mt-1 text-sm text-slate-600">
          Please contact me about the interests I selected using the method(s) I choose below. I understand that I can ask to update my contact preferences or be removed from follow-up at any time.
        </p>
        <div className="mt-3 space-y-2">
          {methods.map((method) => (
            <label key={method} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold">
              <input type="checkbox" name="preferred_contact_methods" value={method} className="h-4 w-4" />
              <span>{contactMethodLabels[method]}</span>
            </label>
          ))}
        </div>
        {errors?.preferred_contact_methods ? (
          <p className="mt-2 text-xs text-rose-600">{errors.preferred_contact_methods}</p>
        ) : null}
      </div>
      <div className="rounded-lg border bg-muted p-4">
        <h3 className="font-semibold text-slate-900">Consent statement</h3>
        <p className="mt-1 text-sm text-slate-600">
          By submitting this form, I consent to being contacted about the interests I selected using my chosen contact method(s). I understand that I can ask to stop receiving follow-up messages at any time.
        </p>
      </div>
    </div>
  );
}
