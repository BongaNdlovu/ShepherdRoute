"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { intakeSubmissionSchema, validatePublicIntakeSubmission } from "@/lib/intake/validation";
import { reservePublicFormRateLimitSlot } from "@/lib/public-events/rate-limit";

export async function submitIntakeAction(formData: FormData) {
  const website = formData.get("website");
  const slug = String(formData.get("slug") || "");

  if (website && String(website).trim().length > 0) {
    redirect(`/e/${slug}/intake?submitted=true`);
  }

  const parsed = intakeSubmissionSchema.safeParse({
    slug,
    category: formData.get("category"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    preferred_contact_method: formData.get("preferred_contact_method") || "whatsapp",
    answersJson: formData.get("answersJson") || "{}",
    consentTextSnapshot: formData.get("consentTextSnapshot") || undefined,
    privacyPolicyVersion: formData.get("privacyPolicyVersion") || undefined
  });

  if (!parsed.success) {
    redirect(`/e/${slug}/intake?error=Please%20add%20your%20name%20and%20WhatsApp%20number.`);
  }

  const validation = await validatePublicIntakeSubmission(parsed.data);

  if ("error" in validation) {
    redirect(`/e/${parsed.data.slug}/intake?error=${encodeURIComponent(validation.error)}`);
  }

  const allowed = await reservePublicFormRateLimitSlot(parsed.data.slug);
  if (!allowed) {
    redirect(`/e/${parsed.data.slug}/intake?error=Too%20many%20submissions.%20Please%20try%20again%20later.`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_event_registration", {
    p_slug: parsed.data.slug,
    p_full_name: parsed.data.fullName,
    p_phone: validation.data.phone ?? null,
    p_email: validation.data.email ?? null,
    p_area: validation.data.finalArea ?? null,
    p_language: validation.data.finalLanguage,
    p_best_time_to_contact: validation.data.finalBestTime ?? null,
    p_interests: validation.data.selectedInterests,
    p_message: validation.data.finalMessage ?? null,
    p_urgency: validation.data.classificationPayload.urgency,
    p_classification_payload: validation.data.classificationPayload,
    p_prayer_visibility: validation.data.finalPrayerVisibility,
    p_consent_scope: ["follow_up"],
    p_preferred_contact_methods: validation.data.preferredContactMethods,
    p_consent_source: "smart_intake",
    p_consent_given: true,
    p_consent_text_snapshot: validation.data.consentTextSnapshot,
    p_privacy_policy_version: parsed.data.privacyPolicyVersion ?? "contact-consent-v1",
    p_consent_status: "given",
    p_consent_recorded_by: null,
    p_form_answers: validation.data.formAnswers,
    p_recommended_assigned_role: validation.data.classificationPayload.recommended_assigned_role,
    p_intake_response: validation.data.intakeResponse
  });

  if (error) {
    console.error("Smart intake submission error:", error);
    redirect(`/e/${parsed.data.slug}/intake?error=Could%20not%20submit%20your%20request.%20Please%20try%20again.`);
  }

  redirect(`/e/${parsed.data.slug}/intake?submitted=true`);
}
