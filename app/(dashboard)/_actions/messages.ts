"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";
import { AI_TRIAGE_WHATSAPP_PROMPT_VERSION, createWhatsappLink, CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION, generateMessage } from "@/lib/whatsapp";
import { requireContactManager, requireFollowUpAssigner } from "./contact-guards";
import type { Interest } from "@/lib/constants";

const generatedMessageSchema = z.object({
  contactId: z.string().uuid(),
  phone: z.string().max(40).optional(),
  message: z.string().min(2).max(2000)
});

const openSuggestedMessageSchema = z.object({
  followUpId: z.string().uuid(),
  contactId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  returnTo: z.string().optional()
});

export async function saveGeneratedMessageAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = generatedMessageSchema.safeParse({
    contactId: formData.get("contactId"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message")
  });

  if (!parsed.success) {
    redirect("/contacts?error=Could%20not%20open%20WhatsApp%20message.");
  }

  if (!parsed.data.phone) {
    redirect("/contacts?error=Add%20a%20valid%20WhatsApp%20phone%20number%20before%20opening%20WhatsApp.");
  }

  const link = createWhatsappLink(parsed.data.phone, parsed.data.message);

  if (!link) {
    redirect("/contacts?error=Add%20a%20valid%20WhatsApp%20phone%20number%20before%20opening%20WhatsApp.");
  }
  const supabase = await createClient();
  await requireContactManager(context, supabase, `/contacts/${parsed.data.contactId}`);
  const { data: insertedMessage } = await supabase.from("generated_messages").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    generated_by: context.userId,
    channel: "whatsapp",
    message_text: parsed.data.message,
    wa_link: link,
    prompt_version: CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION
  }).select("id").single();

  await supabase.from("message_open_events").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    generated_message_id: insertedMessage?.id ?? null,
    channel: "whatsapp",
    opened_by: context.userId,
    opened_url: link
  });

  revalidatePath(`/contacts/${parsed.data.contactId}`);
  redirect(link);
}

export async function openSuggestedWhatsappAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = openSuggestedMessageSchema.safeParse({
    followUpId: formData.get("followUpId"),
    contactId: formData.get("contactId"),
    messageId: formData.get("messageId") || undefined,
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    redirect("/follow-ups?error=Could%20not%20open%20the%20WhatsApp%20message.");
  }

  const supabase = await createClient();
  const returnTo = safeReturnTo(parsed.data.returnTo, "/follow-ups");
  try {
    await requireFollowUpAssigner(context, supabase, returnTo);
  } catch (error) {
    const { data: contactForPermission } = await supabase
      .from("contacts")
      .select("event_id")
      .eq("church_id", context.churchId)
      .eq("id", parsed.data.contactId)
      .maybeSingle();

    if (!contactForPermission?.event_id) {
      throw error;
    }

    try {
      await requireCurrentUserEventPermission({
        churchId: context.churchId,
        eventId: contactForPermission.event_id,
        permission: "can_view_contacts"
      });
    } catch {
      throw error;
    }
  }
  const { data: followUp, error: followUpError } = await supabase
    .from("follow_ups")
    .select("id, contact_id, completed_at")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.followUpId)
    .eq("contact_id", parsed.data.contactId)
    .maybeSingle();

  if (followUpError || !followUp) {
    redirect(`/contacts/${parsed.data.contactId}?error=Follow-up%20task%20not%20found.`);
  }

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, phone, whatsapp_number, do_not_contact")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId)
    .maybeSingle();

  if (!contact || contact.do_not_contact) {
    redirect(`/contacts/${parsed.data.contactId}?error=This%20contact%20has%20opted%20out%20of%20follow-up.`);
  }

  let messageText = "";
  let promptVersion = CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION;

  if (parsed.data.messageId) {
    const { data: message, error } = await supabase
      .from("generated_messages")
      .select("id, message_text, prompt_version")
      .eq("church_id", context.churchId)
      .eq("contact_id", parsed.data.contactId)
      .eq("id", parsed.data.messageId)
      .eq("purpose", "suggested_whatsapp")
      .maybeSingle();

    if (error) {
      redirect(`${returnTo}?error=Could%20not%20load%20the%20suggested%20WhatsApp%20message.`);
    }

    messageText = message?.message_text ?? "";
    promptVersion = message?.prompt_version ?? CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION;

    if (message && !messageText.trim()) {
      await supabase
        .from("generated_messages")
        .update({ wa_link: null })
        .eq("church_id", context.churchId)
        .eq("contact_id", parsed.data.contactId)
        .eq("id", parsed.data.messageId)
        .eq("purpose", "suggested_whatsapp");

      redirect(`${returnTo}?error=No%20WhatsApp%20draft%20is%20available%20for%20this%20contact.`);
    }

    if (
      message &&
      message.prompt_version !== CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION &&
      message.prompt_version !== AI_TRIAGE_WHATSAPP_PROMPT_VERSION
    ) {
      const { data: contactForMessage } = await supabase
        .from("contacts")
        .select("full_name, phone, whatsapp_number, events(name, event_type), contact_interests(interest)")
        .eq("church_id", context.churchId)
        .eq("id", parsed.data.contactId)
        .maybeSingle();

      if (contactForMessage) {
        const event = Array.isArray(contactForMessage.events)
          ? contactForMessage.events[0] ?? null
          : contactForMessage.events;
        messageText = generateMessage({
          name: contactForMessage.full_name,
          phone: contactForMessage.phone ?? contactForMessage.whatsapp_number,
          interests: (contactForMessage.contact_interests ?? []).map((item: { interest: Interest }) => item.interest),
          churchName: context.churchName,
          eventName: event?.name,
          templateType: event?.event_type
        });
        promptVersion = CURRENT_SUGGESTED_WHATSAPP_PROMPT_VERSION;
      }
    }
  }

  const link = createWhatsappLink(contact.whatsapp_number ?? contact.phone, messageText);

  if (!link) {
    redirect(`${returnTo}?error=Add%20a%20valid%20WhatsApp%20number%20before%20opening%20WhatsApp.`);
  }

  if (parsed.data.messageId) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("generated_messages")
      .update({
        opened_at: now,
        wa_link: link,
        message_text: messageText,
        prompt_version: promptVersion
      })
      .eq("church_id", context.churchId)
      .eq("contact_id", parsed.data.contactId)
      .eq("id", parsed.data.messageId)
      .eq("purpose", "suggested_whatsapp");

    if (updateError) {
      console.error("Suggested WhatsApp message update error:", updateError);
      redirect(`${returnTo}?error=Could%20not%20update%20the%20suggested%20WhatsApp%20message.`);
    }
  }

  await supabase.from("message_open_events").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    generated_message_id: parsed.data.messageId ?? null,
    channel: "whatsapp",
    opened_by: context.userId,
    opened_url: link
  });

  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
  redirect(link);
}

function safeReturnTo(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
