"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { chooseWorkflowOwner, saveSuggestedWhatsappMessage } from "@/lib/contactWorkflow";
import { classifyContact } from "@/lib/classifyContact";
import { interestOptions, statusOptions, assignmentRoleOptions } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { defaultDueDate, prayerVisibilityOptions } from "@/lib/followUp";
import { createClient } from "@/lib/supabase/server";
import { generateMessage } from "@/lib/whatsapp";
import { requireActiveTeamMemberInChurch, requireContactManager, actionError } from "./contact-guards";

const contactUpdateSchema = z.object({
  contactId: z.string().uuid(),
  assignedTo: z.string().uuid().or(z.literal("unassigned")),
  assignedHandlingRole: z.enum(assignmentRoleOptions).or(z.literal("")).optional(),
  status: z.enum(statusOptions)
});

const quickContactSchema = z.object({
  fullName: z.string().min(2).max(140),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(160).optional(),
  area: z.string().max(120).optional(),
  language: z.string().max(80).optional(),
  eventId: z.string().uuid().optional(),
  interests: z.array(z.enum(interestOptions)).min(1),
  consentStatus: z.enum(["given", "unknown", "not_given"]),
  consentNote: z.string().max(500).optional(),
  prayerVisibility: z.enum(prayerVisibilityOptions).default("general_prayer"),
  prayerRequest: z.string().max(2000).optional()
});

const contactLifecycleSchema = z.object({
  contactId: z.string().uuid(),
  intent: z.enum(["do_not_contact", "archive", "delete"])
});

const bulkAssignmentSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1),
  assignedTo: z.string().uuid().or(z.literal("unassigned")),
  assignedHandlingRole: z.enum(assignmentRoleOptions).or(z.literal("")).optional(),
  status: z.enum(statusOptions).optional()
});

const bulkLifecycleSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1).max(100),
  intent: z.enum(["do_not_contact", "archive", "delete"])
});

function parseContactIds(formData: FormData) {
  return formData
    .getAll("contactIds")
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function safeReturnTo(formData: FormData, fallback = "/contacts") {
  const value = String(formData.get("returnTo") ?? "");
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function updateContactAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = contactUpdateSchema.safeParse({
    contactId: formData.get("contactId"),
    assignedTo: formData.get("assignedTo"),
    assignedHandlingRole: formData.has("assignedHandlingRole")
      ? formData.get("assignedHandlingRole") || ""
      : undefined,
    status: formData.get("status")
  });

  if (!parsed.success) {
    redirect("/contacts?error=Could%20not%20update%20contact.");
  }

  const assignedTo = parsed.data.assignedTo === "unassigned" ? null : parsed.data.assignedTo;
  const assignedHandlingRole =
    parsed.data.assignedHandlingRole === undefined
      ? undefined
      : parsed.data.assignedHandlingRole === ""
        ? null
        : parsed.data.assignedHandlingRole;

  const supabase = await createClient();
  await requireContactManager(context, supabase);
  await requireActiveTeamMemberInChurch(supabase, context.churchId, assignedTo);

  const contactUpdate: {
    assigned_to: string | null;
    status: typeof parsed.data.status;
    assigned_handling_role?: string | null;
  } = {
    assigned_to: assignedTo,
    status: parsed.data.status
  };

  if (assignedHandlingRole !== undefined) {
    contactUpdate.assigned_handling_role = assignedHandlingRole;
  }

  const { error } = await supabase
    .from("contacts")
    .update(contactUpdate)
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId);

  if (error) {
    redirect(`/contacts?error=${actionError(error, "Could not update contact.")}`);
  }

  const { data: updatedContact } = await supabase
    .from("contacts")
    .select("assigned_handling_role")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId)
    .single();

  const { error: followUpError } = await supabase.from("follow_ups").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    assigned_to: assignedTo,
    assigned_handling_role: updatedContact?.assigned_handling_role ?? null,
    author_id: context.userId,
    channel: "note",
    status: parsed.data.status,
    notes: "Follow-up tracker updated.",
    next_action: parsed.data.status === "closed" ? "No further action needed." : "Continue follow-up pathway."
  });

  if (followUpError) {
    redirect(`/contacts/${parsed.data.contactId}?error=${actionError(followUpError, "Contact updated, but the follow-up history could not be saved.")}`);
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
}

