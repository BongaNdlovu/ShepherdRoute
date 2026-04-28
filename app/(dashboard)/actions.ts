"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eventTypeOptions, interestOptions, roleOptions, statusOptions } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

const eventSchema = z.object({
  name: z.string().min(2).max(140),
  eventType: z.enum(eventTypeOptions),
  startsOn: z.string().optional(),
  location: z.string().max(180).optional(),
  description: z.string().max(500).optional()
});

const contactUpdateSchema = z.object({
  contactId: z.string().uuid(),
  assignedTo: z.string().uuid().or(z.literal("unassigned")),
  status: z.enum(statusOptions)
});

const quickContactSchema = z.object({
  fullName: z.string().min(2).max(140),
  phone: z.string().min(6).max(40),
  area: z.string().max(120).optional(),
  language: z.string().max(80).optional(),
  eventId: z.string().uuid().optional(),
  interests: z.array(z.enum(interestOptions)).min(1),
  prayerRequest: z.string().max(2000).optional()
});

const teamMemberSchema = z.object({
  displayName: z.string().min(2).max(120),
  role: z.enum(roleOptions)
});

const generatedMessageSchema = z.object({
  contactId: z.string().uuid(),
  phone: z.string().min(6).max(40),
  message: z.string().min(2).max(2000)
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

export async function updateContactAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = contactUpdateSchema.safeParse({
    contactId: formData.get("contactId"),
    assignedTo: formData.get("assignedTo"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    redirect("/contacts?error=Could%20not%20update%20contact.");
  }

  const assignedTo = parsed.data.assignedTo === "unassigned" ? null : parsed.data.assignedTo;
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ assigned_to: assignedTo, status: parsed.data.status })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId);

  if (!error) {
    await supabase.from("follow_ups").insert({
      church_id: context.churchId,
      contact_id: parsed.data.contactId,
      assigned_to: assignedTo,
      author_id: context.userId,
      channel: "note",
      status: parsed.data.status,
      notes: "Follow-up tracker updated.",
      next_action: parsed.data.status === "closed" ? "No further action needed." : "Continue follow-up pathway."
    });
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
}

export async function addQuickContactAction(formData: FormData) {
  const context = await getChurchContext();
  const interests = formData.getAll("interests").map(String);
  const parsed = quickContactSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    area: formData.get("area") || undefined,
    language: formData.get("language") || undefined,
    eventId: formData.get("eventId") || undefined,
    interests,
    prayerRequest: formData.get("prayerRequest") || undefined
  });

  if (!parsed.success) {
    redirect("/contacts?error=Please%20add%20a%20name,%20phone,%20and%20interest.");
  }

  const supabase = await createClient();
  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      church_id: context.churchId,
      event_id: parsed.data.eventId || null,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      area: parsed.data.area || null,
      language: parsed.data.language || "English",
      status: "new",
      urgency: parsed.data.interests.includes("pastoral_visit") || parsed.data.interests.includes("baptism") ? "high" : "medium",
      consent_given: true,
      consent_at: new Date().toISOString(),
      source: "manual"
    })
    .select("id")
    .single();

  if (error || !contact) {
    redirect(`/contacts?error=${encodeURIComponent(error?.message ?? "Could not add contact.")}`);
  }

  await supabase.from("contact_interests").insert(
    parsed.data.interests.map((interest) => ({
      church_id: context.churchId,
      contact_id: contact.id,
      interest
    }))
  );

  if (parsed.data.prayerRequest) {
    await supabase.from("prayer_requests").insert({
      church_id: context.churchId,
      contact_id: contact.id,
      request_text: parsed.data.prayerRequest,
      visibility: "pastoral_prayer",
      created_by: context.userId
    });
  }

  await supabase.from("follow_ups").insert({
    church_id: context.churchId,
    contact_id: contact.id,
    author_id: context.userId,
    channel: "note",
    status: "new",
    notes: "Manual intake contact created.",
    next_action: "Assign first follow-up within 48 hours."
  });

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function addTeamMemberAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = teamMemberSchema.safeParse({
    displayName: formData.get("displayName"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    redirect("/settings/team?error=Please%20add%20a%20name%20and%20role.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({
    church_id: context.churchId,
    display_name: parsed.data.displayName,
    role: parsed.data.role
  });

  if (error) {
    redirect(`/settings/team?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/team");
  redirect("/settings/team");
}

export async function saveGeneratedMessageAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = generatedMessageSchema.safeParse({
    contactId: formData.get("contactId"),
    phone: formData.get("phone"),
    message: formData.get("message")
  });

  if (!parsed.success) {
    redirect("/contacts?error=Could%20not%20open%20WhatsApp%20message.");
  }

  const link = waLink(parsed.data.phone, parsed.data.message);
  const supabase = await createClient();
  await supabase.from("generated_messages").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    generated_by: context.userId,
    channel: "whatsapp",
    message_text: parsed.data.message,
    wa_link: link
  });

  revalidatePath(`/contacts/${parsed.data.contactId}`);
  redirect(link);
}
