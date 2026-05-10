import { z } from "zod";
import { classifyContact, type VisitorType } from "@/lib/classifyContact";
import { contactMethodOptions, type ContactMethod } from "@/lib/constants";
import { getPublicEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import { getEffectiveFormConfig } from "@/lib/eventCustomization";
import type { FormAnswer, ValidatedRegistrationData } from "@/lib/public-events/validation";

const ContactMethodEnum = z.enum(contactMethodOptions);

export const intakeSubmissionSchema = z.object({
  slug: z.string().min(2),
  category: z.string().min(2).max(80),
  fullName: z.string().min(2).max(140),
  phone: z.string().min(3).max(40),
  email: z.string().email().max(160).optional(),
  preferred_contact_method: ContactMethodEnum.default("whatsapp"),
  answersJson: z.string().default("{}"),
  consentTextSnapshot: z.string().max(1000).optional(),
  privacyPolicyVersion: z.string().max(50).optional()
});

export type IntakeSubmissionData = z.infer<typeof intakeSubmissionSchema>;

function safeParseAnswers(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function urgencyFromAnswers(categoryDefault: string, answers: Record<string, unknown>) {
  if (answers.urgency === "urgent" || answers.care_urgency === "today") return "high";
  return categoryDefault;
}

export async function validatePublicIntakeSubmission(
  parsedData: IntakeSubmissionData
): Promise<{ data: ValidatedRegistrationData & { intakeResponse: Record<string, unknown> } } | { error: string }> {
  const event = await getPublicEvent(parsedData.slug);
  const template = getEventTemplate(event.event_type);
  const formConfig = getEffectiveFormConfig(event, template);

  if (!formConfig.intake_enabled) {
    return { error: "Smart intake is not enabled for this event." };
  }

  const category = formConfig.intake_categories.find((candidate) => candidate.id === parsedData.category);

  if (!category) {
    return { error: "Please choose a valid request type." };
  }

  const answers = safeParseAnswers(parsedData.answersJson);
  const formAnswers: FormAnswer[] = [];

  for (const question of category.questions) {
    if (question.enabled === false) continue;

    const rawAnswer = answers[question.id];
    const values = Array.isArray(rawAnswer)
      ? rawAnswer.map(String).filter(Boolean)
      : rawAnswer !== undefined && rawAnswer !== null && String(rawAnswer).trim() !== ""
        ? [String(rawAnswer).trim()]
        : [];

    if (question.required && values.length === 0) {
      return { error: `Please answer: ${question.label}` };
    }

    if (values.length === 0) continue;

    if (question.type === "single_choice" && values.length > 1) {
      return { error: `Please choose one answer for: ${question.label}` };
    }

    if (question.type !== "text") {
      const allowedOptions = question.options?.filter((option) => option.enabled !== false) ?? [];
      const allowedValues = new Set(allowedOptions.map((option) => option.value));
      const invalid = values.filter((value) => !allowedValues.has(value));

      if (invalid.length > 0) {
        return { error: `Invalid answer submitted for: ${question.label}` };
      }

      const labels = values.map((value) => allowedOptions.find((option) => option.value === value)?.label ?? value);
      formAnswers.push({
        question_name: `intake_${category.id}_${question.id}`,
        question_label: question.label,
        question_type: question.type,
        answer_value: question.type === "multi_choice" ? values : values[0],
        answer_display: question.type === "multi_choice" ? labels : labels[0]
      });
    } else {
      const text = values[0].slice(0, 2000);
      formAnswers.push({
        question_name: `intake_${category.id}_${question.id}`,
        question_label: question.label,
        question_type: question.type,
        answer_value: text,
        answer_display: text
      });
    }
  }

  const selectedInterests = category.interest ? [category.interest] : [];
  const urgency = urgencyFromAnswers(category.defaultUrgency, answers);
  const serverTemplateType = event.event_type as VisitorType;
  const preferredContactMethods = [parsedData.preferred_contact_method] as ContactMethod[];
  const messageAnswer = Object.entries(answers)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const classification = classifyContact({
    selectedInterests,
    message: `${category.label}. ${messageAnswer}`,
    visitorType: serverTemplateType,
    templateType: serverTemplateType
  });

  const classificationPayload = {
    ...classification,
    urgency,
    recommended_assigned_role: category.recommendedAssignedRole ?? classification.recommended_assigned_role,
    template_type: serverTemplateType,
    selected_topic: category.label,
    intake_category: category.id,
    intake_answers: answers,
    classification_version: "intake_rule_v1",
    rule_based: true,
    ready_for_ai: false,
    summary: `Smart intake category: ${category.label}`,
    recommended_tags: selectedInterests
  };

  return {
    data: {
      eventName: event.name,
      consentTextSnapshot: parsedData.consentTextSnapshot || `Contact follow-up consent for ${event.name}. Method: ${parsedData.preferred_contact_method}.`,
      phone: parsedData.phone,
      email: parsedData.email ?? null,
      finalArea: null,
      finalLanguage: "English",
      finalBestTime: typeof answers.best_time === "string" ? answers.best_time : null,
      finalMessage: messageAnswer || null,
      finalPrayerVisibility: "general_prayer",
      selectedInterests,
      preferredContactMethods,
      formAnswers,
      classification,
      classificationPayload,
      intakeResponse: {
        category: category.id,
        answers,
        urgency,
        preferred_contact_method: parsedData.preferred_contact_method
      }
    }
  };
}
