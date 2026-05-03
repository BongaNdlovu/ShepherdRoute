"use server";

import { createClient } from "@/lib/supabase/server";
import { getChurchContext } from "@/lib/data";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const resetContactDataSchema = z.object({
  confirmation: z.enum(["RESET_CONTACT_DATA"], {
    errorMap: () => ({ message: "You must type exactly 'RESET_CONTACT_DATA' to confirm" })
  })
});

export async function resetContactDataAction(formData: FormData) {
  const context = await getChurchContext();

  // Permission check: only allow reset for admins
  if (context.role !== "admin" && !context.isAppAdmin) {
    redirect("/settings?error=You%20do%20not%20have%20permission%20to%20reset%20contact%20data.");
  }

  // Validate confirmation
  const parsed = resetContactDataSchema.safeParse({
    confirmation: formData.get("confirmation")
  });

  if (!parsed.success) {
    redirect("/settings?error=" + encodeURIComponent(parsed.error.errors[0].message));
  }

  const supabase = await createClient();

  try {
    // Call the RPC function to reset contact data
    const { error } = await supabase.rpc("reset_church_contact_data", {
      p_church_id: context.churchId
    });

    if (error) {
      throw error;
    }

    // Revalidate all affected paths
    revalidatePath("/contacts");
    revalidatePath("/dashboard");
    revalidatePath("/follow-ups");
    revalidatePath("/reports");
    revalidatePath("/events");
    revalidatePath("/settings");

    redirect("/settings?reset=success");
  } catch (error) {
    redirect("/settings?error=" + encodeURIComponent(error instanceof Error ? error.message : "Failed to reset contact data"));
  }
}
