"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { classifyContact, type VisitorType } from "@/lib/classifyContact";
import { eventTemplateTypes } from "@/lib/eventTemplates";
import { prayerVisibilityOptions } from "@/lib/followUp";
import { contactMethodOptions } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getPublicEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import { getEffectiveFormConfig } from "@/lib/eventCustomization";

const visitorTypeOptions = [
  ...eventTemplateTypes,
  "bible_study",
  "church_service",
  "visitor_sabbath",
  "community_outreach",
  "other",
  "general"
] as const;

const ContactMethodEnum = z.enum(contactMethodOptions);

const registrationSchema = z.object({
  slug: z.string().min(2),
  fullName: z.string().min(2).max(140),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(160).optional(),
  area: z.string().max(120).optional(),
  language: z.string().max(80).optional(),
  bestTimeToContact: z.string().max(120).optional(),
  interests: z.array(z.string()).optional(),
  message: z.string().max(2000).optional(),
  visitorType: z.enum(visitorTypeOptions).default("general"),
  templateType: z.enum(visitorTypeOptions).default("general"),
  topic: z.string().max(120).optional(),
  prayerVisibility: z.enum(prayerVisibilityOptions).optional(),
  preferred_contact_methods: z.array(ContactMethodEnum).min(1, "Please choose at least one contact method."),
  consentTextSnapshot: z.string().max(1000).optional(),
  privacyPolicyVersion: z.string().max(50).optional(),
  questions: z.string().optional()
}).superRefine((data, ctx) => {
  const needsPhone =
    data.preferred_contact_methods.includes("whatsapp") ||
    data.preferred_contact_methods.includes("phone");

  if (needsPhone && !data.phone?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: "Please provide a phone number for WhatsApp or phone follow-up."
    });
  }

  if (data.preferred_contact_methods.includes("email") && !data.email?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Please provide an email address for email follow-up."
    });
  }
});

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
    privacyPolicyVersion: formData.get("privacyPolicyVersion") || undefined,
    questions: formData.get("questions") || undefined
  });

  if (!parsed.success) {
    redirect(`/e/${formData.get("slug")}?error=Please%20add%20your%20name%20and%20consent.`);
  }

  // Load event and formConfig server-side for validation
  const event = await getPublicEvent(parsed.data.slug);
  const template = getEventTemplate(event.event_type);
  const formConfig = getEffectiveFormConfig(event, template);

  // Parse phone and email based on visibility
  const phone = formConfig.show_phone ? parsed.data.phone?.trim() : undefined;
  const email = formConfig.show_email ? parsed.data.email?.trim() : undefined;

  // Validate phone requirement
  if (formConfig.require_phone && !phone) {
    redirect(`/e/${parsed.data.slug}?error=Please%20add%20your%20phone%20or%20WhatsApp%20number.`);
  }

  // Validate email requirement
  if (formConfig.require_email && !email) {
    redirect(`/e/${parsed.data.slug}?error=Please%20add%20your%20email%20address.`);
  }

  // Validate at least one contact method
  if (formConfig.require_at_least_one_contact_method && !phone && !email) {
    redirect(`/e/${parsed.data.slug}?error=Please%20add%20either%20a%20phone%20number%20or%20an%20email%20address.`);
  }

  // Parse interests based on formConfig
  const submittedInterests = formData.getAll("interests").map(String);
  const allowedInterests = new Set(formConfig.interest_options.map((option) => option.value));
  const selectedInterests = submittedInterests.filter((interest) => allowedInterests.has(interest));

  // Parse form answers from questions (only visible questions from formConfig)
  const formAnswers: Array<{
    question_name: string;
    question_label: string;
    question_type: string;
    answer_value: unknown;
    answer_display: unknown;
  }> = [];

  if (parsed.data.questions) {
    try {
      const questions = JSON.parse(parsed.data.questions) as Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        options: Array<{ value: string; label: string }>;
      }>;

      // Only process questions that are visible in formConfig
      const visibleQuestions = formConfig.questions;

      for (const question of questions) {
        // Skip if question is not visible
        const isVisible = visibleQuestions.some((vq) => vq.name === question.name);
        if (!isVisible) continue;

        const values = formData.getAll(question.name).map(String);

        if (values.length === 0) {
          if (question.required) {
            redirect(`/e/${parsed.data.slug}?error=Please%20answer%20the%20required%20question:%20${encodeURIComponent(question.label)}`);
          }
          continue;
        }

        const answerValue = question.type === "checkbox_group" ? values : values[0];
        const optionLabels = values.map((v) => {
          const option = question.options.find((o) => o.value === v);
          return option?.label || v;
        });
        const answerDisplay = question.type === "checkbox_group" ? optionLabels : optionLabels[0];

        formAnswers.push({
          question_name: question.name,
          question_label: question.label,
          question_type: question.type,
          answer_value: answerValue,
          answer_display: answerDisplay
        });
      }
    } catch (e) {
      // If question parsing fails, continue without answers
      console.error("Failed to parse questions:", e);
    }
  }

  // Use defaults for hidden fields
  const finalArea = formConfig.show_area ? parsed.data.area : null;
  const finalLanguage = formConfig.show_language ? (parsed.data.language || "English") : "English";
  const finalBestTime = formConfig.show_best_time ? parsed.data.bestTimeToContact : null;
  const finalMessage = formConfig.show_message ? parsed.data.message : null;
  const finalPrayerVisibility = formConfig.show_prayer_visibility ? (parsed.data.prayerVisibility || "general_prayer") : "general_prayer";

  const classifierMessage = [parsed.data.topic ? `Selected topic: ${parsed.data.topic}.` : "", finalMessage ?? ""]
    .filter(Boolean)
    .join(" ");
  const classification = classifyContact({
    selectedInterests: selectedInterests,
    message: classifierMessage,
    visitorType: parsed.data.visitorType as VisitorType,
    templateType: parsed.data.templateType as VisitorType
  });
  const classificationPayload = {
    ...classification,
    template_type: parsed.data.templateType,
    selected_topic: parsed.data.topic ?? null,
    classification_version: "rule_v1",
    rule_based: true,
    ready_for_ai: false
  };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_event_registration", {
    p_slug: parsed.data.slug,
    p_full_name: parsed.data.fullName,
    p_phone: phone ?? null,
    p_email: email ?? null,
    p_area: finalArea,
    p_language: finalLanguage,
    p_best_time_to_contact: finalBestTime,
    p_interests: selectedInterests,
    p_message: finalMessage,
    p_urgency: classification.urgency,
    p_classification_payload: classificationPayload,
    p_prayer_visibility: finalPrayerVisibility,
    p_consent_scope: ["follow_up"],
    p_preferred_contact_methods: parsed.data.preferred_contact_methods,
    p_consent_source: parsed.data.templateType,
    p_consent_given: true,
    p_consent_text_snapshot: parsed.data.consentTextSnapshot ?? null,
    p_privacy_policy_version: parsed.data.privacyPolicyVersion ?? "contact-consent-v1",
    p_consent_status: "given",
    p_consent_recorded_by: null,
    p_form_answers: formAnswers.length > 0 ? JSON.stringify(formAnswers) : null,
    p_recommended_assigned_role: classification.recommended_assigned_role
  });

  if (error) {
    redirect(`/e/${parsed.data.slug}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/e/${parsed.data.slug}?submitted=true`);
}
