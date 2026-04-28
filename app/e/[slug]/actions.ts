"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { interestOptions } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const registrationSchema = z.object({
  slug: z.string().min(2),
  fullName: z.string().min(2).max(140),
  phone: z.string().min(6).max(40),
  area: z.string().max(120).optional(),
  language: z.string().max(80).optional(),
  bestTimeToContact: z.string().max(120).optional(),
  interests: z.array(z.enum(interestOptions)).min(1),
  message: z.string().max(2000).optional(),
  consent: z.literal("on")
});

export async function submitRegistrationAction(formData: FormData) {
  const parsed = registrationSchema.safeParse({
    slug: formData.get("slug"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    area: formData.get("area") || undefined,
    language: formData.get("language") || undefined,
    bestTimeToContact: formData.get("bestTimeToContact") || undefined,
    interests: formData.getAll("interests").map(String),
    message: formData.get("message") || undefined,
    consent: formData.get("consent")
  });

  if (!parsed.success) {
    redirect(`/public/e/${formData.get("slug")}?error=Please%20add%20your%20name,%20phone,%20interest,%20and%20consent.`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_event_registration", {
    p_slug: parsed.data.slug,
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone,
    p_area: parsed.data.area ?? null,
    p_language: parsed.data.language ?? "English",
    p_best_time_to_contact: parsed.data.bestTimeToContact ?? null,
    p_interests: parsed.data.interests,
    p_message: parsed.data.message ?? null,
    p_consent_given: true
  });

  if (error) {
    redirect(`/public/e/${parsed.data.slug}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/public/e/${parsed.data.slug}?submitted=true`);
}
