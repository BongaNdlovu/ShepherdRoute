export const interestOptions = [
  "prayer",
  "bible_study",
  "health",
  "baptism",
  "pastoral_visit",
  "youth",
  "cooking_class"
] as const;

export const interestLabels: Record<Interest, string> = {
  prayer: "Prayer",
  bible_study: "Bible Study",
  health: "Health",
  baptism: "Baptismal Request",
  pastoral_visit: "Pastoral Visit",
  youth: "Youth",
  cooking_class: "Cooking Class"
};

export const statusOptions = [
  "new",
  "assigned",
  "contacted",
  "waiting",
  "interested",
  "bible_study_started",
  "attended_church",
  "baptism_interest",
  "closed"
] as const;

export const eventTypeOptions = [
  "sabbath_visitor",
  "health_expo",
  "evangelistic_campaign",
  "prophecy_seminar",
  "cooking_class",
  "youth_event",
  "prayer_campaign",
  "regular_member",
  "baptized_member",
  "health_seminar",
  "custom"
] as const;

export const eventTypeLabels: Record<string, string> = {
  sabbath_visitor: "Sabbath Visitor",
  evangelistic_campaign: "Evangelistic Campaign",
  prayer_campaign: "Prayer Campaign",
  regular_member: "Regular Member",
  baptized_member: "Baptized Member",
  health_seminar: "Health Seminar",
  custom: "Custom",
  visitor_sabbath: "Visitor Sabbath",
  church_service: "Church Service",
  health_expo: "Health Expo",
  prophecy_seminar: "Prophecy Seminar",
  bible_study: "Bible Study",
  youth_event: "Youth Event",
  cooking_class: "Cooking Class",
  community_outreach: "Community Outreach",
  other: "Other"
};

export const statusLabels: Record<FollowUpStatus, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  waiting: "Waiting",
  interested: "Interested",
  bible_study_started: "Bible Study Started",
  attended_church: "Attended Church",
  baptism_interest: "Baptismal Interest",
  closed: "Closed"
};

export const roleLabels = {
  admin: "Admin",
  pastor: "Pastor",
  elder: "Elder",
  bible_worker: "Bible Worker",
  health_leader: "Health Leader",
  prayer_team: "Prayer Team",
  youth_leader: "Youth Leader",
  viewer: "Viewer"
} as const;

export const roleOptions = Object.keys(roleLabels) as [keyof typeof roleLabels, ...(keyof typeof roleLabels)[]];

export const followUpChannelOptions = ["call", "whatsapp", "sms", "email", "visit", "note"] as const;

export const followUpChannelLabels: Record<FollowUpChannel, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  visit: "Visit",
  note: "Note"
};

export type Interest = (typeof interestOptions)[number];
export type FollowUpStatus = (typeof statusOptions)[number];
export type EventType = (typeof eventTypeOptions)[number];
export type TeamRole = keyof typeof roleLabels;
export type FollowUpChannel = (typeof followUpChannelOptions)[number];
