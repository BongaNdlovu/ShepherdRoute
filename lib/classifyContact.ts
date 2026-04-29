import type { EventTemplateType } from "@/lib/eventTemplates";

export type ContactTag =
  | "prayer"
  | "bible_study"
  | "health"
  | "pastoral_care"
  | "baptism"
  | "youth"
  | "family_support"
  | "urgent_follow_up"
  | "general_visit";

export type Urgency = "low" | "medium" | "high";

export type AssignedRole = "pastor" | "elder" | "bible_worker" | "health_leader" | "prayer_team";

export type VisitorType =
  | EventTemplateType
  | "bible_study"
  | "church_service"
  | "visitor_sabbath"
  | "community_outreach"
  | "other"
  | "general";

export type ClassificationResult = {
  summary: string;
  recommended_tags: ContactTag[];
  urgency: Urgency;
  recommended_next_action: string;
  recommended_assigned_role: AssignedRole;
};

export type ClassifyInput = {
  selectedInterests?: string[];
  message?: string;
  visitorType?: VisitorType;
  eventType?: VisitorType;
  templateType?: VisitorType;
};

const allTags: ContactTag[] = [
  "prayer",
  "bible_study",
  "health",
  "pastoral_care",
  "baptism",
  "youth",
  "family_support",
  "urgent_follow_up",
  "general_visit"
];

const keywordMap: Record<Exclude<ContactTag, "general_visit">, string[]> = {
  prayer: [
    "pray",
    "prayer",
    "praying",
    "encouragement",
    "burden",
    "spiritual support",
    "please remember me",
    "intercession",
    "thandaza",
    "umthandazo",
    "bid",
    "gebed"
  ],
  bible_study: [
    "bible",
    "study",
    "lesson",
    "scripture",
    "truth",
    "prophecy",
    "revelation",
    "daniel",
    "sabbath",
    "learn more",
    "bible study",
    "isifundo",
    "ibhayibheli",
    "bybel",
    "profesie"
  ],
  health: [
    "health",
    "expo",
    "water",
    "diet",
    "exercise",
    "sleep",
    "stress",
    "cooking",
    "nutrition",
    "newstart",
    "lifestyle",
    "plant based",
    "plant-based",
    "wellness",
    "healthy cooking",
    "impilo",
    "gesondheid",
    "voeding"
  ],
  pastoral_care: [
    "pastor",
    "pastoral",
    "visit",
    "counselling",
    "counsel",
    "guidance",
    "struggling",
    "talk to someone",
    "home visit",
    "elder visit",
    "umfundisi",
    "predikant"
  ],
  baptism: [
    "baptism",
    "baptise",
    "baptize",
    "join the church",
    "membership",
    "decision",
    "give my life",
    "accept jesus",
    "be baptised",
    "ubhaphathizo",
    "doop"
  ],
  youth: [
    "youth",
    "young people",
    "teen",
    "teenager",
    "child",
    "children",
    "daughter",
    "son",
    "pathfinders",
    "adventurers",
    "young adult",
    "ingane",
    "abantwana",
    "jeug"
  ],
  family_support: [
    "family",
    "marriage",
    "home",
    "parent",
    "children",
    "relationship",
    "spouse",
    "husband",
    "wife",
    "divorce",
    "umndeni",
    "gesin",
    "huwelik"
  ],
  urgent_follow_up: [
    "urgent",
    "emergency",
    "immediately",
    "today",
    "danger",
    "unsafe",
    "same day",
    "as soon as possible",
    "tonight",
    "crisis",
    "ngokuphuthuma",
    "dringend",
    "noodgeval"
  ]
};

const selectedInterestMap: Record<string, ContactTag[]> = {
  prayer: ["prayer"],
  bible_study: ["bible_study"],
  health: ["health"],
  baptism: ["baptism"],
  pastoral_visit: ["pastoral_care"],
  youth: ["youth"],
  cooking_class: ["health"]
};

const visitorTypeTags: Record<VisitorType, ContactTag[]> = {
  sabbath_visitor: ["general_visit"],
  health_expo: ["health"],
  evangelistic_campaign: ["bible_study"],
  prophecy_seminar: ["bible_study"],
  cooking_class: ["health"],
  youth_event: ["youth"],
  prayer_campaign: ["prayer"],
  regular_member: ["general_visit"],
  baptized_member: ["general_visit"],
  health_seminar: ["health"],
  custom: ["general_visit"],
  bible_study: ["bible_study"],
  church_service: ["general_visit"],
  visitor_sabbath: ["general_visit"],
  community_outreach: ["general_visit"],
  other: ["general_visit"],
  general: ["general_visit"]
};

