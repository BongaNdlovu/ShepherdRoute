import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getPublicEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_events")
    .select("id, name, event_type, starts_on, location, slug, church_name, form_config, branding_config, public_info")
    .eq("slug", slug)
    .single();

  if (!data) {
    notFound();
  }

  return data;
}
