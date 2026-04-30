"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { waLink } from "@/lib/whatsapp";

const generatedMessageSchema = z.object({
  contactId: z.string().uuid(),
  phone: z.string().min(6).max(40),
  message: z.string().min(2).max(2000)
});

const openSuggestedMessageSchema = z.object({
  followUpId: z.string().uuid(),
  contactId: z.string().uuid(),
  messageId: z.string().uuid()
});

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

export async function openSuggestedWhatsappAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = openSuggestedMessageSchema.safeParse({
    followUpId: formData.get("followUpId"),
    contactId: formData.get("contactId"),
    messageId: formData.get("messageId")
  });

  if (!parsed.success) {
    redirect("/dashboard?error=Could%20not%20open%20the%20suggested%20WhatsApp%20message.");
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
    .select("id, do_not_contact")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId)
    .maybeSingle();

  if (!contact || contact.do_not_contact) {
    redirect(`/contacts/${parsed.data.contactId}?error=This%20contact%20has%20opted%20out%20of%20follow-up.`);
  }

  const { data: message, error } = await supabase
    .from("generated_messages")
    .select("id, wa_link")
    .eq("church_id", context.churchId)
    .eq("contact_id", parsed.data.contactId)
    .eq("id", parsed.data.messageId)
    .eq("purpose", "suggested_whatsapp")
    .maybeSingle();

  if (error || !message?.wa_link) {
    redirect(`/contacts/${parsed.data.contactId}?error=Suggested%20WhatsApp%20message%20not%20found.`);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("generated_messages")
    .update({ approved_at: now, opened_at: now })
    .eq("church_id", context.churchId)
    .eq("contact_id", parsed.data.contactId)
    .eq("id", parsed.data.messageId)
    .eq("purpose", "suggested_whatsapp");

  if (updateError) {
    redirect(`/contacts/${parsed.data.contactId}?error=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
  redirect(message.wa_link);
}
