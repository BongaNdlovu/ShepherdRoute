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

  if (context.role !== "admin" && !context.isAppAdmin) {
    redirect("/settings?error=You%20do%20not%20have%20permission%20to%20reset%20contact%20data.");
  }

  const parsed = resetContactDataSchema.safeParse({
    confirmation: formData.get("confirmation")
  });

  if (!parsed.success) {
    redirect("/settings?error=" + encodeURIComponent(parsed.error.errors[0].message));
  }

  const supabase = await createClient();
  let resetError: string | null = null;

  try {
    const { error } = await supabase.rpc("reset_church_contact_data", {
      p_church_id: context.churchId
    });

    if (error) {
      resetError = error.message;
    }
  } catch (error) {
    resetError = getResetContactDataErrorMessage(error);
  }

  if (resetError) {
    redirect("/settings?error=" + encodeURIComponent(resetError));
  }

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/reports");
  revalidatePath("/events");
  revalidatePath("/settings");
  revalidatePath("/admin");

  redirect("/settings?reset=success");
}

function getResetContactDataErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Failed to reset contact data";
}
