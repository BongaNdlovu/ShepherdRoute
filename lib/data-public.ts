import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getPublicEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_events")
    .select("id, name, event_type, starts_on, location, slug, church_name")
    .eq("slug", slug)
    .single();

  if (!data) {
    notFound();
  }

  return data;
}
