"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getChurchContext, getEvent } from "@/lib/data";
import { parseEventCustomizationFormData } from "@/lib/events/customization-form";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";

export async function updateEventCustomizationAction(formData: FormData) {
  const context = await getChurchContext();
  const supabase = await createClient();
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/events?error=This%20workspace%20is%20inactive.");
  }

  const eventId = String(formData.get("eventId") || "");
  const event = await getEvent(context.churchId, eventId);
  const parsed = parseEventCustomizationFormData(formData, event);

  if ("error" in parsed) {
    redirect(`/events/${eventId}/customize?error=${encodeURIComponent(parsed.error)}`);
  }

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId,
      permission: "can_edit_event_settings"
    });
  } catch {
    redirect(`/events/${eventId}/customize?error=You%20do%20not%20have%20permission%20to%20customize%20this%20event.`);
  }

  const { error } = await supabase
    .from("events")
    .update({
      public_info: {
        heading: parsed.heading,
        description: parsed.description,
        thank_you_heading: parsed.thank_you_heading,
        thank_you_message: parsed.thank_you_message,
        consent_text: parsed.consent_text,
        show_church_name: parsed.show_church_name,
        show_logo: parsed.show_logo
      },
      branding_config: {
        logo_url: parsed.logo_url || null,
        cover_image_url: parsed.cover_image_url || null,
        primary_color: parsed.primary_color,
        accent_color: parsed.accent_color
      },
      form_config: {
        display_mode: parsed.display_mode,
        guided_preset: parsed.guided_preset,
        show_phone: parsed.show_phone,
        show_email: parsed.show_email,
        show_area: parsed.show_area,
        show_language: parsed.show_language,
        show_best_time: parsed.show_best_time,
        show_topic: parsed.show_topic,
        show_interests: parsed.show_interests,
        show_message: parsed.show_message,
        show_prayer_visibility: parsed.show_prayer_visibility,
        require_phone: parsed.require_phone,
        require_email: parsed.require_email,
        require_at_least_one_contact_method: parsed.require_at_least_one_contact_method,
        intake_enabled: parsed.intake_enabled,
        intake_categories: parsed.intake_categories,
        interest_options: parsed.interest_options,
        questions: parsed.questions
      }
    })
    .eq("id", eventId)
    .eq("church_id", context.churchId);

  if (error) {
    console.error("Event customization update error:", error);
    redirect(`/events/${eventId}/customize?error=Could%20not%20update%20the%20event%20customization.`);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/customize`);
  revalidatePath("/dashboard");
  redirect(`/events/${eventId}/customize?success=true`);
}
