import type { FollowUpCategory, Interest } from "@/lib/constants";

export type IntakeQuestionType = "single_choice" | "multi_choice" | "text";

export type IntakeQuestionOption = {
  value: string;
  label: string;
  enabled?: boolean;
};

export type IntakeQuestion = {
  id: string;
  label: string;
  description?: string;
  type: IntakeQuestionType;
  required?: boolean;
  options?: IntakeQuestionOption[];
  enabled?: boolean;
};

export type IntakeCategory = {
  id: FollowUpCategory;
  label: string;
  description: string;
  interest?: Interest;
  defaultUrgency: "low" | "medium" | "high";
  preferredContactMethod: "whatsapp" | "phone" | "email";
  recommendedAssignedRole?: string;
  questions: IntakeQuestion[];
  enabled?: boolean;
};

export const intakeCategories: IntakeCategory[] = [
  {
    id: "prayer",
    label: "Prayer Request",
    description: "Share a prayer request with the team.",
    interest: "prayer",
    defaultUrgency: "medium",
    preferredContactMethod: "whatsapp",
    recommendedAssignedRole: "prayer_team",
    questions: [
      {
        id: "contact_permission",
        label: "Would you like someone to contact you?",
        type: "single_choice",
        required: true,
        options: [
          { value: "yes", label: "Yes, please contact me" },
          { value: "prayer_only", label: "No, prayer only" }
        ]
      },
      {
        id: "urgency",
        label: "Is this urgent?",
        type: "single_choice",
        required: true,
        options: [
          { value: "urgent", label: "Yes, it is urgent" },
          { value: "normal", label: "No, not urgent" }
        ]
      },
      {
        id: "prayer_request",
        label: "What would you like us to pray for?",
        type: "text",
        required: false
      }
    ]
  },
  {
    id: "bible_study",
    label: "Bible Studies",
    description: "I would like Bible study options.",
    interest: "bible_study",
    defaultUrgency: "medium",
    preferredContactMethod: "whatsapp",
    recommendedAssignedRole: "bible_worker",
    questions: [
      {
        id: "study_interest",
        label: "What are you interested in?",
        type: "single_choice",
        required: true,
        options: [
          { value: "beginner", label: "Beginner Bible studies" },
          { value: "prophecy", label: "Prophecy" },
          { value: "family", label: "Family" },
          { value: "general", label: "General" }
        ]
      },
      {
        id: "best_time",
        label: "Best time to contact you?",
        type: "single_choice",
        required: false,
        options: [
          { value: "morning", label: "Morning" },
          { value: "afternoon", label: "Afternoon" },
          { value: "evening", label: "Evening" }
        ]
      }
    ]
  },
  {
    id: "baptism_interest",
    label: "Baptism Interest",
    description: "I would like to learn about baptism.",
    interest: "baptism",
    defaultUrgency: "high",
    preferredContactMethod: "whatsapp",
    recommendedAssignedRole: "pastor",
    questions: [
      {
        id: "baptism_stage",
        label: "Where are you in this decision?",
        type: "single_choice",
        required: true,
        options: [
          { value: "thinking", label: "I am thinking about it" },
          { value: "ready", label: "I feel ready" },
          { value: "questions", label: "I have questions first" }
        ]
      }
    ]
  },
  {
    id: "health_interest",
    label: "Health Support",
    description: "I would like health resources or support.",
    interest: "health",
    defaultUrgency: "medium",
    preferredContactMethod: "whatsapp",
    recommendedAssignedRole: "health_leader",
    questions: [
      {
        id: "health_need",
        label: "What kind of support would help you?",
        type: "single_choice",
        required: true,
        options: [
          { value: "resources", label: "Health resources" },
          { value: "program_updates", label: "Future program updates" },
          { value: "personal_support", label: "Someone to contact me" }
        ]
      }
    ]
  },
  {
    id: "pastoral_care",
    label: "Pastoral Care",
    description: "I would like a pastor or elder to contact me.",
    defaultUrgency: "high",
    preferredContactMethod: "phone",
    recommendedAssignedRole: "pastor",
    questions: [
      {
        id: "care_urgency",
        label: "How soon would you like someone to contact you?",
        type: "single_choice",
        required: true,
        options: [
          { value: "today", label: "Today" },
          { value: "this_week", label: "This week" },
          { value: "no_rush", label: "No rush" }
        ]
      }
    ]
  },
  {
    id: "event_updates",
    label: "Event Updates",
    description: "Send me updates about future events.",
    defaultUrgency: "low",
    preferredContactMethod: "whatsapp",
    questions: [
      {
        id: "updates_type",
        label: "What updates would you like?",
        type: "multi_choice",
        required: false,
        options: [
          { value: "church_events", label: "Church events" },
          { value: "health_events", label: "Health events" },
          { value: "youth_events", label: "Youth events" },
          { value: "bible_events", label: "Bible study events" }
        ]
      }
    ]
  }
];

export function getDefaultIntakeCategories() {
  return intakeCategories.map((category) => ({
    ...category,
    enabled: category.enabled !== false,
    questions: category.questions.map((question) => ({
      ...question,
      enabled: question.enabled !== false,
      options: question.options?.map((option) => ({ ...option, enabled: option.enabled !== false }))
    }))
  }));
}
