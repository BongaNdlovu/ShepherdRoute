import { interestOptions } from "@/lib/constants";
import type { EventTemplateConfig, TemplateQuestionField } from "@/lib/eventTemplates";
import { getDefaultIntakeCategories } from "@/lib/intake/intake-categories";
import type { IntakeCategory } from "@/lib/intake/intake-categories";

export type EventPublicInfo = {
  heading: string;
  description: string;
  thank_you_heading: string;
  thank_you_message: string;
  consent_text: string;
  show_church_name: boolean;
  show_logo: boolean;
};

export type EventBrandingConfig = {
  logo_url: string;
  cover_image_url: string;
  primary_color: string;
  accent_color: string;
};

export type EventFormDisplayMode = "classic" | "guided_card";

export type EventFormConfig = {
  display_mode: EventFormDisplayMode;
  guided_preset?: string | null;
  show_phone: boolean;
  show_email: boolean;
  show_area: boolean;
  show_language: boolean;
  show_best_time: boolean;
  show_topic: boolean;
  show_message: boolean;
  show_prayer_visibility: boolean;
  show_interests: boolean;
  require_phone: boolean;
  require_email: boolean;
  require_at_least_one_contact_method: boolean;
  intake_enabled: boolean;
  intake_categories: IntakeCategory[];
  interest_options: Array<{
    value: string;
    label: string;
    description?: string;
    enabled?: boolean;
  }>;
  questions: TemplateQuestionField[];
};

export type PublicEvent = {
  public_info?: Record<string, unknown>;
  branding_config?: Record<string, unknown>;
  form_config?: Record<string, unknown>;
};

export function replacePlaceholders(text: string, placeholders: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

export function getEffectivePublicInfo(event: PublicEvent, template: EventTemplateConfig): EventPublicInfo {
  const publicInfo = (event.public_info as Record<string, unknown> | undefined) || {};
  return {
    heading: (publicInfo.heading as string) || template.formHeading,
    description: (publicInfo.description as string) || template.formDescription,
    thank_you_heading: (publicInfo.thank_you_heading as string) || "Thank you",
    thank_you_message: (publicInfo.thank_you_message as string) || "Your request has been received. The team will follow up with care and respect.",
    consent_text: (publicInfo.consent_text as string) || `I consent to contacting me about the interests I selected by WhatsApp, phone, or email. I understand I can ask to be removed from follow-up at any time.`,
    show_church_name: publicInfo.show_church_name !== false,
    show_logo: publicInfo.show_logo !== false
  };
}

export function getEffectiveBrandingConfig(event: PublicEvent): EventBrandingConfig {
  const branding = (event.branding_config as Record<string, string> | undefined) || {};
  return {
    logo_url: branding.logo_url || "",
    cover_image_url: branding.cover_image_url || "",
    primary_color: branding.primary_color || "#92400e",
    accent_color: branding.accent_color || "#f59e0b"
  };
}

function getDisplayMode(value: unknown): EventFormDisplayMode {
  return value === "guided_card" ? "guided_card" : "classic";
}

function getEffectiveIntakeCategories(formConfig: Record<string, unknown>) {
  const defaults = getDefaultIntakeCategories();
  const customCategories = (formConfig.intake_categories as IntakeCategory[] | undefined) || [];

  return defaults.map((category) => {
    const custom = customCategories.find((candidate) => candidate.id === category.id);

    if (!custom) return category;

    return {
      ...category,
      label: typeof custom.label === "string" && custom.label.trim() ? custom.label.trim() : category.label,
      description: typeof custom.description === "string" ? custom.description.trim() : category.description,
      enabled: custom.enabled !== false,
      questions: category.questions.map((question) => {
        const customQuestion = custom.questions?.find((candidate) => candidate.id === question.id);

        if (!customQuestion) return question;

        return {
          ...question,
          label: typeof customQuestion.label === "string" && customQuestion.label.trim() ? customQuestion.label.trim() : question.label,
          description: typeof customQuestion.description === "string" ? customQuestion.description.trim() : question.description,
          required: customQuestion.required ?? question.required,
          enabled: customQuestion.enabled !== false,
          options: question.options?.map((option) => {
            const customOption = customQuestion.options?.find((candidate) => candidate.value === option.value);
            return {
              ...option,
              label: typeof customOption?.label === "string" && customOption.label.trim() ? customOption.label.trim() : option.label,
              enabled: customOption?.enabled !== false
            };
          })
        };
      })
    };
  }).filter((category) => category.enabled !== false);
}

export function getEffectiveFormConfig(event: PublicEvent, template: EventTemplateConfig): EventFormConfig {
  const formConfig = (event.form_config as Record<string, unknown> | undefined) || {};

  // Use custom interest options if valid and non-empty, otherwise use template defaults
  const customInterests = (formConfig.interest_options as Array<{ value: string; label: string; description?: string; enabled?: boolean }> | undefined) || [];
  const hasValidCustomInterests = customInterests.length > 0 &&
    customInterests.every((opt) => opt.value && interestOptions.includes(opt.value as never));

  const effectiveInterestOptions = hasValidCustomInterests
    ? customInterests
    : template.interestOptions.map((opt) => ({ ...opt, enabled: true }));

  // Filter to only enabled options and avoid rendering two checkboxes that
  // persist to the same enum value.
  const seenInterestValues = new Set<string>();
  const visibleInterestOptions = effectiveInterestOptions.filter((option) => {
    if (option.enabled === false || seenInterestValues.has(option.value)) {
      return false;
    }
    seenInterestValues.add(option.value);
    return true;
  });

  // Use custom questions if provided, otherwise use template questions
  const customQuestions = (formConfig.questions as TemplateQuestionField[] | undefined) || [];
  const effectiveQuestions = customQuestions.length > 0 ? customQuestions : (template.questions || []);

  // Filter to only enabled questions and their enabled options
  const visibleQuestions = effectiveQuestions
    .filter((question) => question.enabled !== false)
    .map((question) => ({
      ...question,
      options: question.options.filter((option) => option.enabled !== false)
    }))
    .filter((question) => question.options.length > 0);

  return {
    display_mode: getDisplayMode(formConfig.display_mode),
    guided_preset: typeof formConfig.guided_preset === "string" ? formConfig.guided_preset : null,
    show_phone: formConfig.show_phone !== false,
    show_email: formConfig.show_email !== false,
    show_area: formConfig.show_area !== false,
    show_language: formConfig.show_language !== false,
    show_best_time: formConfig.show_best_time !== false,
    show_topic: formConfig.show_topic !== false && !!template.topicOptions?.length,
    show_message: formConfig.show_message !== false,
    show_prayer_visibility: formConfig.show_prayer_visibility !== false,
    show_interests: formConfig.show_interests !== false,
    require_phone: formConfig.require_phone !== false,
    require_email: formConfig.require_email === true,
    require_at_least_one_contact_method: formConfig.require_at_least_one_contact_method !== false,
    intake_enabled: formConfig.intake_enabled === true,
    intake_categories: getEffectiveIntakeCategories(formConfig),
    interest_options: visibleInterestOptions,
    questions: visibleQuestions
  };
}
