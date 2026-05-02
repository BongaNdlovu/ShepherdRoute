"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eventTypeOptions, interestOptions, interestLabels } from "@/lib/constants";
import { getChurchContext, getEvent } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { getEventTemplate } from "@/lib/eventTemplates";

const eventSchema = z.object({
  name: z.string().min(2).max(140),
  eventType: z.enum(eventTypeOptions),
  startsOn: z.string().optional(),
  location: z.string().max(180).optional(),
  description: z.string().max(500).optional()
});

const eventStatusSchema = z.object({
  eventId: z.string().uuid(),
  isActive: z.enum(["true", "false"])
});

const eventArchiveSchema = z.object({
  eventId: z.string().uuid(),
  archived: z.enum(["true", "false"])
});

const deleteEventSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string().min(2),
  confirmation: z.string().min(2)
});

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
const httpsUrlRegex = /^https:\/\/.*/;

const eventCustomizationSchema = z.object({
  eventId: z.string().uuid(),
  heading: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  thank_you_heading: z.string().max(120).optional(),
  thank_you_message: z.string().max(500).optional(),
  consent_text: z.string().max(500).optional(),
  logo_url: z.string().max(500).optional(),
  cover_image_url: z.string().max(500).optional(),
  primary_color: z.string().regex(hexColorRegex),
  accent_color: z.string().regex(hexColorRegex),
  show_phone: z.coerce.boolean(),
  show_email: z.coerce.boolean(),
  show_area: z.coerce.boolean(),
  show_language: z.coerce.boolean(),
  show_best_time: z.coerce.boolean(),
  show_topic: z.coerce.boolean(),
  show_interests: z.coerce.boolean(),
  show_message: z.coerce.boolean(),
  show_prayer_visibility: z.coerce.boolean(),
  show_church_name: z.coerce.boolean(),
  show_logo: z.coerce.boolean(),
  require_phone: z.coerce.boolean(),
  require_email: z.coerce.boolean(),
  require_at_least_one_contact_method: z.coerce.boolean()
});

export async function createEventAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = eventSchema.safeParse({
    name: formData.get("name"),
    eventType: formData.get("eventType"),
    startsOn: formData.get("startsOn") || undefined,
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined
  });

  if (!parsed.success) {
    redirect("/events/new?error=Please%20complete%20the%20event%20details.");
  }

  const supabase = await createClient();
  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      church_id: context.churchId,
      name: parsed.data.name,
      event_type: parsed.data.eventType,
      starts_on: parsed.data.startsOn || null,
      location: parsed.data.location || null,
      description: parsed.data.description || null,
      slug,
      created_by: context.userId
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/events/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  redirect(`/events/${event.id}/customize`);
}

export async function updateEventStatusAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = eventStatusSchema.safeParse({
    eventId: formData.get("eventId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    redirect("/events?error=Could%20not%20update%20the%20event.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ is_active: parsed.data.isActive === "true" })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.eventId);

  if (error) {
    redirect(`/events/${parsed.data.eventId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${parsed.data.eventId}`);
  redirect(`/events/${parsed.data.eventId}`);
}

