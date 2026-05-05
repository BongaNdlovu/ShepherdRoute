"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registrationSchema, validatePublicEventRegistration } from "@/lib/public-events/validation";

async function hashIP(ip: string, salt: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(`${ip}${salt}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIP = headersList.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

async function checkRateLimit(slug: string): Promise<boolean> {
  const ip = await getClientIP();
  const salt = process.env.PUBLIC_FORM_RATE_LIMIT_SALT || "default-salt";
  const ipHash = await hashIP(ip, salt);
  
  const supabase = await createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("public_form_submissions")
    .select("id")
    .eq("slug", slug)
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);
  
  if (error) {
    console.error("Rate limit check error:", error);
    return true; // Allow on error to be safe
  }
  
  // Allow 5 submissions per hour per IP
  if (data && data.length >= 5) {
    return false;
  }
  
  // Record this submission
  await supabase.from("public_form_submissions").insert({
    slug,
    ip_hash: ipHash
  });
  
  return true;
}

export async function submitRegistrationAction(formData: FormData) {
  // Honeypot check: if website field is filled, it's likely a bot
  const website = formData.get("website");
  if (website && String(website).trim().length > 0) {
    // Silently redirect to success to confuse bots
    redirect(`/e/${formData.get("slug")}?submitted=true`);
  }

  // Rate limit check
  const slug = String(formData.get("slug"));
  const isAllowed = await checkRateLimit(slug);
  if (!isAllowed) {
    redirect(`/e/${slug}?error=Too%20many%20submissions.%20Please%20try%20again%20later.`);
  }

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
    p_preferred_contact_methods: validation.data.preferredContactMethods,
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
