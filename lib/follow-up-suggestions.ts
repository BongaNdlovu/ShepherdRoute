import { followUpCategoryLabels, type FollowUpCategory } from "@/lib/constants";
import type { MinistrySuggestionCandidate } from "@/lib/data-ministry-teams";

export type FollowUpSuggestionInput = {
  contact: {
    full_name: string;
    status?: string | null;
    urgency?: string | null;
    recommended_assigned_role?: string | null;
    contact_interests?: Array<{ interest: string }>;
    events?: { name: string; event_type: string | null } | null;
    classification_payload?: Record<string, unknown> | null;
  };
  prayerRequests?: Array<{ request_text: string; visibility: string }>;
  formAnswers?: Array<{ question_name: string; question_label: string; answer_display: unknown }>;
  teams: MinistrySuggestionCandidate[];
};

export type FollowUpSuggestion = {
  category: FollowUpCategory | null;
  categoryLabel: string | null;
  team: { id: string; name: string } | null;
  person: { id: string; full_name: string; position_title: string | null } | null;
  suggested_action: string;
  reason: string;
};

function normalizeSearchText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").trim();
}

function gatherAllText(input: FollowUpSuggestionInput): string {
  const parts: string[] = [];

  if (input.contact.contact_interests) {
    for (const i of input.contact.contact_interests) {
      parts.push(i.interest);
    }
  }

  if (input.contact.events?.event_type) {
    parts.push(input.contact.events.event_type);
  }

  if (input.contact.events?.name) {
    parts.push(input.contact.events.name);
  }

  if (input.contact.classification_payload) {
    const payload = input.contact.classification_payload;
    if (typeof payload.recommended_assigned_role === "string") {
      parts.push(payload.recommended_assigned_role);
    }
    if (Array.isArray(payload.recommended_tags)) {
      for (const tag of payload.recommended_tags) {
        if (typeof tag === "string") parts.push(tag);
      }
    }
    if (typeof payload.summary === "string") {
      parts.push(payload.summary);
    }
  }

  if (input.contact.status) {
    parts.push(input.contact.status);
  }

  if (input.prayerRequests) {
    for (const p of input.prayerRequests) {
      parts.push(p.request_text);
      parts.push(p.visibility);
    }
  }

  if (input.formAnswers) {
    for (const a of input.formAnswers) {
      parts.push(a.question_name);
      parts.push(a.question_label);
      if (typeof a.answer_display === "string") {
        parts.push(a.answer_display);
      } else if (Array.isArray(a.answer_display)) {
        for (const v of a.answer_display) {
          if (typeof v === "string") parts.push(v);
        }
      } else if (a.answer_display !== null && a.answer_display !== undefined) {
        parts.push(String(a.answer_display));
      }
    }
  }

  return normalizeSearchText(parts.join(" "));
}

export function detectFollowUpCategory(input: FollowUpSuggestionInput): FollowUpCategory {
  const text = gatherAllText(input);
  const interests = new Set((input.contact.contact_interests ?? []).map((i) => i.interest));
  const eventType = input.contact.events?.event_type ?? "";

  // Prayer detection
  if (interests.has("prayer") || text.includes("prayer") || text.includes("pray")) {
    return "prayer";
  }

  // Bible study detection
  if (interests.has("bible_study") || text.includes("bible study") || text.includes("bible studies") || text.includes("studies")) {
    return "bible_study";
  }

  // Baptism detection
  if (interests.has("baptism") || text.includes("baptism") || text.includes("baptized") || text.includes("baptismal")) {
    return "baptism_interest";
  }

  // Depression and recovery
  if (text.includes("depression") || text.includes("recovery") || text.includes("depression recovery") || text.includes("mental health")) {
    return "depression_recovery";
  }

  // Health detection
  if (interests.has("health") || eventType.includes("health") || text.includes("health") || text.includes("seminar")) {
    return "health_interest";
  }

  // Youth detection
  if (interests.has("youth") || eventType.includes("youth") || text.includes("youth")) {
    return "youth_interest";
  }

  // Pastoral care / urgent
  if (text.includes("urgent") || text.includes("crisis") || text.includes("pastoral") || text.includes("counsel") || text.includes("visit")) {
    if (text.includes("family")) return "family_support";
    return "urgent_follow_up";
  }

  // Family support
  if (text.includes("family") || text.includes("marriage") || text.includes("parent")) {
    return "family_support";
  }

  // Visitation
  if (text.includes("visitation") || text.includes("visit")) {
    return "visitation";
  }

  // Event updates
  if (text.includes("event") || text.includes("update")) {
    return "event_updates";
  }

  return "general_visitor";
}

