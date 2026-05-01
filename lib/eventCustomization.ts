import { interestOptions } from "@/lib/constants";
import type { EventTemplateConfig } from "@/lib/eventTemplates";

export type EventPublicInfo = {
  heading: string;
  description: string;
  thank_you_heading: string;
  thank_you_message: string;
  consent_text: string;
};

export type EventBrandingConfig = {
  logo_url: string;
  cover_image_url: string;
  primary_color: string;
  accent_color: string;
};

export type EventFormConfig = {
  show_email: boolean;
  show_area: boolean;
  show_language: boolean;
  show_best_time: boolean;
  show_topic: boolean;
  show_message: boolean;
  show_prayer_visibility: boolean;
  interest_options: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
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
  const publicInfo = (event.public_info as Record<string, string> | undefined) || {};
  return {
    heading: publicInfo.heading || template.formHeading,
    description: publicInfo.description || template.formDescription,
    thank_you_heading: publicInfo.thank_you_heading || "Thank you",
    thank_you_message: publicInfo.thank_you_message || "Your request has been received. The team will follow up with care and respect.",
    consent_text: publicInfo.consent_text || `I consent to contacting me about the interests I selected by WhatsApp, phone, or email. I understand I can ask to be removed from follow-up at any time.`
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

export function getEffectiveFormConfig(event: PublicEvent, template: EventTemplateConfig): EventFormConfig {
  const formConfig = (event.form_config as Record<string, unknown> | undefined) || {};

  // Use custom interest options if valid and non-empty, otherwise use template defaults
  const customInterests = (formConfig.interest_options as Array<{ value: string; label: string; description?: string }> | undefined) || [];
  const hasValidCustomInterests = customInterests.length > 0 &&
    customInterests.every((opt) => opt.value && interestOptions.includes(opt.value as never));

  const effectiveInterestOptions = hasValidCustomInterests
    ? customInterests
    : template.interestOptions;

  return {
    show_email: formConfig.show_email !== false,
    show_area: formConfig.show_area !== false,
    show_language: formConfig.show_language !== false,
    show_best_time: formConfig.show_best_time !== false,
    show_topic: formConfig.show_topic !== false && !!template.topicOptions?.length,
    show_message: formConfig.show_message !== false,
    show_prayer_visibility: formConfig.show_prayer_visibility !== false,
    interest_options: effectiveInterestOptions
  };
}
