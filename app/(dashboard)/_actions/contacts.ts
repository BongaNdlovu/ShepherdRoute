"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { followUpChannelOptions, interestOptions, statusOptions } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

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

const followUpNoteSchema = z.object({
  contactId: z.string().uuid(),
  assignedTo: z.string().uuid().or(z.literal("unassigned")),
  channel: z.enum(followUpChannelOptions),
  status: z.enum(statusOptions),
  notes: z.string().max(2000).optional(),
  nextAction: z.string().max(500).optional(),
  dueAt: z.string().optional(),
  markComplete: z.literal("on").optional()
});

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

export async function addFollowUpNoteAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = followUpNoteSchema.safeParse({
    contactId: formData.get("contactId"),
    assignedTo: formData.get("assignedTo"),
    channel: formData.get("channel"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
    nextAction: formData.get("nextAction") || undefined,
    dueAt: formData.get("dueAt") || undefined,
    markComplete: formData.get("markComplete") || undefined
  });

  if (!parsed.success) {
    redirect("/contacts?error=Could%20not%20save%20the%20follow-up%20note.");
  }

  const assignedTo = parsed.data.assignedTo === "unassigned" ? null : parsed.data.assignedTo;
  const completedAt = parsed.data.markComplete ? new Date().toISOString() : null;
  const supabase = await createClient();

  const { error } = await supabase.from("follow_ups").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    assigned_to: assignedTo,
    author_id: context.userId,
    channel: parsed.data.channel,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
    next_action: parsed.data.nextAction || null,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
    completed_at: completedAt
  });

  if (error) {
    redirect(`/contacts/${parsed.data.contactId}?error=${encodeURIComponent(error.message)}`);
  }

  await supabase
    .from("contacts")
    .update({
      assigned_to: assignedTo,
      status: parsed.data.status
    })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId);

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
  redirect(`/contacts/${parsed.data.contactId}`);
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