export async function updateEventArchiveAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = eventArchiveSchema.safeParse({
    eventId: formData.get("eventId"),
    archived: formData.get("archived")
  });

  if (!parsed.success) {
    redirect("/events?error=Could%20not%20update%20the%20event%20archive%20state.");
  }

  const isArchiving = parsed.data.archived === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      archived_at: isArchiving ? new Date().toISOString() : null,
      is_active: isArchiving ? false : true
    })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.eventId);

  if (error) {
    redirect(`/events/${parsed.data.eventId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/contacts");
  revalidatePath(`/events/${parsed.data.eventId}`);
  redirect(`/events/${parsed.data.eventId}`);
}

export async function deleteEventAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = deleteEventSchema.safeParse({
    eventId: formData.get("eventId"),
    eventName: formData.get("eventName"),
    confirmation: formData.get("confirmation")
  });

  if (!parsed.success || parsed.data.confirmation !== parsed.data.eventName) {
    redirect(`/events/${formData.get("eventId")}?error=Type%20the%20event%20name%20exactly%20to%20delete%20it.`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.eventId)
    .eq("name", parsed.data.eventName);

  if (error) {
    redirect(`/events/${parsed.data.eventId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/contacts");
  redirect("/events");
}

export async function updateEventCustomizationAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();

  // Get the event to determine its template
  const eventId = formData.get("eventId") as string;
  const event = await getEvent(context.churchId, eventId);

  if (!event.event) {
    redirect(`/events/${eventId}/customize?error=Event%20not%20found`);
  }

  const template = getEventTemplate(event.event.event_type);

  // Validate URLs: only https or empty
  const logoUrl = formData.get("logo_url") as string || "";
  const coverImageUrl = formData.get("cover_image_url") as string || "";

  if (logoUrl && !httpsUrlRegex.test(logoUrl)) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Logo%20URL%20must%20be%20https`);
  }
  if (coverImageUrl && !httpsUrlRegex.test(coverImageUrl)) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Cover%20image%20URL%20must%20be%20https`);
  }

  // Parse visibility checkboxes explicitly
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

  // Validation: at least one contact field must be visible
  if (!showPhone && !showEmail) {
    redirect(`/events/${formData.get("eventId")}/customize?error=At%20least%20one%20contact%20field%20must%20be%20visible.`);
  }

  // Validation: require_phone only if show_phone
  if (requirePhone && !showPhone) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Cannot%20require%20phone%20if%20phone%20field%20is%20hidden.`);
  }

  // Validation: require_email only if show_email
  if (requireEmail && !showEmail) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Cannot%20require%20email%20if%20email%20field%20is%20hidden.`);
  }

  // Build interest options from form data
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

  // Validation: if show_interests is true, require at least one enabled interest option
  if (showInterests && !interestOptionsList.some((opt) => opt.enabled)) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Please%20enable%20at%20least%20one%20interest%20option,%20or%20turn%20off%20the%20interest%20section.`);
  }

  // Build question overrides from template
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

  // Validation: required questions must have sufficient visible options
  for (const question of questionOverrides) {
    if (!question.enabled) continue;

    const visibleOptions = question.options.filter((opt: { enabled?: boolean }) => opt.enabled);

    if (visibleOptions.length === 0) {
      redirect(`/events/${formData.get("eventId")}/customize?error=An%20enabled%20question%20must%20have%20at%20least%20one%20visible%20option.`);
    }

    if (question.required && (question.type === "radio" || question.type === "select") && visibleOptions.length < 2) {
      redirect(`/events/${formData.get("eventId")}/customize?error=A%20required%20radio%20or%20dropdown%20question%20must%20have%20at%20least%20two%20visible%20options.`);
    }
  }

  const parsed = eventCustomizationSchema.safeParse({
    eventId: formData.get("eventId"),
    heading: formData.get("heading") || undefined,
    description: formData.get("description") || undefined,
    thank_you_heading: formData.get("thank_you_heading") || undefined,
    thank_you_message: formData.get("thank_you_message") || undefined,
    consent_text: formData.get("consent_text") || undefined,
    logo_url: logoUrl,
    cover_image_url: coverImageUrl,
    primary_color: formData.get("primary_color"),
    accent_color: formData.get("accent_color"),
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
    require_at_least_one_contact_method: requireAtLeastOneContactMethod
  });

  if (!parsed.success) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Invalid%20input`);
  }

  const { error } = await supabase
    .from("events")
    .update({
      public_info: {
        heading: parsed.data.heading,
        description: parsed.data.description,
        thank_you_heading: parsed.data.thank_you_heading,
        thank_you_message: parsed.data.thank_you_message,
        consent_text: parsed.data.consent_text,
        show_church_name: parsed.data.show_church_name,
        show_logo: parsed.data.show_logo
      },
      branding_config: {
        logo_url: parsed.data.logo_url || null,
        cover_image_url: parsed.data.cover_image_url || null,
        primary_color: parsed.data.primary_color,
        accent_color: parsed.data.accent_color
      },
      form_config: {
        show_phone: parsed.data.show_phone,
        show_email: parsed.data.show_email,
        show_area: parsed.data.show_area,
        show_language: parsed.data.show_language,
        show_best_time: parsed.data.show_best_time,
        show_topic: parsed.data.show_topic,
        show_interests: parsed.data.show_interests,
        show_message: parsed.data.show_message,
        show_prayer_visibility: parsed.data.show_prayer_visibility,
        require_phone: parsed.data.require_phone,
        require_email: parsed.data.require_email,
        require_at_least_one_contact_method: parsed.data.require_at_least_one_contact_method,
        interest_options: interestOptionsList,
        questions: questionOverrides
      }
    })
    .eq("id", parsed.data.eventId)
    .eq("church_id", context.churchId);

  if (error) {
    redirect(`/events/${parsed.data.eventId}/customize?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath(`/events/${parsed.data.eventId}/customize`);
  revalidatePath("/dashboard");
  redirect(`/events/${parsed.data.eventId}/customize?success=true`);
}
