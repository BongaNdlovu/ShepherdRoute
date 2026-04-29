"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const switchChurchSchema = z.object({
  churchId: z.string().uuid()
});

export async function switchChurchAction(formData: FormData) {
  const parsed = switchChurchSchema.safeParse({
    churchId: formData.get("churchId")
  });

  if (!parsed.success) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("church_memberships")
    .select("church_id")
    .eq("church_id", parsed.data.churchId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  cookieStore.set("selected_church_id", parsed.data.churchId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