export async function updateContactLifecycleAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = contactLifecycleSchema.safeParse({
    contactId: formData.get("contactId"),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect("/contacts?error=Could%20not%20update%20contact%20preferences.");
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  await requireContactManager(context, supabase);
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, person_id")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId)
    .is("deleted_at", null)
    .single();

  if (contactError || !contact) {
    redirect("/contacts?error=Contact%20not%20found.");
  }

  const update =
    parsed.data.intent === "do_not_contact"
      ? { do_not_contact: true, do_not_contact_at: now }
      : parsed.data.intent === "archive"
        ? { archived_at: now, status: "closed" as const }
        : { deleted_at: now, do_not_contact: true, do_not_contact_at: now, status: "closed" as const };

  const { data: updatedContacts, error } = await supabase
    .from("contacts")
    .update(update)
    .select("id")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId);

  if (error) {
    redirect(`/contacts/${parsed.data.contactId}?error=${encodeURIComponent(error.message)}`);
  }

  if (!updatedContacts?.length) {
    redirect(`/contacts/${parsed.data.contactId}?error=Contact%20was%20not%20deleted.%20Please%20refresh%20and%20try%20again.`);
  }

  if (contact.person_id) {
    const personUpdate =
      parsed.data.intent === "do_not_contact"
        ? { do_not_contact: true, do_not_contact_at: now }
        : parsed.data.intent === "archive"
          ? { archived_at: now }
          : { deleted_at: now, do_not_contact: true, do_not_contact_at: now };

    const { error: personUpdateError } = await supabase
      .from("people")
      .update(personUpdate)
      .eq("church_id", context.churchId)
      .eq("id", contact.person_id);

    if (personUpdateError) {
      redirect(`/contacts/${parsed.data.contactId}?error=${actionError(personUpdateError, "Contact updated, but the linked person record could not be updated.")}`);
    }
  }

  const { error: lifecycleFollowUpError } = await supabase.from("follow_ups").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    author_id: context.userId,
    channel: "note",
    status: "closed",
    notes: parsed.data.intent === "do_not_contact"
      ? "Contact marked do not contact."
      : parsed.data.intent === "archive"
        ? "Contact archived."
        : "Contact soft-deleted and marked do not contact.",
    completed_at: now
  });

  if (lifecycleFollowUpError) {
    redirect(`/contacts/${parsed.data.contactId}?error=${actionError(lifecycleFollowUpError, "Contact updated, but the lifecycle note could not be saved.")}`);
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/reports");

  if (parsed.data.intent === "archive" || parsed.data.intent === "delete") {
    redirect("/contacts");
  }
}

