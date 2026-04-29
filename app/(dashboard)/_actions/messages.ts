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
