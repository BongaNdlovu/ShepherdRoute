import type { Interest, TeamRole } from "@/lib/constants";
import { eventTypeOptions } from "@/lib/constants";

export type EventTemplateType = (typeof eventTypeOptions)[number];

export type TemplateInterestOption = {
  value: Interest;
  label: string;
  description?: string;
};

export type TemplateReportSection = {
  key: string;
  label: string;
  description: string;
  interest?: Interest;
  metric?: "total_contacts" | "followed_up_count" | "high_priority_count";
};

export type TemplateMessageKey = "default" | Interest;

export type EventTemplateConfig = {
  type: EventTemplateType;
  name: string;
  description: string;
  formHeading: string;
  formDescription: string;
  interestOptions: TemplateInterestOption[];
  topicOptions?: string[];
  defaultStatuses: string[];
  defaultRoles: TeamRole[];
  messageTemplates: Partial<Record<TemplateMessageKey, string>>;
  reportSections: TemplateReportSection[];
};

const commonPrayerBibleHealth: TemplateInterestOption[] = [
  { value: "prayer", label: "Prayer", description: "A prayer team follow-up." },
  { value: "bible_study", label: "Bible Study", description: "Bible study options or resources." },
  { value: "health", label: "Health Resources", description: "Lifestyle and wellness resources." }
];

const friendlyMessageTemplates = {
  sabbathDefault:
    "Good day {firstName}, thank you for worshipping with {churchName}{eventLine}. We are grateful you joined us. Would it be okay if one of our team members checks in with you this week?",
  sabbathPrayer:
    "Good day {firstName}, thank you for worshipping with {churchName}{eventLine}. Thank you for trusting us with your prayer request. Would it be okay if our prayer team prays for you and checks in gently?",
  sabbathBibleStudy:
    "Good day {firstName}, thank you for worshipping with {churchName}{eventLine}. We are glad you are interested in Bible study. Would it be okay if one of our Bible workers shares the available study options with you?",
  sabbathBaptism:
    "Good day {firstName}, thank you for worshipping with {churchName}{eventLine}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker who can walk with you through preparation.",

  healthExpoDefault:
    "Good day {firstName}, thank you for attending {eventName} with {churchName}. We hope the day was helpful. Would you like us to send health resources and future wellness program updates?",
  healthResources:
    "Good day {firstName}, thank you for attending {eventName}. We would be happy to send the 7-day health challenge and simple lifestyle resources from {churchName}.",
  cookingClass:
    "Good day {firstName}, thank you for attending {eventName}. We would be glad to send the recipes and let you know when the next healthy cooking class is planned.",
  healthBibleStudy:
    "Good day {firstName}, thank you for attending {eventName}. We also noticed your interest in Bible study. Would it be okay if one of our Bible workers shares the available options with you?",
  healthBaptism:
    "Good day {firstName}, thank you for attending {eventName}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker who can walk with you through preparation.",

  campaignDefault:
    "Good day {firstName}, thank you for attending {eventName}. We are grateful you came. Would you like us to send study notes and updates for the next meeting from {churchName}?",
  campaignBibleStudy:
    "Good day {firstName}, thank you for attending {eventName}. Would it be okay if one of our Bible workers sends the study notes and shares Bible study options with you?",
  campaignBaptism:
    "Good day {firstName}, thank you for attending {eventName}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker for preparation, with pastoral support when the time is right.",

  prophecyDefault:
    "Good day {firstName}, thank you for attending {eventName}. We are glad you joined the seminar. Would you like us to send the notes and reminders for the next session?",
  prophecyBibleStudy:
    "Good day {firstName}, thank you for attending {eventName}. Would it be okay if one of our Bible workers sends the study notes and shares Bible study options with you?",
  prophecyBaptism:
    "Good day {firstName}, thank you for attending {eventName}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker for preparation, with pastoral support when the time is right.",

  youthDefault:
    "Good day {firstName}, thank you for joining {eventName}. We are glad you connected with us. Would you like the youth ministry team to share future updates with you?",
  youth:
    "Good day {firstName}, thank you for joining {eventName}. We would be happy to share youth ministry updates and details for the next program.",
  youthBaptism:
    "Good day {firstName}, thank you for joining {eventName}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker who can walk with you through preparation.",

  prayerDefault:
    "Good day {firstName}, thank you for trusting {churchName}{eventLine}. We have your prayer request, and we will handle it with care. Would it be okay if a trusted prayer leader checks in with you?",
  prayer:
    "Good day {firstName}, thank you for sharing your prayer request with {churchName}. Our prayer team would be honoured to pray for you and check in with care and respect.",
  prayerBaptism:
    "Good day {firstName}, thank you for sharing your baptismal request with {churchName}. We would be honoured to connect you with a Bible worker who can walk with you through preparation.",

  memberDefault:
    "Good day {firstName}, thank you for reaching out to {churchName}. We are grateful you trusted us with this request. One of the right ministry leaders will follow up with care.",
  memberBaptism:
    "Good day {firstName}, thank you for contacting {churchName}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker who can walk with you through preparation.",

  baptizedMemberDefault:
    "Good day {firstName}, thank you for connecting with {churchName}. We are glad to walk with you in this next step of church life. We can connect you with the right leader for support.",
  baptizedMemberBibleStudy:
    "Good day {firstName}, thank you for connecting with {churchName}. Would it be okay if one of our Bible workers shares discipleship study options with you?",
  baptizedMemberBaptism:
    "Good day {firstName}, thank you for connecting with {churchName}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker who can walk with you through preparation.",

  healthSeminarDefault:
    "Good day {firstName}, thank you for attending {eventName}. We hope the seminar was helpful. Would you like us to send notes and future health program updates from {churchName}?",
  healthSeminarHealth:
    "Good day {firstName}, thank you for attending {eventName}. We would be happy to send lifestyle resources and details for the next health program.",
  healthSeminarBaptism:
    "Good day {firstName}, thank you for attending {eventName}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker who can walk with you through preparation.",

  customDefault:
    "Good day {firstName}, thank you for connecting with {churchName}{eventLine}. We are glad you reached out. Would it be okay if one of our team members follows up with you this week?",
  customBaptism:
    "Good day {firstName}, thank you for connecting with {churchName}{eventLine}. Thank you for sharing your baptismal request. We would be honoured to connect you with a Bible worker who can walk with you through preparation."
};

