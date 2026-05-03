import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssignmentRole } from "@/lib/constants";
import type { Interest } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";
import { createWhatsappLink } from "@/lib/whatsapp";

export type WorkflowTeamMember = {
  id: string;
  role: string;
  display_name?: string | null;
};

export type SuggestedMessageContact = {
  id: string;
  church_id: string;
  phone: string | null;
};

const ownerRoleFallbacks: Record<AssignmentRole, string[]> = {
  pastor: ["pastor", "elder", "admin"],
  elder: ["elder", "pastor", "admin"],
  bible_worker: ["bible_worker", "pastor", "elder", "admin"],
  health_leader: ["health_leader", "pastor", "elder", "admin"],
  prayer_team: ["prayer_team", "pastor", "elder", "admin"],
  youth_leader: ["youth_leader", "elder", "pastor", "admin"],
  family_ministries: ["elder", "pastor", "admin"],
  deacon_deaconess: ["elder", "pastor", "admin"],
  interest_coordinator: ["elder", "pastor", "admin"],
  event_leader: ["elder", "pastor", "admin"],
  admin_secretary: ["elder", "pastor", "admin"],
  general_follow_up_team: ["elder", "pastor", "admin"]
};

export function chooseWorkflowOwner(team: WorkflowTeamMember[], recommendedRole: AssignmentRole) {
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
  // If no phone number, don't save a WhatsApp link
  if (!contact.phone) {
    return { error: null };
  }

  const link = createWhatsappLink(contact.phone, message);

  // If link cannot be created, don't save
  if (!link) {
    return { error: null };
  }

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
