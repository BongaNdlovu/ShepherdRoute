"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eventTypeOptions, interestOptions, interestLabels } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

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
  show_email: z.coerce.boolean(),
  show_area: z.coerce.boolean(),
  show_language: z.coerce.boolean(),
  show_best_time: z.coerce.boolean(),
  show_topic: z.coerce.boolean(),
  show_message: z.coerce.boolean(),
  show_prayer_visibility: z.coerce.boolean()
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
  const { error } = await supabase.from("events").insert({
    church_id: context.churchId,
    name: parsed.data.name,
    event_type: parsed.data.eventType,
    starts_on: parsed.data.startsOn || null,
    location: parsed.data.location || null,
    description: parsed.data.description || null,
    slug,
    created_by: context.userId
  });

  if (error) {
    redirect(`/events/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  redirect("/events");
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

  // Validate URLs: only https or empty
  const logoUrl = formData.get("logo_url") as string || "";
  const coverImageUrl = formData.get("cover_image_url") as string || "";

  if (logoUrl && !httpsUrlRegex.test(logoUrl)) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Logo%20URL%20must%20be%20https`);
  }
  if (coverImageUrl && !httpsUrlRegex.test(coverImageUrl)) {
    redirect(`/events/${formData.get("eventId")}/customize?error=Cover%20image%20URL%20must%20be%20https`);
  }

  // Build interest options from form data
  const interestOptionsList = interestOptions.map((interest) => {
    const label = formData.get(`label_${interest}`) as string || interestLabels[interest];
    const description = formData.get(`desc_${interest}`) as string || "";
    return { value: interest, label, description: description || undefined };
  });

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
    show_email: formData.get("show_email"),
    show_area: formData.get("show_area"),
    show_language: formData.get("show_language"),
    show_best_time: formData.get("show_best_time"),
    show_topic: formData.get("show_topic"),
    show_message: formData.get("show_message"),
    show_prayer_visibility: formData.get("show_prayer_visibility")
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
        consent_text: parsed.data.consent_text
      },
      branding_config: {
        logo_url: parsed.data.logo_url || null,
        cover_image_url: parsed.data.cover_image_url || null,
        primary_color: parsed.data.primary_color,
        accent_color: parsed.data.accent_color
      },
      form_config: {
        show_email: parsed.data.show_email,
        show_area: parsed.data.show_area,
        show_language: parsed.data.show_language,
        show_best_time: parsed.data.show_best_time,
        show_topic: parsed.data.show_topic,
        show_message: parsed.data.show_message,
        show_prayer_visibility: parsed.data.show_prayer_visibility,
        interest_options: interestOptionsList
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