export async function addQuickContactAction(formData: FormData) {
  const context = await getChurchContext();
  const interests = formData.getAll("interests").map(String);
  const parsed = quickContactSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    area: formData.get("area") || undefined,
    language: formData.get("language") || undefined,
    eventId: formData.get("eventId") || undefined,
    interests,
    consentStatus: formData.get("consentStatus") || "given",
    consentNote: formData.get("consentNote") || undefined,
    prayerVisibility: formData.get("prayerVisibility") || "general_prayer",
    prayerRequest: formData.get("prayerRequest") || undefined
  });

  if (!parsed.success) {
    redirect("/contacts?error=Please%20add%20a%20name%20and%20interest.");
  }

  if (!parsed.data.phone && !parsed.data.email) {
    redirect("/contacts?error=Please%20add%20either%20a%20phone%20number%20or%20an%20email%20address.");
  }

  const supabase = await createClient();
  await requireContactManager(context, supabase);

  if (parsed.data.eventId) {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("church_id", context.churchId)
      .eq("id", parsed.data.eventId)
      .maybeSingle();

    if (eventError || !event) {
      redirect("/contacts?error=Invalid%20event%20selected.");
    }
  }

  const classification = classifyContact({
    selectedInterests: parsed.data.interests,
    message: parsed.data.prayerRequest,
    visitorType: "general"
  });
  const dueAt = defaultDueDate(
    classification.urgency,
    classification.recommended_assigned_role,
    classification.recommended_tags
  ).toISOString();
  const { data: team } = await supabase
    .from("team_members")
    .select("id, role, display_name")
    .eq("church_id", context.churchId)
    .eq("is_active", true)
    .order("display_name");
  const assignedTo = chooseWorkflowOwner(team ?? [], classification.recommended_assigned_role);
  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      church_id: context.churchId,
      event_id: parsed.data.eventId || null,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      whatsapp_number: parsed.data.phone,
      area: parsed.data.area || null,
      language: parsed.data.language || "English",
      status: assignedTo ? "assigned" : "new",
      urgency: classification.urgency,
      assigned_to: assignedTo,
      assigned_handling_role: classification.recommended_assigned_role,
      recommended_assigned_role: classification.recommended_assigned_role,
      consent_given: parsed.data.consentStatus === "given",
      consent_at: parsed.data.consentStatus === "given" ? new Date().toISOString() : null,
      consent_source: "manual",
      consent_scope: ["follow_up"],
      consent_text_snapshot: parsed.data.consentNote || null,
      privacy_policy_version: "v1.0",
      consent_status: parsed.data.consentStatus,
      consent_recorded_by: context.userId,
      do_not_contact: parsed.data.consentStatus === "not_given",
      source: "manual",
      classification_payload: {
        ...classification,
        classification_version: "rule_v1",
        rule_based: true,
        ready_for_ai: false
      }
    })
    .select("id, church_id, person_id, event_id, classification_payload")
    .single();

  if (error || !contact) {
    redirect(`/contacts?error=${encodeURIComponent(error?.message ?? "Could not add contact.")}`);
  }

  const { error: interestsError } = await supabase.from("contact_interests").insert(
    parsed.data.interests.map((interest) => ({
      church_id: context.churchId,
      contact_id: contact.id,
      interest
    }))
  );

  if (interestsError) {
    redirect(`/contacts/${contact.id}?error=${actionError(interestsError, "Contact created, but interests could not be saved.")}`);
  }

  if (parsed.data.prayerRequest) {
    const { error: prayerError } = await supabase.from("prayer_requests").insert({
      church_id: context.churchId,
      contact_id: contact.id,
      request_text: parsed.data.prayerRequest,
      visibility: parsed.data.prayerVisibility,
      created_by: context.userId
    });

    if (prayerError) {
      redirect(`/contacts/${contact.id}?error=${actionError(prayerError, "Contact created, but prayer request could not be saved.")}`);
    }
  }

  const { data: eventForMessage } = contact.event_id
    ? await supabase
      .from("events")
      .select("name, event_type")
      .eq("church_id", context.churchId)
      .eq("id", contact.event_id)
      .single()
    : { data: null };
  const suggestedMessage = parsed.data.phone ? generateMessage({
    name: parsed.data.fullName,
    phone: parsed.data.phone,
    interests: parsed.data.interests,
    churchName: context.churchName,
    eventName: eventForMessage?.name,
    templateType: eventForMessage?.event_type
  }) : null;
  if (parsed.data.phone && suggestedMessage) {
    const { error: suggestedMessageError } = await saveSuggestedWhatsappMessage({
      supabase,
      contact: {
        id: contact.id,
        church_id: contact.church_id,
        phone: parsed.data.phone
      },
      message: suggestedMessage,
      generatedBy: context.userId
    });

    if (suggestedMessageError) {
      redirect(`/contacts/${contact.id}?error=${actionError(suggestedMessageError, "Contact created, but the suggested WhatsApp message could not be saved.")}`);
    }
  }

  const { error: followUpError } = await supabase.from("follow_ups").insert({
    church_id: context.churchId,
    contact_id: contact.id,
    assigned_to: assignedTo,
    assigned_handling_role: classification.recommended_assigned_role,
    author_id: context.userId,
    channel: "note",
    status: assignedTo ? "assigned" : "new",
    notes: "Manual intake contact created.",
    next_action: classification.recommended_next_action,
    due_at: dueAt
  });

  if (followUpError) {
    redirect(`/contacts/${contact.id}?error=${actionError(followUpError, "Contact created, but first follow-up could not be saved.")}`);
  }

  if (contact.person_id) {
    const event = eventForMessage;

    const { error: journeyError } = await supabase.from("contact_journey_events").insert({
      church_id: context.churchId,
      person_id: contact.person_id,
      contact_id: contact.id,
      event_id: contact.event_id,
      event_type: event?.event_type ?? null,
      title: event?.name ? `Manual intake for ${event.name}` : "Manual intake contact",
      summary: classification.summary,
      selected_interests: parsed.data.interests,
      classification_payload: contact.classification_payload
    });

    if (journeyError) {
      redirect(`/contacts/${contact.id}?error=${actionError(journeyError, "Contact created, but journey history could not be saved.")}`);
    }
  }

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function bulkAssignContactsAction(formData: FormData) {
  const context = await getChurchContext();
  const returnTo = safeReturnTo(formData);
  const contactIds = parseContactIds(formData);
  const parsed = bulkAssignmentSchema.safeParse({
    contactIds,
    assignedTo: formData.get("assignedTo"),
    assignedHandlingRole: formData.has("assignedHandlingRole")
      ? formData.get("assignedHandlingRole") === "no_change"
        ? ""
        : formData.get("assignedHandlingRole") || ""
      : undefined,
    status: formData.get("status") === "no_change"
      ? undefined
      : formData.has("status")
        ? formData.get("status") || undefined
        : undefined
  });

  if (!parsed.success) {
    redirect(`${returnTo}?error=Could%20not%20bulk%20assign%20contacts.`);
  }

  const assignedTo = parsed.data.assignedTo === "unassigned" ? null : parsed.data.assignedTo;
  const assignedHandlingRole =
    parsed.data.assignedHandlingRole === undefined
      ? undefined
      : parsed.data.assignedHandlingRole === ""
        ? null
        : parsed.data.assignedHandlingRole;

  const supabase = await createClient();
  await requireContactManager(context, supabase);
  await requireActiveTeamMemberInChurch(supabase, context.churchId, assignedTo);

  const { data: validContacts } = await supabase
    .from("contacts")
    .select("id, event_id")
    .eq("church_id", context.churchId)
    .in("id", parsed.data.contactIds)
    .is("deleted_at", null)
    .is("archived_at", null);

  if (!validContacts || validContacts.length === 0) {
    redirect(`${returnTo}?error=No%20valid%20contacts%20found%20to%20assign.`);
  }

  const validContactIds = validContacts.map((c) => c.id);

  const contactUpdate: {
    assigned_to: string | null;
    status?: typeof parsed.data.status;
    assigned_handling_role?: string | null;
  } = {
    assigned_to: assignedTo
  };

  if (parsed.data.status !== undefined) {
    contactUpdate.status = parsed.data.status;
  }

  if (assignedHandlingRole !== undefined) {
    contactUpdate.assigned_handling_role = assignedHandlingRole;
  }

  const { error: updateError } = await supabase
    .from("contacts")
    .update(contactUpdate)
    .eq("church_id", context.churchId)
    .in("id", validContactIds);

  if (updateError) {
    redirect(`${returnTo}?error=${actionError(updateError, "Could not bulk assign contacts.")}`);
  }

  const { data: updatedContacts, error: updatedContactsError } = await supabase
    .from("contacts")
    .select("id, assigned_handling_role")
    .eq("church_id", context.churchId)
    .in("id", validContactIds);

  if (updatedContactsError) {
    redirect(`${returnTo}?error=${actionError(updatedContactsError, "Contacts updated, but follow-up history could not be prepared.")}`);
  }

  const { error: followUpError } = await supabase.from("follow_ups").insert(
    (updatedContacts ?? []).map((contact) => ({
      church_id: context.churchId,
      contact_id: contact.id,
      assigned_to: assignedTo,
      assigned_handling_role: contact.assigned_handling_role ?? null,
      author_id: context.userId,
      channel: "note",
      status: parsed.data.status ?? "assigned",
      notes: "Bulk assignment updated.",
      next_action: parsed.data.status === "closed" ? "No further action needed." : "Continue follow-up pathway."
    }))
  );

  if (followUpError) {
    redirect(`${returnTo}?error=${actionError(followUpError, "Contacts updated, but follow-up history could not be saved.")}`);
  }

  const eventIds = Array.from(new Set(validContacts.map((contact) => contact.event_id).filter(Boolean)));

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  for (const eventId of eventIds) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/contacts`);
  }
  redirect(`${returnTo}?success=Bulk%20assignment%20completed.`);
}

export async function bulkUpdateContactsLifecycleAction(formData: FormData) {
  const context = await getChurchContext();
  const returnTo = safeReturnTo(formData);
  const parsed = bulkLifecycleSchema.safeParse({
    contactIds: parseContactIds(formData),
    intent: formData.get("intent")
  });

  if (!parsed.success) {
    redirect(`${returnTo}?error=Could%20not%20update%20selected%20contacts.`);
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  await requireContactManager(context, supabase);

  const { data: validContacts, error: validContactsError } = await supabase
    .from("contacts")
    .select("id, person_id, event_id")
    .eq("church_id", context.churchId)
    .in("id", parsed.data.contactIds)
    .is("deleted_at", null);

  if (validContactsError) {
    redirect(`${returnTo}?error=${actionError(validContactsError, "Could not find selected contacts.")}`);
  }

  if (!validContacts || validContacts.length === 0) {
    redirect(`${returnTo}?error=No%20valid%20contacts%20found.`);
  }

  const validContactIds = validContacts.map((contact) => contact.id);
  const update =
    parsed.data.intent === "do_not_contact"
      ? { do_not_contact: true, do_not_contact_at: now }
      : parsed.data.intent === "archive"
        ? { archived_at: now, status: "closed" as const }
        : { deleted_at: now, do_not_contact: true, do_not_contact_at: now, status: "closed" as const };

  const { data: updatedContacts, error: updateError } = await supabase
    .from("contacts")
    .update(update)
    .select("id")
    .eq("church_id", context.churchId)
    .in("id", validContactIds);

  if (updateError) {
    redirect(`${returnTo}?error=${actionError(updateError, "Could not update selected contacts.")}`);
  }

  if ((updatedContacts?.length ?? 0) !== validContactIds.length) {
    redirect(`${returnTo}?error=Some%20selected%20contacts%20were%20not%20deleted.%20Please%20refresh%20and%20try%20again.`);
  }

  const personIds = Array.from(new Set(validContacts.map((contact) => contact.person_id).filter(Boolean)));
  if (personIds.length > 0) {
    const personUpdate =
      parsed.data.intent === "do_not_contact"
        ? { do_not_contact: true, do_not_contact_at: now }
        : parsed.data.intent === "archive"
          ? { archived_at: now }
          : { deleted_at: now, do_not_contact: true, do_not_contact_at: now };

    const { error: personUpdateError } = await supabase
      .from("people")
      .update(personUpdate)
      .eq("church_id", context.churchId)
      .in("id", personIds);

    if (personUpdateError) {
      redirect(`${returnTo}?error=${actionError(personUpdateError, "Contacts updated, but linked person records could not be updated.")}`);
    }
  }

  const lifecycleLabel =
    parsed.data.intent === "do_not_contact"
      ? "Bulk marked do not contact."
      : parsed.data.intent === "archive"
        ? "Bulk archived."
        : "Bulk soft-deleted and marked do not contact.";

  const { error: followUpError } = await supabase.from("follow_ups").insert(
    validContactIds.map((contactId) => ({
      church_id: context.churchId,
      contact_id: contactId,
      author_id: context.userId,
      channel: "note",
      status: "closed",
      notes: lifecycleLabel,
      completed_at: now
    }))
  );

  if (followUpError) {
    redirect(`${returnTo}?error=${actionError(followUpError, "Contacts updated, but lifecycle notes could not be saved.")}`);
  }

  const eventIds = Array.from(new Set(validContacts.map((contact) => contact.event_id).filter(Boolean)));

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/reports");
  for (const eventId of eventIds) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/contacts`);
    revalidatePath(`/events/${eventId}/reports`);
  }

  const success =
    parsed.data.intent === "do_not_contact"
      ? "Selected%20contacts%20marked%20do%20not%20contact."
      : parsed.data.intent === "archive"
        ? "Selected%20contacts%20archived."
        : "Selected%20contacts%20deleted.";

  redirect(`${returnTo}?success=${success}`);
}
