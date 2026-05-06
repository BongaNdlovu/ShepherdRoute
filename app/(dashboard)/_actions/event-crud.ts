"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eventTypeOptions } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { requireEventManager } from "./event-guards";

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

const updateEventSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(2).max(140),
  description: z.string().max(500).optional(),
  startsOn: z.string().optional(),
  location: z.string().max(180).optional()
});

const deleteEventSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string().min(2),
  confirmation: z.string().min(2)
});

const bulkEventIdsSchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1).max(100)
});

function parseBulkEventIds(formData: FormData) {
  const eventIds = formData
    .getAll("eventIds")
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return bulkEventIdsSchema.safeParse({
    eventIds: Array.from(new Set(eventIds))
  });
}

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
  await requireEventManager(context, supabase);
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
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/events?error=This%20workspace%20is%20inactive.");
  }
  const parsed = eventStatusSchema.safeParse({
    eventId: formData.get("eventId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    redirect("/events?error=Could%20not%20update%20the%20event.");
  }

  const supabase = await createClient();
  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: parsed.data.eventId,
      permission: "can_edit_event_settings"
    });
  } catch {
    redirect(`/events/${parsed.data.eventId}?error=You%20do%20not%20have%20permission%20to%20edit%20this%20event.`);
  }
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

export async function updateEventAction(formData: FormData) {
  const context = await getChurchContext();
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/events?error=This%20workspace%20is%20inactive.");
  }
  const parsed = updateEventSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    startsOn: formData.get("startsOn") || undefined,
    location: formData.get("location") || undefined
  });

  if (!parsed.success) {
    redirect("/events?error=Could%20not%20update%20the%20event.");
  }

  const supabase = await createClient();
  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: parsed.data.eventId,
      permission: "can_edit_event_settings"
    });
  } catch {
    redirect(`/events/${parsed.data.eventId}/settings?error=You%20do%20not%20have%20permission%20to%20edit%20this%20event.`);
  }
  const { error } = await supabase
    .from("events")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      starts_on: parsed.data.startsOn || null,
      location: parsed.data.location
    })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.eventId);

  if (error) {
    redirect(`/events/${parsed.data.eventId}/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${parsed.data.eventId}`);
  redirect(`/events/${parsed.data.eventId}/settings?updated=true`);
}

