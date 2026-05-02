"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { classifyContact, type VisitorType } from "@/lib/classifyContact";
import { interestOptions } from "@/lib/constants";
import { eventTemplateTypes } from "@/lib/eventTemplates";
import { prayerVisibilityOptions } from "@/lib/followUp";
import { createClient } from "@/lib/supabase/server";

const visitorTypeOptions = [
  ...eventTemplateTypes,
  "bible_study",
  "church_service",
  "visitor_sabbath",
  "community_outreach",
  "other",
  "general"
] as const;

const registrationSchema = z.object({
  slug: z.string().min(2),
  fullName: z.string().min(2).max(140),
  phone: z.string().min(6).max(40),
  email: z.string().email().max(160).optional(),
  area: z.string().max(120).optional(),
  language: z.string().max(80).optional(),
  bestTimeToContact: z.string().max(120).optional(),
  interests: z.array(z.enum(interestOptions)).min(1),
  message: z.string().max(2000).optional(),
  visitorType: z.enum(visitorTypeOptions).default("general"),
  templateType: z.enum(visitorTypeOptions).default("general"),
  topic: z.string().max(120).optional(),
  prayerVisibility: z.enum(prayerVisibilityOptions).default("general_prayer"),
  consent: z.literal("on"),
  consentTextSnapshot: z.string().max(1000).optional(),
  privacyPolicyVersion: z.string().max(50).optional(),
  questions: z.string().optional()
});

export async function submitRegistrationAction(formData: FormData) {
  const parsed = registrationSchema.safeParse({
    slug: formData.get("slug"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    area: formData.get("area") || undefined,
    language: formData.get("language") || undefined,
    bestTimeToContact: formData.get("bestTimeToContact") || undefined,
    interests: formData.getAll("interests").map(String),
    message: formData.get("message") || undefined,
    visitorType: formData.get("visitorType") || "general",
    templateType: formData.get("templateType") || "general",
    topic: formData.get("topic") || undefined,
    prayerVisibility: formData.get("prayerVisibility") || "general_prayer",
    consent: formData.get("consent"),
    consentTextSnapshot: formData.get("consentTextSnapshot") || undefined,
    privacyPolicyVersion: formData.get("privacyPolicyVersion") || undefined,
    questions: formData.get("questions") || undefined
  });

  if (!parsed.success) {
    redirect(`/e/${formData.get("slug")}?error=Please%20add%20your%20name,%20phone,%20interest,%20and%20consent.`);
  }

  // Parse form answers from questions
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

      for (const question of questions) {
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

  const classifierMessage = [parsed.data.topic ? `Selected topic: ${parsed.data.topic}.` : "", parsed.data.message ?? ""]
    .filter(Boolean)
    .join(" ");
  const classification = classifyContact({
    selectedInterests: parsed.data.interests,
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
    p_phone: parsed.data.phone,
    p_email: parsed.data.email ?? null,
    p_area: parsed.data.area ?? null,
    p_language: parsed.data.language ?? "English",
    p_best_time_to_contact: parsed.data.bestTimeToContact ?? null,
    p_interests: parsed.data.interests,
    p_message: parsed.data.message ?? null,
    p_urgency: classification.urgency,
    p_classification_payload: classificationPayload,
    p_prayer_visibility: parsed.data.prayerVisibility,
    p_consent_scope: ["follow_up", "whatsapp", "event_updates", ...(parsed.data.interests.includes("prayer") ? ["prayer"] : [])],
    p_consent_source: parsed.data.templateType,
    p_consent_given: true,
    p_consent_text_snapshot: parsed.data.consentTextSnapshot ?? null,
    p_privacy_policy_version: parsed.data.privacyPolicyVersion ?? "v1.0",
    p_consent_status: "given",
    p_consent_recorded_by: null,
    p_form_answers: formAnswers.length > 0 ? JSON.stringify(formAnswers) : null
  });

  if (error) {
    redirect(`/e/${parsed.data.slug}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/e/${parsed.data.slug}?submitted=true`);
}