const tagLabels: Record<ContactTag, string> = {
  prayer: "prayer",
  bible_study: "Bible study",
  health: "health",
  pastoral_care: "pastoral care",
  baptism: "baptism",
  youth: "youth support",
  family_support: "family support",
  urgent_follow_up: "urgent follow-up",
  general_visit: "general visit"
};

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreKeywords(text: string): Record<ContactTag, number> {
  const normalized = normalizeText(text);
  const scores = Object.fromEntries(allTags.map((tag) => [tag, 0])) as Record<ContactTag, number>;

  if (!normalized) {
    return scores;
  }

  for (const [tag, keywords] of Object.entries(keywordMap) as Array<[Exclude<ContactTag, "general_visit">, string[]]>) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (normalized.includes(normalizedKeyword)) {
        scores[tag] += normalizedKeyword.includes(" ") ? 2 : 1;
      }
    }
  }

  return scores;
}

export function tagsFromSelectedInterests(selectedInterests: string[]): ContactTag[] {
  return uniqueTags(selectedInterests.flatMap((interest) => selectedInterestMap[interest] ?? []));
}

export function chooseUrgency(tags: ContactTag[]): Urgency {
  if (tags.includes("urgent_follow_up")) return "high";
  if (tags.includes("pastoral_care") || tags.includes("baptism")) return "medium";
  if (tags.includes("prayer") && tags.includes("family_support")) return "medium";
  if (tags.length === 1 && (tags[0] === "health" || tags[0] === "general_visit")) return "low";
  return tags.length > 1 ? "medium" : "low";
}

export function chooseAssignedRole(tags: ContactTag[], urgency: Urgency): AssignedRole {
  if (urgency === "high" || tags.includes("urgent_follow_up") || tags.includes("pastoral_care") || tags.includes("baptism")) {
    return "pastor";
  }
  if (tags.includes("bible_study")) return "bible_worker";
  if (tags.includes("health")) return "health_leader";
  if (tags.includes("prayer")) return "prayer_team";
  return "elder";
}

export function chooseNextAction(tags: ContactTag[], role: AssignedRole, urgency: Urgency): string {
  if (urgency === "high") {
    return "Ask a trusted pastor to make same-day human follow-up, check in directly, and arrange support from the appropriate leader.";
  }
  if (role === "pastor") {
    return "Assign to the pastor for a warm personal follow-up and appropriate next conversation.";
  }
  if (role === "bible_worker") {
    return "Assign to a Bible worker and send a warm WhatsApp follow-up with Bible study options.";
  }
  if (role === "health_leader") {
    return "Assign to a health leader and share details for the next health or lifestyle program.";
  }
  if (role === "prayer_team") {
    return "Assign to the prayer team for prayerful human follow-up and encouragement.";
  }
  if (tags.includes("youth")) {
    return "Assign to an elder to connect the visitor with youth or family ministry support.";
  }
  return "Assign to an elder for a friendly welcome and first follow-up message.";
}

export function makeSummary(tags: ContactTag[], message: string): string {
  const meaningfulTags = tags.filter((tag) => tag !== "general_visit");
  if (!meaningfulTags.length) {
    return "Visitor needs a friendly first follow-up and general welcome.";
  }

  const labelList = meaningfulTags.map((tag) => tagLabels[tag]);
  const request = labelList.length === 1
    ? labelList[0]
    : `${labelList.slice(0, -1).join(", ")} and ${labelList[labelList.length - 1]}`;
  const messageContext = normalizeText(message) ? " based on their selected interests and message" : " based on their selected interests";

  return `Visitor is requesting ${request} support${messageContext}.`;
}

export function classifyContact(input: ClassifyInput): ClassificationResult {
  // Rule-based routing only. This is not a counselling, medical, diagnostic, or spiritual assessment system.
  const selectedTags = tagsFromSelectedInterests(input.selectedInterests ?? []);
  const keywordScores = scoreKeywords(input.message ?? "");
  const scoredTags = allTags.filter((tag) => keywordScores[tag] > 0);
  const classifierContext = input.templateType ?? input.eventType ?? input.visitorType ?? "general";
  const visitorTags = visitorTypeTags[classifierContext] ?? [];
  const recommendedTags = uniqueTags([...selectedTags, ...scoredTags, ...visitorTags]).filter((tag) => {
    if (tag !== "general_visit") return true;
    return selectedTags.length === 0 && scoredTags.length === 0;
  });
  const finalTags: ContactTag[] = recommendedTags.length ? recommendedTags : ["general_visit"];
  const urgency = chooseUrgency(finalTags);
  const recommendedAssignedRole = chooseAssignedRole(finalTags, urgency);

  return {
    summary: makeSummary(finalTags, input.message ?? ""),
    recommended_tags: finalTags,
    urgency,
    recommended_next_action: chooseNextAction(finalTags, recommendedAssignedRole, urgency),
    recommended_assigned_role: recommendedAssignedRole
  };
}

function uniqueTags(tags: ContactTag[]): ContactTag[] {
  return allTags.filter((tag) => tags.includes(tag));
}