export async function updateEventArchiveAction(formData: FormData) {
  const context = await getChurchContext();
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/events?error=This%20workspace%20is%20inactive.");
  }
  const parsed = eventArchiveSchema.safeParse({
    eventId: formData.get("eventId"),
    archived: formData.get("archived")
  });

  if (!parsed.success) {
    redirect("/events?error=Could%20not%20update%20the%20event%20archive%20state.");
  }

  const isArchiving = parsed.data.archived === "true";
  const supabase = await createClient();
  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: parsed.data.eventId,
      permission: "can_edit_event_settings"
    });
  } catch {
    redirect(`/events/${parsed.data.eventId}?error=You%20do%20not%20have%20permission%20to%20edit%20this%20event.`);
  }
  const { data: updatedEvents, error } = await supabase
    .from("events")
    .update({
      archived_at: isArchiving ? new Date().toISOString() : null,
      is_active: isArchiving ? false : true
    })
    .select("id")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.eventId);

  if (error) {
    redirect(`/events/${parsed.data.eventId}?error=${encodeURIComponent(error.message)}`);
  }

  if (!updatedEvents?.length) {
    redirect(`/events/${parsed.data.eventId}?error=Event%20was%20not%20updated.%20Please%20refresh%20and%20try%20again.`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/contacts");
  revalidatePath(`/events/${parsed.data.eventId}`);
  redirect(`/events/${parsed.data.eventId}`);
}

export async function deleteEventAction(formData: FormData) {
  const context = await getChurchContext();
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/events?error=This%20workspace%20is%20inactive.");
  }
  const parsed = deleteEventSchema.safeParse({
    eventId: formData.get("eventId"),
    eventName: formData.get("eventName"),
    confirmation: formData.get("confirmation")
  });

  if (!parsed.success || parsed.data.confirmation !== parsed.data.eventName) {
    redirect(`/events/${formData.get("eventId")}?error=Type%20the%20event%20name%20exactly%20to%20delete%20it.`);
  }

  const supabase = await createClient();
  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: parsed.data.eventId,
      permission: "can_delete_event"
    });
  } catch {
    redirect(`/events/${parsed.data.eventId}/settings?error=You%20do%20not%20have%20permission%20to%20delete%20this%20event.`);
  }

  const { data: deletedEvents, error } = await supabase
    .from("events")
    .delete()
    .select("id")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.eventId)
    .eq("name", parsed.data.eventName);

  if (error) {
    redirect(`/events/${parsed.data.eventId}?error=${encodeURIComponent(error.message)}`);
  }

  if (!deletedEvents?.length) {
    redirect(`/events/${parsed.data.eventId}/settings?error=Event%20was%20not%20deleted.%20Please%20refresh%20and%20try%20again.`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/contacts");
  redirect("/events");
}

export async function bulkCloseEventsAction(formData: FormData) {
  const context = await getChurchContext();
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/events?error=This%20workspace%20is%20inactive.");
  }

  const parsed = parseBulkEventIds(formData);
  if (!parsed.success) {
    redirect("/events?error=Select%20at%20least%20one%20event%20to%20close.");
  }

  const supabase = await createClient();

  for (const eventId of parsed.data.eventIds) {
    try {
      await requireCurrentUserEventPermission({
        churchId: context.churchId,
        eventId,
        permission: "can_edit_event_settings"
      });
    } catch {
      redirect("/events?error=You%20do%20not%20have%20permission%20to%20close%20one%20or%20more%20selected%20events.");
    }
  }

  const { data: updatedEvents, error } = await supabase
    .from("events")
    .update({ is_active: false })
    .select("id")
    .eq("church_id", context.churchId)
    .in("id", parsed.data.eventIds);

  if (error) {
    redirect(`/events?error=${encodeURIComponent(error.message)}`);
  }

  if ((updatedEvents?.length ?? 0) !== parsed.data.eventIds.length) {
    redirect("/events?error=Some%20selected%20events%20were%20not%20closed.%20Please%20refresh%20and%20try%20again.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/events");
  for (const eventId of parsed.data.eventIds) {
    revalidatePath(`/events/${eventId}`);
  }

  redirect(`/events?success=${encodeURIComponent(`Closed ${parsed.data.eventIds.length} selected event${parsed.data.eventIds.length === 1 ? "" : "s"}.`)}`);
}

export async function bulkDeleteEventsAction(formData: FormData) {
  const context = await getChurchContext();
  if (context.workspaceStatus === "inactive" && !context.isAppAdmin) {
    redirect("/events?error=This%20workspace%20is%20inactive.");
  }

  const parsed = parseBulkEventIds(formData);
  if (!parsed.success) {
    redirect("/events?error=Select%20at%20least%20one%20event%20to%20delete.");
  }

  const supabase = await createClient();

  for (const eventId of parsed.data.eventIds) {
    try {
      await requireCurrentUserEventPermission({
        churchId: context.churchId,
        eventId,
        permission: "can_delete_event"
      });
    } catch {
      redirect("/events?error=You%20do%20not%20have%20permission%20to%20delete%20one%20or%20more%20selected%20events.");
    }
  }

  const { data: deletedEvents, error } = await supabase
    .from("events")
    .delete()
    .select("id")
    .eq("church_id", context.churchId)
    .in("id", parsed.data.eventIds);

  if (error) {
    redirect(`/events?error=${encodeURIComponent(error.message)}`);
  }

  if ((deletedEvents?.length ?? 0) !== parsed.data.eventIds.length) {
    redirect("/events?error=Some%20selected%20events%20were%20not%20deleted.%20Please%20refresh%20and%20try%20again.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/contacts");

  redirect(`/events?success=${encodeURIComponent(`Deleted ${parsed.data.eventIds.length} selected event${parsed.data.eventIds.length === 1 ? "" : "s"}.`)}`);
}
