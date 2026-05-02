"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { createWhatsappLink } from "@/lib/whatsapp";

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

  const returnTo = safeReturnTo(parsed.data.returnTo, "/follow-ups");

  let messageText = "";

  if (parsed.data.messageId) {
    const { data: message, error } = await supabase
      .from("generated_messages")
      .select("id, message_text")
      .eq("church_id", context.churchId)
      .eq("contact_id", parsed.data.contactId)
      .eq("id", parsed.data.messageId)
      .eq("purpose", "suggested_whatsapp")
      .maybeSingle();

    if (error) {
      redirect(`${returnTo}?error=Could%20not%20load%20the%20suggested%20WhatsApp%20message.`);
    }

    messageText = message?.message_text ?? "";
  }

  const link = createWhatsappLink(contact.whatsapp_number ?? contact.phone, messageText);

  if (!link) {
    redirect(`${returnTo}?error=Add%20a%20valid%20WhatsApp%20number%20before%20opening%20WhatsApp.`);
  }

  if (parsed.data.messageId) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("generated_messages")
      .update({ opened_at: now, wa_link: link })
      .eq("church_id", context.churchId)
      .eq("contact_id", parsed.data.contactId)
      .eq("id", parsed.data.messageId)
      .eq("purpose", "suggested_whatsapp");

    if (updateError) {
      redirect(`${returnTo}?error=${encodeURIComponent(updateError.message)}`);
    }
  }

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
