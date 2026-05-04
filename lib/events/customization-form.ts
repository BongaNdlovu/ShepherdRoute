import { interestOptions, interestLabels } from "@/lib/constants";
import { getEventTemplate } from "@/lib/eventTemplates";
import type { getEvent } from "@/lib/data";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
const httpsUrlRegex = /^https:\/\/.*/;

export type CustomizationFormData = {
  heading?: string;
  description?: string;
  thank_you_heading?: string;
  thank_you_message?: string;
  consent_text?: string;
  logo_url?: string;
  cover_image_url?: string;
  primary_color: string;
  accent_color: string;
  show_phone: boolean;
  show_email: boolean;
  show_area: boolean;
  show_language: boolean;
  show_best_time: boolean;
  show_topic: boolean;
  show_interests: boolean;
  show_message: boolean;
  show_prayer_visibility: boolean;
  show_church_name: boolean;
  show_logo: boolean;
  require_phone: boolean;
  require_email: boolean;
  require_at_least_one_contact_method: boolean;
  interest_options: Array<{
    value: string;
    label: string;
    description?: string;
    enabled: boolean;
  }>;
  questions: Array<{
    name: string;
    label: string;
    description?: string;
    type: "radio" | "select" | "checkbox_group";
    required?: boolean;
    options: Array<{
      value: string;
      label: string;
      enabled: boolean;
    }>;
    enabled: boolean;
  }>;
};

export function parseEventCustomizationFormData(
  formData: FormData,
  event: Awaited<ReturnType<typeof getEvent>>
): CustomizationFormData | { error: string } {
  if (!event.event) {
    return { error: "Event not found" };
  }

  const template = getEventTemplate(event.event.event_type);

  const logoUrl = formData.get("logo_url") as string || "";
  const coverImageUrl = formData.get("cover_image_url") as string || "";

  if (logoUrl && !httpsUrlRegex.test(logoUrl)) {
    return { error: "Logo URL must be https" };
  }
  if (coverImageUrl && !httpsUrlRegex.test(coverImageUrl)) {
    return { error: "Cover image URL must be https" };
  }

  const showPhone = formData.get("show_phone") === "on";
  const showEmail = formData.get("show_email") === "on";
  const showArea = formData.get("show_area") === "on";
  const showLanguage = formData.get("show_language") === "on";
  const showBestTime = formData.get("show_best_time") === "on";
  const showTopic = formData.get("show_topic") === "on";
  const showInterests = formData.get("show_interests") === "on";
  const showMessage = formData.get("show_message") === "on";
  const showPrayerVisibility = formData.get("show_prayer_visibility") === "on";
  const showChurchName = formData.get("show_church_name") === "on";
  const showLogo = formData.get("show_logo") === "on";
  const requirePhone = formData.get("require_phone") === "on";
  const requireEmail = formData.get("require_email") === "on";
  const requireAtLeastOneContactMethod = formData.get("require_at_least_one_contact_method") === "on";

  if (!showPhone && !showEmail) {
    return { error: "At least one contact field must be visible." };
  }

  if (requirePhone && !showPhone) {
    return { error: "Cannot require phone if phone field is hidden." };
  }

  if (requireEmail && !showEmail) {
    return { error: "Cannot require email if email field is hidden." };
  }

  const interestOptionsList = interestOptions.map((interest) => {
    const label = formData.get(`label_${interest}`) as string || interestLabels[interest];
    const description = formData.get(`desc_${interest}`) as string || "";
    const enabled = formData.get(`enabled_${interest}`) === "on";

    return {
      value: interest,
      label,
      description: description || undefined,
      enabled
    };
  });

  if (showInterests && !interestOptionsList.some((opt) => opt.enabled)) {
    return { error: "Please enable at least one interest option, or turn off the interest section." };
  }

  const questionOverrides = (template.questions ?? []).map((question: { name: string; label: string; description?: string; type: "radio" | "select" | "checkbox_group"; required?: boolean; options: { value: string; label: string }[] }) => {
    const enabled = formData.get(`question_enabled_${question.name}`) === "on";
    const label = String(formData.get(`question_label_${question.name}`) || question.label);
    const description = String(formData.get(`question_description_${question.name}`) || question.description || "");
    const required = formData.get(`question_required_${question.name}`) === "on";

    const options = question.options.map((option: { value: string; label: string }) => ({
      value: option.value,
      label: String(formData.get(`question_option_label_${question.name}_${option.value}`) || option.label),
      enabled: formData.get(`question_option_enabled_${question.name}_${option.value}`) === "on"
    }));

    return {
      ...question,
      enabled,
      label,
      description: description || undefined,
      required,
      options
    };
  });

  for (const question of questionOverrides) {
    if (!question.enabled) continue;

    const visibleOptions = question.options.filter((opt: { enabled?: boolean }) => opt.enabled);

    if (visibleOptions.length === 0) {
      return { error: "An enabled question must have at least one visible option." };
    }

    if (question.required && (question.type === "radio" || question.type === "select") && visibleOptions.length < 2) {
      return { error: "A required radio or dropdown question must have at least two visible options." };
    }
  }

  const primaryColor = formData.get("primary_color") as string;
  const accentColor = formData.get("accent_color") as string;

  if (!hexColorRegex.test(primaryColor)) {
    return { error: "Invalid primary color format" };
  }
  if (!hexColorRegex.test(accentColor)) {
    return { error: "Invalid accent color format" };
  }

  return {
    heading: formData.get("heading") as string || undefined,
    description: formData.get("description") as string || undefined,
    thank_you_heading: formData.get("thank_you_heading") as string || undefined,
    thank_you_message: formData.get("thank_you_message") as string || undefined,
    consent_text: formData.get("consent_text") as string || undefined,
    logo_url: logoUrl || undefined,
    cover_image_url: coverImageUrl || undefined,
    primary_color: primaryColor,
    accent_color: accentColor,
    show_phone: showPhone,
    show_email: showEmail,
    show_area: showArea,
    show_language: showLanguage,
    show_best_time: showBestTime,
    show_topic: showTopic,
    show_interests: showInterests,
    show_message: showMessage,
    show_prayer_visibility: showPrayerVisibility,
    show_church_name: showChurchName,
    show_logo: showLogo,
    require_phone: requirePhone,
    require_email: requireEmail,
    require_at_least_one_contact_method: requireAtLeastOneContactMethod,
    interest_options: interestOptionsList,
    questions: questionOverrides
  };
}