function selectTeamForCategory(
  category: FollowUpCategory,
  teams: MinistrySuggestionCandidate[]
): MinistrySuggestionCandidate | null {
  // 1. Team whose follow_up_categories contains the detected category
  for (const candidate of teams) {
    if (candidate.team.follow_up_categories.includes(category)) {
      return candidate;
    }
  }

  // 2. Team name keyword match
  const categoryLabel = followUpCategoryLabels[category]?.toLowerCase() ?? category;
  const keywords: Record<string, string[]> = {
    prayer: ["prayer", "pray"],
    bible_study: ["bible", "study"],
    baptism_interest: ["baptism", "baptized"],
    health_interest: ["health", "healing"],
    depression_recovery: ["depression", "recovery", "health"],
    youth_interest: ["youth", "young"],
    pastoral_care: ["pastoral", "pastor"],
    visitation: ["visit", "visitation"],
    general_visitor: ["visitor", "general", "follow up"],
    event_updates: ["event", "update"],
    family_support: ["family", "marriage"],
    urgent_follow_up: ["urgent", "crisis", "pastoral"]
  };

  const searchKeywords = keywords[category] ?? [categoryLabel];
  for (const candidate of teams) {
    const teamName = candidate.team.name.toLowerCase();
    for (const kw of searchKeywords) {
      if (teamName.includes(kw)) {
        return candidate;
      }
    }
  }

  // 3. Fallback: any active team
  return teams.length > 0 ? teams[0] : null;
}

function selectPersonFromTeam(
  candidate: MinistrySuggestionCandidate
): { id: string; full_name: string; position_title: string | null } | null {
  if (candidate.memberships.length === 0) return null;

  // Prefer leadership/coordinator roles
  const leadershipKeywords = ["leader", "coordinator", "pastor", "elder", "worker", "health", "prayer", "bible"];
  for (const m of candidate.memberships) {
    const title = (m.position_title ?? "").toLowerCase();
    for (const kw of leadershipKeywords) {
      if (title.includes(kw)) {
        return {
          id: m.person_id,
          full_name: m.person_full_name,
          position_title: m.position_title
        };
      }
    }
  }

  // Otherwise return first member
  const first = candidate.memberships[0];
  return {
    id: first.person_id,
    full_name: first.person_full_name,
    position_title: first.position_title
  };
}

function getSuggestedAction(category: FollowUpCategory): string {
  const actions: Record<FollowUpCategory, string> = {
    prayer: "Send a caring message and pray with the person.",
    bible_study: "Follow up within 24-48 hours to offer Bible studies.",
    baptism_interest: "Discuss baptism preparation and next steps with the person.",
    health_interest: "Share health ministry resources and upcoming seminars.",
    depression_recovery: "Provide caring support and information about the Depression Recovery Seminar.",
    youth_interest: "Connect with the youth leader to arrange engagement.",
    pastoral_care: "Pastor or elder should reach out personally.",
    visitation: "Schedule a visit to connect with the person.",
    general_visitor: "Make a friendly follow-up call or visit.",
    event_updates: "Share upcoming event details and invite them.",
    family_support: "Offer family ministry resources and support.",
    urgent_follow_up: "Reach out urgently within a few hours."
  };
  return actions[category] ?? "Make a follow-up connection.";
}

function getReason(category: FollowUpCategory, teamName: string | null): string {
  const reasons: Record<FollowUpCategory, string> = {
    prayer: "The visitor submitted a prayer-related request.",
    bible_study: "The visitor expressed direct Bible study interest.",
    baptism_interest: "The visitor showed interest in baptism.",
    health_interest: "The visitor showed health-related interest.",
    depression_recovery: "The visitor indicated interest in depression and recovery support.",
    youth_interest: "The visitor has youth-related interest.",
    pastoral_care: "The request indicates a need for pastoral care.",
    visitation: "A visit was requested or is appropriate for this contact.",
    general_visitor: "No specific ministry match was found; general follow-up is recommended.",
    event_updates: "The visitor may benefit from ongoing event updates.",
    family_support: "The visitor indicated family-related support needs.",
    urgent_follow_up: "The request contains urgent or crisis language and needs immediate attention."
  };

  const baseReason = reasons[category] ?? "Based on the visitor's interests and responses.";
  if (teamName) {
    return `${baseReason} Suggested team: ${teamName}.`;
  }
  return baseReason;
}

export function generateFollowUpSuggestion(input: FollowUpSuggestionInput): FollowUpSuggestion {
  const category = detectFollowUpCategory(input);
  const categoryLabel = followUpCategoryLabels[category] ?? category;

  const activeCandidates = input.teams.filter((t) => t.team.is_active);
  const teamCandidate = selectTeamForCategory(category, activeCandidates);

  if (!teamCandidate) {
    return {
      category,
      categoryLabel,
      team: null,
      person: null,
      suggested_action: getSuggestedAction(category),
      reason: getReason(category, null)
    };
  }

  const person = selectPersonFromTeam(teamCandidate);

  return {
    category,
    categoryLabel,
    team: { id: teamCandidate.team.id, name: teamCandidate.team.name },
    person: person ? { id: person.id, full_name: person.full_name, position_title: person.position_title } : null,
    suggested_action: getSuggestedAction(category),
    reason: getReason(category, teamCandidate.team.name)
  };
}
