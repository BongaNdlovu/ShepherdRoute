import { z } from "zod";
import { classifyContact, type VisitorType } from "@/lib/classifyContact";
import { eventTemplateTypes } from "@/lib/eventTemplates";
import { prayerVisibilityOptions } from "@/lib/followUp";
import { contactMethodOptions } from "@/lib/constants";
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

export const registrationSchema = z.object({
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
  privacyPolicyVersion: z.string().max(50).optional()
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

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export type FormAnswer = {
  question_name: string;
  question_label: string;
  question_type: string;
  answer_value: unknown;
  answer_display: unknown;
};

export type ValidatedRegistrationData = {
  eventName: string;
  consentTextSnapshot: string;
  phone?: string | null;
  email?: string | null;
  finalArea: string | null | undefined;
  finalLanguage: string;
  finalBestTime: string | null | undefined;
  finalMessage: string | null | undefined;
  finalPrayerVisibility: string;
  selectedInterests: string[];
  formAnswers: FormAnswer[];
  classification: ReturnType<typeof classifyContact>;
  classificationPayload: {
    urgency: string;
    recommended_assigned_role?: string;
    template_type: VisitorType;
    selected_topic: string | null;
    classification_version: string;
    rule_based: boolean;
    ready_for_ai: boolean;
    summary?: string;
    recommended_tags?: string[];
    recommended_next_action?: string;
  };
};

export async function validatePublicEventRegistration(
  parsedData: RegistrationFormData,
  formData: FormData
): Promise<{ data: ValidatedRegistrationData } | { error: string }> {
  const event = await getPublicEvent(parsedData.slug);
  const template = getEventTemplate(event.event_type);
  const formConfig = getEffectiveFormConfig(event, template);

  const serverVisitorType = event.event_type as VisitorType;
  const serverTemplateType = event.event_type as VisitorType;

  const phone = formConfig.show_phone ? parsedData.phone?.trim() : undefined;
  const email = formConfig.show_email ? parsedData.email?.trim() : undefined;

  if (formConfig.require_phone && !phone) {
    return { error: "Please add your phone or WhatsApp number." };
  }

  if (formConfig.require_email && !email) {
    return { error: "Please add your email address." };
  }

  if (formConfig.require_at_least_one_contact_method && !phone && !email) {
    return { error: "Please add either a phone number or an email address." };
  }

  const submittedInterests = formData.getAll("interests").map(String);
  const allowedInterests = new Set(formConfig.interest_options.map((option) => option.value));
  const selectedInterests = submittedInterests.filter((interest) => allowedInterests.has(interest));

  const formAnswers: FormAnswer[] = [];

  for (const question of formConfig.questions) {
    const allowedOptions = question.options ?? [];
    const allowedValues = new Set(allowedOptions.map((option) => option.value));

    const submittedValues = formData
      .getAll(question.name)
      .map(String)
      .map((value) => value.trim())
      .filter((value) => value !== "");

    const invalidValues = submittedValues.filter((value) => !allowedValues.has(value));

    if (invalidValues.length > 0) {
      return { error: `Invalid answer submitted for: ${question.label}` };
    }

    if (submittedValues.length === 0) {
      if (question.required) {
        return { error: `Please answer the required question: ${question.label}` };
      }
      continue;
    }

    if ((question.type === "radio" || question.type === "select") && submittedValues.length > 1) {
      return { error: `Please choose one answer for: ${question.label}` };
    }

    const optionLabels = submittedValues.map((value) => {
      const option = allowedOptions.find((candidate) => candidate.value === value);
      return option?.label ?? value;
    });

    const answerValue = question.type === "checkbox_group" ? submittedValues : submittedValues[0];
    const answerDisplay = question.type === "checkbox_group" ? optionLabels : optionLabels[0];

    formAnswers.push({
      question_name: question.name,
      question_label: question.label,
      question_type: question.type,
      answer_value: answerValue,
      answer_display: answerDisplay
    });
  }

  const finalArea = formConfig.show_area ? parsedData.area : null;
  const finalLanguage = formConfig.show_language ? (parsedData.language || "English") : "English";
  const finalBestTime = formConfig.show_best_time ? parsedData.bestTimeToContact : null;
  const finalMessage = formConfig.show_message ? parsedData.message : null;
  const finalPrayerVisibility = formConfig.show_prayer_visibility ? (parsedData.prayerVisibility || "general_prayer") : "general_prayer";

  const classifierMessage = [parsedData.topic ? `Selected topic: ${parsedData.topic}.` : "", finalMessage ?? ""]
    .filter(Boolean)
    .join(" ");
  const classification = classifyContact({
    selectedInterests: selectedInterests,
    message: classifierMessage,
    visitorType: serverVisitorType,
    templateType: serverTemplateType
  });
  const classificationPayload = {
    ...classification,
    template_type: serverTemplateType,
    selected_topic: parsedData.topic ?? null,
    classification_version: "rule_v1",
    rule_based: true,
    ready_for_ai: false
  };

  return {
    data: {
      eventName: event.name,
      consentTextSnapshot: `Contact follow-up consent for ${event.name}. Methods: ${parsedData.preferred_contact_methods.join(", ")}.`,
      phone,
      email,
      finalArea,
      finalLanguage,
      finalBestTime,
      finalMessage,
      finalPrayerVisibility,
      selectedInterests,
      formAnswers,
      classification,
      classificationPayload
    }
  };
}
