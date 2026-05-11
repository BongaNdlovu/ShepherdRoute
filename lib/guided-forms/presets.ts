import type { ContactMethod, Interest } from "@/lib/constants";
import type { TemplateQuestionField } from "@/lib/eventTemplates";

export type GuidedPresetKey =
  | "none"
  | "health_expo"
  | "evangelistic_meeting"
  | "bible_study_interest"
  | "prayer_request"
  | "visitor_follow_up"
  | "youth_event"
  | "community_outreach"
  | "medical_clinic"
  | "family_life_program";

export type GuidedPreset = {
  key: GuidedPresetKey;
  label: string;
  description: string;
  interestOptions?: Array<{ value: Interest; label: string; description?: string }>;
  questions?: TemplateQuestionField[];
  preferredContactMethods?: ContactMethod[];
  messagePlaceholder?: string;
};

export const guidedFormPresets: Record<Exclude<GuidedPresetKey, "none">, GuidedPreset> = {
  health_expo: {
    key: "health_expo",
    label: "Health Expo",
    description: "Health support, prayer, family support, and follow-up offers.",
    interestOptions: [
      { value: "health", label: "Health Support" },
      { value: "prayer", label: "Prayer" },
      { value: "pastoral_visit", label: "Family Support" },
      { value: "bible_study", label: "Bible Health Principles" },
      { value: "cooking_class", label: "Event Updates" }
    ],
    questions: [
      {
        name: "health_area_interest",
        label: "What health area interests you most?",
        type: "select",
        required: false,
        options: [
          { value: "stress_depression", label: "Stress & Depression" },
          { value: "nutrition", label: "Nutrition" },
          { value: "exercise", label: "Exercise" },
          { value: "lifestyle_disease", label: "Lifestyle Disease" },
          { value: "natural_remedies", label: "Natural Remedies" },
          { value: "general_health", label: "General Health" }
        ]
      },
      {
        name: "depression_recovery_interest",
        label: "Would you like details about the Depression and Recovery program?",
        type: "radio",
        required: false,
        options: [
          { value: "yes", label: "Yes, please" },
          { value: "maybe", label: "Maybe later" },
          { value: "no", label: "No, thank you" }
        ]
      }
    ]
  },
  evangelistic_meeting: {
    key: "evangelistic_meeting",
    label: "Evangelistic Meeting",
    description: "Bible study, baptism, prayer, and future meeting follow-up.",
    interestOptions: [
      { value: "bible_study", label: "Bible Studies" },
      { value: "baptism", label: "Baptism" },
      { value: "prayer", label: "Prayer" },
      { value: "pastoral_visit", label: "Event Updates" },
      { value: "pastoral_visit", label: "Pastoral Visit" }
    ]
  },
  bible_study_interest: {
    key: "bible_study_interest",
    label: "Bible Study Interest",
    description: "Focused Bible study request flow.",
    interestOptions: [{ value: "bible_study", label: "Bible Study" }]
  },
  prayer_request: {
    key: "prayer_request",
    label: "Prayer Request",
    description: "Prayer and care follow-up.",
    interestOptions: [{ value: "prayer", label: "Prayer" }]
  },
  visitor_follow_up: {
    key: "visitor_follow_up",
    label: "Visitor Follow-Up",
    description: "General visitor follow-up flow.",
    interestOptions: [
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "pastoral_visit", label: "Church Updates / Visit" },
      { value: "baptism", label: "Baptism" }
    ]
  },
  youth_event: {
    key: "youth_event",
    label: "Youth Event",
    description: "Youth ministry updates and care.",
    interestOptions: [
      { value: "youth", label: "Youth Updates" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" }
    ]
  },
  community_outreach: {
    key: "community_outreach",
    label: "Community Outreach",
    description: "Community support and next-step follow-up.",
    interestOptions: [
      { value: "prayer", label: "Prayer" },
      { value: "health", label: "Health Support" },
      { value: "pastoral_visit", label: "Family Support" },
      { value: "pastoral_visit", label: "Event Updates" }
    ]
  },
  medical_clinic: {
    key: "medical_clinic",
    label: "Medical Clinic",
    description: "Clinic support, health resources, and care follow-up.",
    interestOptions: [
      { value: "health", label: "Health Support" },
      { value: "prayer", label: "Prayer" },
      { value: "pastoral_visit", label: "Future Clinic Updates" }
    ]
  },
  family_life_program: {
    key: "family_life_program",
    label: "Family Life Program",
    description: "Family support, prayer, and event follow-up.",
    interestOptions: [
      { value: "pastoral_visit", label: "Family Support" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "pastoral_visit", label: "Event Updates" }
    ]
  }
};

export function getGuidedPreset(key?: string | null): GuidedPreset | null {
  if (!key || key === "none") return null;
  return guidedFormPresets[key as Exclude<GuidedPresetKey, "none">] ?? null;
}
