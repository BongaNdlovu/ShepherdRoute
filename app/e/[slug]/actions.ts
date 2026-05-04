"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrationSchema, validatePublicEventRegistration } from "@/lib/public-events/validation";

export async function submitRegistrationAction(formData: FormData) {
  const parsed = registrationSchema.safeParse({
    slug: formData.get("slug"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    area: formData.get("area") || undefined,
    language: formData.get("language") || undefined,
    bestTimeToContact: formData.get("bestTimeToContact") || undefined,
    interests: formData.getAll("interests").map(String),
    message: formData.get("message") || undefined,
    visitorType: formData.get("visitorType") || "general",
    templateType: formData.get("templateType") || "general",
    topic: formData.get("topic") || undefined,
    prayerVisibility: formData.get("prayerVisibility") || undefined,
    preferred_contact_methods: formData.getAll("preferred_contact_methods").map(String),
    consentTextSnapshot: formData.get("consentTextSnapshot") || undefined,
    privacyPolicyVersion: formData.get("privacyPolicyVersion") || undefined
  });

  if (!parsed.success) {
    redirect(`/e/${formData.get("slug")}?error=Please%20add%20your%20name%20and%20consent.`);
  }

  const validation = await validatePublicEventRegistration(parsed.data, formData);

  if ("error" in validation) {
    redirect(`/e/${parsed.data.slug}?error=${encodeURIComponent(validation.error)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_event_registration", {
    p_slug: parsed.data.slug,
    p_full_name: parsed.data.fullName,
    p_phone: validation.data.phone ?? null,
    p_email: validation.data.email ?? null,
    p_area: validation.data.finalArea,
    p_language: validation.data.finalLanguage,
    p_best_time_to_contact: validation.data.finalBestTime,
    p_interests: validation.data.selectedInterests,
    p_message: validation.data.finalMessage,
    p_urgency: validation.data.classification.urgency,
    p_classification_payload: validation.data.classificationPayload,
    p_prayer_visibility: validation.data.finalPrayerVisibility,
    p_consent_scope: ["follow_up"],
    p_preferred_contact_methods: parsed.data.preferred_contact_methods,
    p_consent_source: validation.data.classificationPayload.template_type,
    p_consent_given: true,
    p_consent_text_snapshot: validation.data.consentTextSnapshot,
    p_privacy_policy_version: parsed.data.privacyPolicyVersion ?? "contact-consent-v1",
    p_consent_status: "given",
    p_consent_recorded_by: null,
    p_form_answers: validation.data.formAnswers,
    p_recommended_assigned_role: validation.data.classification.recommended_assigned_role
  });

  if (error) {
    redirect(`/e/${parsed.data.slug}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/e/${parsed.data.slug}?submitted=true`);
}
