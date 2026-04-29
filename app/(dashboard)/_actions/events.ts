"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eventTypeOptions } from "@/lib/constants";
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
