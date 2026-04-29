import type { Interest } from "@/lib/constants";
import { getEventTemplate } from "@/lib/eventTemplates";

type MessageContact = {
  name: string;
  phone: string;
  interests: Interest[];
  churchName?: string | null;
  eventName?: string | null;
  templateType?: string | null;
  includeOptOut?: boolean;
  doNotContact?: boolean;
};

export function generateMessage(contact: MessageContact) {
  const firstName = contact.name.trim().split(/\s+/)[0] || "there";
  const churchName = contact.churchName || "our church";
  const eventLine = contact.eventName ? ` after ${contact.eventName}` : "";
  const eventName = contact.eventName || "the event";
  const template = contact.templateType ? getEventTemplate(contact.templateType) : null;
  const templateKey = chooseTemplateKey(contact.interests);
  const templateMessage = template?.messageTemplates[templateKey] ?? template?.messageTemplates.default;

  if (templateMessage) {
    return withOptOut(fillTemplate(templateMessage, { firstName, churchName, eventLine, eventName }), contact);
  }

  if (contact.interests.includes("pastoral_visit")) {
    return withOptOut(`Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You mentioned that you would appreciate a pastoral visit. Would it be alright if one of our pastoral team contacts you to find a suitable time?`, contact);
  }

  if (contact.interests.includes("baptism")) {
    return withOptOut(`Good day ${firstName}, thank you for reaching out to ${churchName}${eventLine}. We received your baptismal request and can connect you with a Bible worker to begin preparation. Would it be okay if we also share Bible study options with you?`, contact);
  }

  if (contact.interests.includes("prayer")) {
    return withOptOut(`Good day ${firstName}, thank you for trusting ${churchName}${eventLine}. We received your prayer request and would be honoured to pray with you. Would you like someone from our prayer team to check in with you?`, contact);
  }

  if (contact.interests.includes("bible_study")) {
    return withOptOut(`Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You mentioned an interest in Bible study. Would it be okay if one of our Bible workers contacts you and shares the available study options?`, contact);
  }

  if (contact.interests.includes("health")) {
    return withOptOut(`Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You showed interest in health resources. Would you like us to send a simple health resource and let you know about the next health program?`, contact);
  }

  if (contact.interests.includes("cooking_class")) {
    return withOptOut(`Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You selected cooking class updates. Would you like us to send details when the next healthy cooking session is scheduled?`, contact);
  }

  return withOptOut(`Good day ${firstName}, thank you for visiting ${churchName}${eventLine}. We are grateful you connected with us. Would it be okay if one of our team members follows up with you this week?`, contact);
}

export function waLink(phone: string, message: string) {
  let digits = phone.replace(/[^0-9]/g, "");

  if (digits.startsWith("0")) {
    digits = `27${digits.slice(1)}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function chooseTemplateKey(interests: Interest[]) {
  const priority: Interest[] = ["pastoral_visit", "baptism", "prayer", "bible_study", "health", "cooking_class", "youth"];
  return priority.find((interest) => interests.includes(interest)) ?? "default";
}

function fillTemplate(
  template: string,
  values: { firstName: string; churchName: string; eventLine: string; eventName: string }
) {
  return template
    .replaceAll("{firstName}", values.firstName)
    .replaceAll("{churchName}", values.churchName)
    .replaceAll("{eventLine}", values.eventLine)
    .replaceAll("{eventName}", values.eventName);
}

function withOptOut(message: string, contact: MessageContact) {
  if (contact.doNotContact || contact.includeOptOut === false) {
    return message;
  }

  return `${message}\n\nReply STOP if you no longer wish to receive follow-up messages.`;
}
