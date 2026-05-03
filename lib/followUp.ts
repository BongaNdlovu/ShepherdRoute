import type { AssignmentRole } from "@/lib/constants";
import type { ContactTag, Urgency } from "@/lib/classifyContact";

export type PrayerVisibility =
  | "general_prayer"
  | "pastor_only"
  | "private_contact"
  | "family_support"
  | "sensitive"
  | "health_related"
  | "pastoral_prayer"
  | "pastors_only";

export const prayerVisibilityOptions = ["general_prayer", "pastor_only", "private_contact"] as const;

export const prayerVisibilityLabels: Record<PrayerVisibility, string> = {
  general_prayer: "Prayer team may pray for me",
  pastor_only: "Pastor only",
  private_contact: "Please contact me privately",
  family_support: "Pastor or elder",
  sensitive: "Pastor only",
  health_related: "Health leader if appropriate",
  pastoral_prayer: "Prayer team may pray for me",
  pastors_only: "Pastor only"
};

export const prayerVisibilityNotes: Record<PrayerVisibility, string> = {
  general_prayer: "Visible to prayer team leaders and pastors.",
  pastor_only: "Visible to pastors and admins.",
  private_contact: "Visible to pastors and admins for private follow-up.",
  family_support: "Visible to pastors, elders, and admins.",
  sensitive: "Visible to pastors and admins only.",
  health_related: "Visible to pastors, admins, and health leaders when appropriate.",
  pastoral_prayer: "Visible to prayer team leaders and pastors.",
  pastors_only: "Visible to pastors and admins."
};

export const consentScopeLabels: Record<string, string> = {
  follow_up: "Follow-up about selected interests",
  whatsapp: "WhatsApp or phone follow-up",
  event_updates: "Event and ministry updates",
  prayer: "Prayer support follow-up"
};

export function defaultDueDate(
  urgency: Urgency,
  assignedRole?: AssignmentRole | string,
  tags: ContactTag[] = []
) {
  const dueDate = new Date();

  if (urgency === "high") {
    dueDate.setHours(dueDate.getHours() + 8);
    return dueDate;
  }

  if (assignedRole === "pastor") {
    dueDate.setDate(dueDate.getDate() + 1);
    return dueDate;
  }

  if (tags.some((tag) => ["bible_study", "prayer", "baptism"].includes(tag))) {
    dueDate.setDate(dueDate.getDate() + 2);
    return dueDate;
  }

  dueDate.setDate(dueDate.getDate() + 5);
  return dueDate;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