export const eventTemplates: Record<EventTemplateType, EventTemplateConfig> = {
  sabbath_visitor: {
    type: "sabbath_visitor",
    name: "Sabbath Visitor",
    description: "First-time or returning visitors who worshipped with the church.",
    formHeading: "We are grateful you worshipped with us today",
    formDescription: "Share how the team can stay in touch after your Sabbath visit.",
    interestOptions: [
      { value: "prayer", label: "Prayer" },
      { value: "pastoral_visit", label: "Church Updates" },
      { value: "bible_study", label: "Bible Study" },
      { value: "youth", label: "Youth Info" },
      { value: "pastoral_visit", label: "Pastoral Visit" },
      { value: "baptism", label: "Baptismal Request" }
    ],
    defaultStatuses: ["first_time_visitor", "thank_you_sent", "invited_again", "prayer_requested", "bible_study_requested", "attended_again", "connected", "closed"],
    defaultRoles: ["elder", "pastor", "prayer_team", "bible_worker"],
    messageTemplates: {
      default: friendlyMessageTemplates.sabbathDefault,
      prayer: friendlyMessageTemplates.sabbathPrayer,
      bible_study: friendlyMessageTemplates.sabbathBibleStudy,
      baptism: friendlyMessageTemplates.sabbathBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "First-time visitors", description: "Total visitor registrations.", metric: "total_contacts" },
      { key: "prayer_requests", label: "Prayer requests", description: "Visitors asking for prayer.", interest: "prayer" },
      { key: "bible_study_requests", label: "Bible study requests", description: "Visitors interested in Bible study.", interest: "bible_study" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Visitors requesting baptism preparation.", interest: "baptism" },
      { key: "invited_again", label: "Invited again", description: "Track visitors ready for another invitation." },
      { key: "attended_again", label: "Attended again", description: "Track repeat attendance when logged." }
    ]
  },
  health_expo: {
    type: "health_expo",
    name: "Health Expo",
    description: "Community health screening or wellness expo contacts.",
    formHeading: "Thank you for attending our health expo",
    formDescription: "Choose the follow-up you would like from the health and ministry team.",
    interestOptions: [
      { value: "health", label: "Health Tips" },
      { value: "health", label: "7-Day Health Challenge" },
      { value: "cooking_class", label: "Cooking Class" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "baptism", label: "Baptismal Request" },
      { value: "pastoral_visit", label: "Church Visit" }
    ],
    defaultStatuses: ["new", "health_resources_sent", "invited_to_cooking_class", "prayer_follow_up", "bible_study_requested", "contacted", "closed"],
    defaultRoles: ["health_leader", "prayer_team", "bible_worker", "pastor"],
    messageTemplates: {
      default: friendlyMessageTemplates.healthExpoDefault,
      health: friendlyMessageTemplates.healthResources,
      cooking_class: friendlyMessageTemplates.cookingClass,
      prayer: friendlyMessageTemplates.prayer,
      bible_study: friendlyMessageTemplates.healthBibleStudy,
      baptism: friendlyMessageTemplates.healthBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total contacts", description: "All health expo registrations.", metric: "total_contacts" },
      { key: "health_interests", label: "Health interests", description: "Contacts asking for health resources.", interest: "health" },
      { key: "cooking_class_interests", label: "Cooking class interests", description: "Contacts interested in cooking class follow-up.", interest: "cooking_class" },
      { key: "prayer_requests", label: "Prayer requests", description: "Contacts asking for prayer.", interest: "prayer" },
      { key: "bible_study_interests", label: "Bible study interests", description: "Contacts interested in Bible study.", interest: "bible_study" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" },
      { key: "follow_up_completed", label: "Follow-up completed", description: "Contacts moved beyond the new status.", metric: "followed_up_count" }
    ]
  },
  evangelistic_campaign: {
    type: "evangelistic_campaign",
    name: "Evangelistic Campaign",
    description: "Evening Bible presentations, campaigns, and decision follow-up.",
    formHeading: "Thank you for attending tonight's Bible presentation",
    formDescription: "Select the follow-up that would be most helpful after tonight's meeting.",
    interestOptions: [
      { value: "bible_study", label: "Study Notes" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "pastoral_visit", label: "Pastoral Visit" },
      { value: "baptism", label: "Baptism Preparation" },
      { value: "bible_study", label: "Next Meeting Updates" }
    ],
    defaultStatuses: ["new_attendee", "notes_sent", "invited_next_meeting", "bible_study_requested", "pastoral_visit_needed", "baptism_interest", "decision_follow_up", "closed"],
    defaultRoles: ["pastor", "elder", "bible_worker", "prayer_team"],
    messageTemplates: {
      default: friendlyMessageTemplates.campaignDefault,
      prayer: friendlyMessageTemplates.prayer,
      bible_study: friendlyMessageTemplates.campaignBibleStudy,
      baptism: friendlyMessageTemplates.campaignBaptism
    },
    reportSections: [
      { key: "total_attendees", label: "Total attendees", description: "All captured attendees.", metric: "total_contacts" },
      { key: "returning_attendees", label: "Returning attendees", description: "Track returning attendees when status updates are logged." },
      { key: "study_note_requests", label: "Study note requests", description: "Contacts requesting notes.", interest: "bible_study" },
      { key: "bible_study_requests", label: "Bible study requests", description: "Contacts requesting Bible study.", interest: "bible_study" },
      { key: "baptism_interests", label: "Baptismal requests", description: "Contacts asking about baptism.", interest: "baptism" },
      { key: "pastoral_visits", label: "Pastoral visit requests", description: "Contacts asking for a pastoral visit.", interest: "pastoral_visit" }
    ]
  },
  prophecy_seminar: {
    type: "prophecy_seminar",
    name: "Prophecy Seminar",
    description: "Daniel and Revelation seminar follow-up.",
    formHeading: "Thank you for attending the prophecy seminar",
    formDescription: "Choose your topic and the follow-up you would like from the seminar team.",
    topicOptions: ["Daniel 2", "Daniel 7", "Revelation 13", "Revelation 14", "Sabbath", "Second Coming", "State of the Dead", "Three Angels' Messages"],
    interestOptions: [
      { value: "bible_study", label: "Study Notes" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "pastoral_visit", label: "Ask a Question" },
      { value: "baptism", label: "Baptism Preparation" },
      { value: "bible_study", label: "Next Seminar Reminder" }
    ],
    defaultStatuses: ["new_attendee", "notes_sent", "question_received", "bible_study_requested", "baptism_interest", "invited_next_session", "closed"],
    defaultRoles: ["bible_worker", "pastor", "elder", "prayer_team"],
    messageTemplates: {
      default: friendlyMessageTemplates.prophecyDefault,
      prayer: friendlyMessageTemplates.prayer,
      bible_study: friendlyMessageTemplates.prophecyBibleStudy,
      baptism: friendlyMessageTemplates.prophecyBaptism
    },
    reportSections: [
      { key: "total_attendees", label: "Total attendees", description: "All seminar registrations.", metric: "total_contacts" },
      { key: "topics_selected", label: "Topics selected", description: "Topic selections saved in classification payload." },
      { key: "questions_received", label: "Questions received", description: "Contacts asking seminar questions.", interest: "pastoral_visit" },
      { key: "study_note_requests", label: "Study note requests", description: "Contacts asking for notes.", interest: "bible_study" },
      { key: "bible_study_requests", label: "Bible study requests", description: "Contacts asking for Bible study.", interest: "bible_study" },
      { key: "baptism_interests", label: "Baptismal requests", description: "Contacts asking about baptism.", interest: "baptism" }
    ]
  },
  cooking_class: {
    type: "cooking_class",
    name: "Cooking Class",
    description: "Healthy cooking class follow-up.",
    formHeading: "Thank you for attending our cooking class",
    formDescription: "Select what you would like us to send after the class.",
    interestOptions: [
      { value: "cooking_class", label: "Recipes" },
      { value: "health", label: "7-Day Health Challenge" },
      { value: "cooking_class", label: "Next Cooking Class" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "baptism", label: "Baptismal Request" },
      { value: "health", label: "Health Talk" }
    ],
    defaultStatuses: ["new", "recipes_sent", "health_challenge_invited", "invited_next_class", "prayer_follow_up", "bible_study_requested", "closed"],
    defaultRoles: ["health_leader", "prayer_team", "bible_worker"],
    messageTemplates: {
      default: friendlyMessageTemplates.cookingClass,
      cooking_class: friendlyMessageTemplates.cookingClass,
      health: friendlyMessageTemplates.healthResources,
      prayer: friendlyMessageTemplates.prayer,
      baptism: friendlyMessageTemplates.healthBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total contacts", description: "All cooking class registrations.", metric: "total_contacts" },
      { key: "recipe_requests", label: "Recipe requests", description: "Contacts asking for recipes.", interest: "cooking_class" },
      { key: "next_class_interest", label: "Next class interest", description: "Contacts asking for class updates.", interest: "cooking_class" },
      { key: "health_challenge_interest", label: "Health challenge interest", description: "Contacts interested in health resources.", interest: "health" },
      { key: "prayer_requests", label: "Prayer requests", description: "Contacts asking for prayer.", interest: "prayer" },
      { key: "bible_study_requests", label: "Bible study requests", description: "Contacts asking for Bible study.", interest: "bible_study" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" }
    ]
  },
  youth_event: {
    type: "youth_event",
    name: "Youth Event",
    description: "Youth, teen, Pathfinder, Adventurer, or young adult ministry event.",
    formHeading: "Thank you for joining our youth event",
    formDescription: "Let the youth ministry team know what follow-up would help.",
    interestOptions: [
      { value: "youth", label: "Youth Updates" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "baptism", label: "Baptismal Request" },
      { value: "pastoral_visit", label: "Talk to a Leader" }
    ],
    defaultStatuses: ["new", "youth_leader_assigned", "parent_contacted", "invited_next_program", "connected", "closed"],
    defaultRoles: ["elder", "pastor", "prayer_team"],
    messageTemplates: {
      default: friendlyMessageTemplates.youthDefault,
      youth: friendlyMessageTemplates.youth,
      prayer: friendlyMessageTemplates.prayer,
      baptism: friendlyMessageTemplates.youthBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total contacts", description: "All youth event registrations.", metric: "total_contacts" },
      { key: "youth_interest", label: "Youth interests", description: "Contacts asking for youth ministry follow-up.", interest: "youth" },
      { key: "prayer_requests", label: "Prayer requests", description: "Contacts asking for prayer.", interest: "prayer" },
      { key: "bible_study_requests", label: "Bible study requests", description: "Contacts asking for Bible study.", interest: "bible_study" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" }
    ]
  },
  prayer_campaign: {
    type: "prayer_campaign",
    name: "Prayer Campaign",
    description: "Prayer emphasis, prayer room, or community prayer request follow-up.",
    formHeading: "Thank you for sharing your prayer request",
    formDescription: "Your request will be routed to trusted human prayer leaders.",
    interestOptions: [
      { value: "prayer", label: "Prayer" },
      { value: "pastoral_visit", label: "Pastor Follow-Up" },
      { value: "bible_study", label: "Bible Encouragement" },
      { value: "baptism", label: "Baptismal Request" }
    ],
    defaultStatuses: ["new", "prayer_team_assigned", "pastor_review", "followed_up", "closed"],
    defaultRoles: ["prayer_team", "pastor", "elder"],
    messageTemplates: {
      default: friendlyMessageTemplates.prayerDefault,
      prayer: friendlyMessageTemplates.prayer,
      baptism: friendlyMessageTemplates.prayerBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total requests", description: "All prayer campaign contacts.", metric: "total_contacts" },
      { key: "prayer_requests", label: "Prayer requests", description: "Contacts asking for prayer.", interest: "prayer" },
      { key: "high_priority", label: "High urgency", description: "Same-day human follow-up cases.", metric: "high_priority_count" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" },
      { key: "followed_up", label: "Followed up", description: "Contacts with follow-up progress.", metric: "followed_up_count" }
    ]
  },
  regular_member: {
    type: "regular_member",
    name: "Regular Member",
    description: "Member care, ministry interest, or internal church follow-up.",
    formHeading: "How can the church team support you?",
    formDescription: "Share the ministry area or follow-up you would like from the team.",
    interestOptions: [
      ...commonPrayerBibleHealth,
      { value: "youth", label: "Youth or Family Ministry" },
      { value: "pastoral_visit", label: "Elder or Pastor Visit" },
      { value: "baptism", label: "Baptismal Request" }
    ],
    defaultStatuses: ["new", "assigned", "member_contacted", "ministry_connected", "closed"],
    defaultRoles: ["elder", "pastor", "prayer_team", "bible_worker", "health_leader"],
    messageTemplates: {
      default: friendlyMessageTemplates.memberDefault,
      prayer: friendlyMessageTemplates.prayer,
      baptism: friendlyMessageTemplates.memberBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total member requests", description: "All member follow-up requests.", metric: "total_contacts" },
      { key: "prayer_requests", label: "Prayer requests", description: "Member prayer requests.", interest: "prayer" },
      { key: "health_interests", label: "Health interests", description: "Member health ministry interests.", interest: "health" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" },
      { key: "followed_up", label: "Followed up", description: "Requests with follow-up progress.", metric: "followed_up_count" }
    ]
  },
  baptized_member: {
    type: "baptized_member",
    name: "Baptized Member",
    description: "Post-baptism care, discipleship, and ministry connection.",
    formHeading: "Welcome to your next step in church life",
    formDescription: "Choose the support or ministry connection that would help after baptism.",
    interestOptions: [
      { value: "bible_study", label: "Discipleship Bible Study" },
      { value: "pastoral_visit", label: "Pastor or Elder Visit" },
      { value: "prayer", label: "Prayer" },
      { value: "youth", label: "Youth or Family Ministry" },
      { value: "health", label: "Health Ministry" },
      { value: "baptism", label: "Baptismal Request" }
    ],
    defaultStatuses: ["new", "discipleship_assigned", "elder_contacted", "ministry_connected", "closed"],
    defaultRoles: ["pastor", "elder", "bible_worker", "prayer_team"],
    messageTemplates: {
      default: friendlyMessageTemplates.baptizedMemberDefault,
      bible_study: friendlyMessageTemplates.baptizedMemberBibleStudy,
      prayer: friendlyMessageTemplates.prayer,
      baptism: friendlyMessageTemplates.baptizedMemberBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total contacts", description: "All post-baptism follow-ups.", metric: "total_contacts" },
      { key: "discipleship_requests", label: "Discipleship requests", description: "Bible study or discipleship interest.", interest: "bible_study" },
      { key: "pastoral_visits", label: "Pastoral visits", description: "Pastor or elder visit requests.", interest: "pastoral_visit" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" },
      { key: "followed_up", label: "Followed up", description: "Contacts with follow-up progress.", metric: "followed_up_count" }
    ]
  },
  health_seminar: {
    type: "health_seminar",
    name: "Health Seminar",
    description: "Health talk, lifestyle seminar, or NEWSTART presentation.",
    formHeading: "Thank you for attending our health seminar",
    formDescription: "Select the resources or follow-up you would like from the health team.",
    interestOptions: [
      { value: "health", label: "Seminar Notes" },
      { value: "health", label: "Lifestyle Resources" },
      { value: "cooking_class", label: "Cooking Class" },
      { value: "prayer", label: "Prayer" },
      { value: "bible_study", label: "Bible Study" },
      { value: "baptism", label: "Baptismal Request" }
    ],
    defaultStatuses: ["new", "resources_sent", "health_leader_assigned", "invited_next_program", "prayer_follow_up", "closed"],
    defaultRoles: ["health_leader", "prayer_team", "bible_worker", "pastor"],
    messageTemplates: {
      default: friendlyMessageTemplates.healthSeminarDefault,
      health: friendlyMessageTemplates.healthSeminarHealth,
      prayer: friendlyMessageTemplates.prayer,
      baptism: friendlyMessageTemplates.healthSeminarBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total contacts", description: "All health seminar registrations.", metric: "total_contacts" },
      { key: "health_interests", label: "Health interests", description: "Contacts asking for health resources.", interest: "health" },
      { key: "cooking_class_interests", label: "Cooking class interests", description: "Contacts interested in cooking class follow-up.", interest: "cooking_class" },
      { key: "prayer_requests", label: "Prayer requests", description: "Contacts asking for prayer.", interest: "prayer" },
      { key: "bible_study_interests", label: "Bible study interests", description: "Contacts asking for Bible study.", interest: "bible_study" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" }
    ]
  },
  custom: {
    type: "custom",
    name: "Custom",
    description: "General ministry event with broad routing options.",
    formHeading: "Thank you for connecting with us",
    formDescription: "Choose how the team can follow up with you.",
    interestOptions: [
      ...commonPrayerBibleHealth,
      { value: "pastoral_visit", label: "Pastoral Visit" },
      { value: "baptism", label: "Baptismal Request" },
      { value: "youth", label: "Youth" },
      { value: "cooking_class", label: "Cooking Class" }
    ],
    defaultStatuses: ["new", "assigned", "contacted", "waiting", "interested", "closed"],
    defaultRoles: ["elder", "pastor", "bible_worker", "health_leader", "prayer_team"],
    messageTemplates: {
      default: friendlyMessageTemplates.customDefault,
      prayer: friendlyMessageTemplates.prayer,
      baptism: friendlyMessageTemplates.customBaptism
    },
    reportSections: [
      { key: "total_contacts", label: "Total contacts", description: "All registrations.", metric: "total_contacts" },
      { key: "prayer_requests", label: "Prayer requests", description: "Contacts asking for prayer.", interest: "prayer" },
      { key: "bible_study_requests", label: "Bible study requests", description: "Contacts asking for Bible study.", interest: "bible_study" },
      { key: "baptism_requests", label: "Baptismal requests", description: "Contacts requesting baptism preparation.", interest: "baptism" },
      { key: "followed_up", label: "Followed up", description: "Contacts with follow-up progress.", metric: "followed_up_count" }
    ]
  }
};

const legacyTemplateMap: Record<string, EventTemplateType> = {
  church_service: "sabbath_visitor",
  visitor_sabbath: "sabbath_visitor",
  bible_study: "evangelistic_campaign",
  community_outreach: "custom",
  other: "custom"
};

export const eventTemplateTypes = eventTypeOptions;
export const eventTemplateOptions = eventTemplateTypes.map((type) => eventTemplates[type]);

export function getEventTemplate(type?: string | null): EventTemplateConfig {
  const normalizedType = type && type in legacyTemplateMap ? legacyTemplateMap[type] : type;

  if (normalizedType && normalizedType in eventTemplates) {
    return eventTemplates[normalizedType as EventTemplateType];
  }

  return eventTemplates.custom;
}
