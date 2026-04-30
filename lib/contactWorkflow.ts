import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssignedRole } from "@/lib/classifyContact";
import type { Interest } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";
import { waLink } from "@/lib/whatsapp";

export type WorkflowTeamMember = {
  id: string;
  role: string;
  display_name?: string | null;
};

export type SuggestedMessageContact = {
  id: string;
  church_id: string;
  phone: string;
};

const ownerRoleFallbacks: Record<AssignedRole, string[]> = {
  pastor: ["pastor", "elder", "admin"],
  elder: ["elder", "pastor", "admin"],
  bible_worker: ["bible_worker", "pastor", "elder", "admin"],
  health_leader: ["health_leader", "pastor", "elder", "admin"],
  prayer_team: ["prayer_team", "pastor", "elder", "admin"]
};

export function chooseWorkflowOwner(team: WorkflowTeamMember[], recommendedRole: AssignedRole) {
  const fallbackRoles = ownerRoleFallbacks[recommendedRole] ?? ["elder", "pastor", "admin"];

  return fallbackRoles
    .map((role) => team.find((member) => member.role === role))
    .find(Boolean)?.id ?? null;
}

export async function saveSuggestedWhatsappMessage({
  supabase,
  contact,
  message,
  generatedBy = null
}: {
  supabase: SupabaseClient<Database>;
  contact: SuggestedMessageContact;
  message: string;
  generatedBy?: string | null;
}) {
  const link = waLink(contact.phone, message);
  const { data: existing, error: existingError } = await supabase
    .from("generated_messages")
    .select("id")
    .eq("church_id", contact.church_id)
    .eq("contact_id", contact.id)
    .eq("purpose", "suggested_whatsapp")
    .maybeSingle();

  if (existingError) {
    return { error: existingError };
  }

  if (existing) {
    const { error } = await supabase
      .from("generated_messages")
      .update({
        generated_by: generatedBy,
        channel: "whatsapp",
        message_text: message,
        wa_link: link,
        prompt_version: "v1_suggested",
        purpose: "suggested_whatsapp"
      })
      .eq("church_id", contact.church_id)
      .eq("id", existing.id);

    return { error };
  }

  const { error } = await supabase.from("generated_messages").insert({
    church_id: contact.church_id,
    contact_id: contact.id,
    generated_by: generatedBy,
    channel: "whatsapp",
    message_text: message,
    wa_link: link,
    prompt_version: "v1_suggested",
    purpose: "suggested_whatsapp"
  });

  return { error };
}

export function interestsFromRows(rows: Array<{ interest: Interest }>) {
  return rows.map((row) => row.interest);
}
