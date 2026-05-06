"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPublicChurch } from "@/lib/data-public";

const schema = z.object({
  churchSlug: z.string().min(1),
  requestType: z.enum(["correction", "deletion", "export", "restriction"]),
  requesterName: z.string().trim().min(2, "Name must be at least 2 characters").max(140, "Name is too long"),
  requesterContact: z.string().trim().min(3, "Contact must be at least 3 characters").max(180, "Contact is too long"),
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").optional(),
  website: z.string().optional(), // honeypot field
});

function privacyRequestPath(churchSlug: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams();

  if (churchSlug) {
    searchParams.set("church", churchSlug);
  }

  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  return `?${searchParams.toString()}`;
}

export async function submitPublicDataRequestAction(formData: FormData) {
  const parsed = schema.safeParse({
    churchSlug: formData.get("churchSlug"),
    requestType: formData.get("requestType"),
    requesterName: formData.get("requesterName"),
    requesterContact: formData.get("requesterContact"),
    notes: formData.get("notes"),
    website: formData.get("website"),
  });

  if (!parsed.success) {
    const churchSlug = typeof formData.get("churchSlug") === "string" ? String(formData.get("churchSlug")) : "";
    redirect(privacyRequestPath(churchSlug, { error: parsed.error.errors[0].message }));
  }

  const { churchSlug, requestType, requesterName, requesterContact, notes, website } = parsed.data;

  // Honeypot check: if website field is filled, it's likely a bot
  if (website && website.trim().length > 0) {
    redirect(privacyRequestPath(churchSlug, { submitted: "true" }));
  }

  const church = await getPublicChurch(churchSlug);
  if (!church) {
    redirect(privacyRequestPath(churchSlug, { error: "Invalid church" }));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_public_data_request", {
    p_church_id: church.id,
    p_request_type: requestType,
    p_requester_name: requesterName,
    p_requester_contact: requesterContact,
    p_notes: notes?.trim() || null,
  });

  if (error) {
    redirect(privacyRequestPath(churchSlug, { error: error.message }));
  }

  redirect(privacyRequestPath(churchSlug, { submitted: "true" }));
}
